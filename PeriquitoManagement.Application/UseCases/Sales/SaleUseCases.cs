using MediatR;
using PeriquitoManagement.Application.DTOs;
using PeriquitoManagement.Application.Exceptions;
using PeriquitoManagement.Domain.Constants;
using PeriquitoManagement.Domain.Entities;
using PeriquitoManagement.Domain.Interfaces;

namespace PeriquitoManagement.Application.UseCases.Sales;

public sealed record CompleteOrderCommand(long OrderId) : IRequest<SaleConfirmationDto>;
public sealed record GetSalesQuery(DateTimeOffset? FromUtc, DateTimeOffset? ToUtc)
    : IRequest<IReadOnlyList<SaleDto>>;
public sealed record GetSaleByIdQuery(long Id) : IRequest<SaleDto>;

public sealed class CompleteOrderHandler(
    IOrderRepository orders,
    ITableRepository tables,
    ISaleRepository sales,
    IUnitOfWork unitOfWork)
    : IRequestHandler<CompleteOrderCommand, SaleConfirmationDto>
{
    public async Task<SaleConfirmationDto> Handle(
        CompleteOrderCommand request,
        CancellationToken cancellationToken)
    {
        await unitOfWork.BeginTransactionAsync(cancellationToken);
        try
        {
            var order = await orders.GetByIdForUpdateAsync(request.OrderId, cancellationToken)
                ?? throw new NotFoundException($"Order {request.OrderId} was not found.");
            if (!OrderStatuses.Active.Contains(order.Status))
                throw new ConflictException("Only active orders can be completed.");
            if (order.OrderDetails.Count == 0)
                throw new ConflictException("An empty order cannot be completed.");
            if (order.Sale is not null || await sales.ExistsForOrderAsync(order.Id, cancellationToken))
                throw new ConflictException("This order already has a sale.");

            var total = order.OrderDetails.Sum(detail => detail.UnitPrice * detail.Quantity);
            var cost = order.OrderDetails.Sum(detail => detail.UnitCost * detail.Quantity);
            var profit = total - cost;
            if (profit < 0)
                throw new ConflictException("The sale cannot be recorded because its gross profit would be negative.");
            if (total > 9_999_999_999.99m || profit > 9_999_999_999.99m)
                throw new ConflictException("The sale amount exceeds the database numeric limit.");

            Table? table = null;
            if (order.TableId.HasValue)
            {
                table = await tables.GetByIdForUpdateAsync(order.TableId.Value, cancellationToken)
                    ?? throw new NotFoundException($"Table {order.TableId.Value} was not found.");
            }

            var sale = new Sale
            {
                OrderId = order.Id,
                Order = order,
                SoldAt = DateTime.UtcNow,
                TotalAmount = total,
                GrossProfit = profit
            };
            order.Status = OrderStatuses.Closed;
            order.ClosedAt = DateTime.UtcNow;
            order.Total = total;
            order.Sale = sale;
            if (table is not null)
                table.Status = TableStatuses.Available;

            await sales.AddAsync(sale, cancellationToken);
            orders.Update(order);
            await unitOfWork.SaveChangesAsync(cancellationToken);
            await unitOfWork.CommitTransactionAsync(cancellationToken);
            return new SaleConfirmationDto(sale.Id, sale.OrderId, sale.SoldAt, sale.TotalAmount);
        }
        catch
        {
            await unitOfWork.RollbackTransactionAsync(CancellationToken.None);
            throw;
        }
    }
}

public sealed class GetSalesHandler(ISaleRepository sales)
    : IRequestHandler<GetSalesQuery, IReadOnlyList<SaleDto>>
{
    public async Task<IReadOnlyList<SaleDto>> Handle(GetSalesQuery request, CancellationToken cancellationToken)
    {
        if (request.FromUtc.HasValue && request.ToUtc.HasValue
            && request.FromUtc.Value > request.ToUtc.Value)
            throw new ValidationException(new Dictionary<string, string[]>
            {
                ["dateRange"] = ["FromUtc must be earlier than or equal to ToUtc."]
            });

        var records = await sales.GetBetweenAsync(
            request.FromUtc?.UtcDateTime,
            request.ToUtc?.UtcDateTime,
            cancellationToken);
        return records.Select(SaleMapping.ToDto).ToArray();
    }
}

public sealed class GetSaleByIdHandler(ISaleRepository sales)
    : IRequestHandler<GetSaleByIdQuery, SaleDto>
{
    public async Task<SaleDto> Handle(GetSaleByIdQuery request, CancellationToken cancellationToken)
    {
        var sale = await sales.GetByIdWithOrderAsync(request.Id, cancellationToken)
            ?? throw new NotFoundException($"Sale {request.Id} was not found.");
        return SaleMapping.ToDto(sale);
    }
}

internal static class SaleMapping
{
    public static SaleDto ToDto(Sale sale) =>
        new(sale.Id, sale.OrderId, sale.SoldAt, sale.TotalAmount, sale.GrossProfit);
}
