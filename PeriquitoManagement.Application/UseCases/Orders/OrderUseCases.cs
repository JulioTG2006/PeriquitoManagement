using MediatR;
using PeriquitoManagement.Application.DTOs;
using PeriquitoManagement.Application.Exceptions;
using PeriquitoManagement.Domain.Constants;
using PeriquitoManagement.Domain.Entities;
using PeriquitoManagement.Domain.Interfaces;

namespace PeriquitoManagement.Application.UseCases.Orders;

public sealed record GetActiveOrdersQuery : IRequest<IReadOnlyList<OrderDto>>;
public sealed record GetAdminActiveOrdersQuery : IRequest<IReadOnlyList<AdminOrderDto>>;
public sealed record GetAllOrdersQuery : IRequest<IReadOnlyList<AdminOrderDto>>;
public sealed record GetOrderByIdQuery(long Id) : IRequest<OrderDto>;
public sealed record GetAdminOrderByIdQuery(long Id) : IRequest<AdminOrderDto>;
public sealed record GetActiveOrderByTableQuery(long TableId) : IRequest<OrderDto>;
public sealed record GetAdminActiveOrderByTableQuery(long TableId) : IRequest<AdminOrderDto>;
public sealed record CreateOrderCommand(long TableId, long WaiterId) : IRequest<OrderDto>;
public sealed record AddOrderItemCommand(long OrderId, long DishId, int Quantity) : IRequest<OrderDto>;
public sealed record SetOrderItemQuantityCommand(long OrderId, long DishId, int Quantity) : IRequest<OrderDto>;
public sealed record RemoveOrderItemCommand(long OrderId, long DishId) : IRequest<OrderDto>;
public sealed record CancelOrderCommand(long OrderId) : IRequest<OrderDto>;

public sealed class GetActiveOrdersHandler(IOrderRepository orders)
    : IRequestHandler<GetActiveOrdersQuery, IReadOnlyList<OrderDto>>
{
    public async Task<IReadOnlyList<OrderDto>> Handle(GetActiveOrdersQuery request, CancellationToken cancellationToken)
    {
        var records = await orders.GetOrdersAsync(activeOnly: true, cancellationToken);
        return records.Select(OrderMapping.ToPublicDto).ToArray();
    }
}

public sealed class GetAllOrdersHandler(IOrderRepository orders)
    : IRequestHandler<GetAllOrdersQuery, IReadOnlyList<AdminOrderDto>>
{
    public async Task<IReadOnlyList<AdminOrderDto>> Handle(GetAllOrdersQuery request, CancellationToken cancellationToken)
    {
        var records = await orders.GetOrdersAsync(activeOnly: false, cancellationToken);
        return records.Select(OrderMapping.ToAdminDto).ToArray();
    }
}

public sealed class GetAdminActiveOrdersHandler(IOrderRepository orders)
    : IRequestHandler<GetAdminActiveOrdersQuery, IReadOnlyList<AdminOrderDto>>
{
    public async Task<IReadOnlyList<AdminOrderDto>> Handle(GetAdminActiveOrdersQuery request, CancellationToken cancellationToken)
    {
        var records = await orders.GetOrdersAsync(activeOnly: true, cancellationToken);
        return records.Select(OrderMapping.ToAdminDto).ToArray();
    }
}

public sealed class GetOrderByIdHandler(IOrderRepository orders)
    : IRequestHandler<GetOrderByIdQuery, OrderDto>
{
    public async Task<OrderDto> Handle(GetOrderByIdQuery request, CancellationToken cancellationToken)
    {
        var order = await orders.GetByIdWithDetailsAsync(request.Id, cancellationToken);
        if (order is null || !OrderStatuses.Active.Contains(order.Status))
            throw new NotFoundException($"Active order {request.Id} was not found.");
        return OrderMapping.ToPublicDto(order);
    }
}

public sealed class GetAdminOrderByIdHandler(IOrderRepository orders)
    : IRequestHandler<GetAdminOrderByIdQuery, AdminOrderDto>
{
    public async Task<AdminOrderDto> Handle(GetAdminOrderByIdQuery request, CancellationToken cancellationToken)
    {
        var order = await orders.GetByIdWithDetailsAsync(request.Id, cancellationToken)
            ?? throw new NotFoundException($"Order {request.Id} was not found.");
        return OrderMapping.ToAdminDto(order);
    }
}

public sealed class GetActiveOrderByTableHandler(IOrderRepository orders)
    : IRequestHandler<GetActiveOrderByTableQuery, OrderDto>
{
    public async Task<OrderDto> Handle(GetActiveOrderByTableQuery request, CancellationToken cancellationToken)
    {
        var order = await orders.GetActiveByTableAsync(request.TableId, cancellationToken)
            ?? throw new NotFoundException($"No active order exists for table {request.TableId}.");
        return OrderMapping.ToPublicDto(order);
    }
}

public sealed class GetAdminActiveOrderByTableHandler(IOrderRepository orders)
    : IRequestHandler<GetAdminActiveOrderByTableQuery, AdminOrderDto>
{
    public async Task<AdminOrderDto> Handle(GetAdminActiveOrderByTableQuery request, CancellationToken cancellationToken)
    {
        var order = await orders.GetActiveByTableAsync(request.TableId, cancellationToken)
            ?? throw new NotFoundException($"No active order exists for table {request.TableId}.");
        return OrderMapping.ToAdminDto(order);
    }
}

public sealed class CreateOrderHandler(
    IOrderRepository orders,
    ITableRepository tables,
    IUnitOfWork unitOfWork)
    : IRequestHandler<CreateOrderCommand, OrderDto>
{
    public async Task<OrderDto> Handle(CreateOrderCommand request, CancellationToken cancellationToken)
    {
        await unitOfWork.BeginTransactionAsync(cancellationToken);
        try
        {
            var table = await tables.GetByIdForUpdateAsync(request.TableId, cancellationToken)
                ?? throw new NotFoundException($"Table {request.TableId} was not found.");
            if (table.Status != TableStatuses.Available
                || await tables.HasActiveOrderAsync(table.Id, cancellationToken))
                throw new ConflictException("The table already has an active order or is unavailable.");

            var order = new Order
            {
                TableId = table.Id,
                Table = table,
                WaiterId = request.WaiterId,
                OrderedAt = DateTime.UtcNow,
                Status = OrderStatuses.Open,
                Total = 0m
            };
            table.Status = TableStatuses.Occupied;
            await orders.AddAsync(order, cancellationToken);
            await unitOfWork.SaveChangesAsync(cancellationToken);
            await unitOfWork.CommitTransactionAsync(cancellationToken);
            return OrderMapping.ToPublicDto(
                await orders.GetByIdWithDetailsAsync(order.Id, cancellationToken) ?? order);
        }
        catch
        {
            await unitOfWork.RollbackTransactionAsync(CancellationToken.None);
            throw;
        }
    }
}

public sealed class AddOrderItemHandler(
    IOrderRepository orders,
    IDishRepository dishes,
    IUnitOfWork unitOfWork)
    : IRequestHandler<AddOrderItemCommand, OrderDto>
{
    public async Task<OrderDto> Handle(AddOrderItemCommand request, CancellationToken cancellationToken)
    {
        if (request.Quantity <= 0)
            throw OrderValidation.InvalidQuantity();
        await unitOfWork.BeginTransactionAsync(cancellationToken);
        try
        {
            var order = await OrderCommands.ActiveOrderForUpdateAsync(orders, request.OrderId, cancellationToken);
            var dish = await dishes.GetByIdWithCategoryAsync(request.DishId, cancellationToken)
                ?? throw new NotFoundException($"Dish {request.DishId} was not found.");
            if (!dish.IsAvailable)
                throw new ConflictException("Unavailable dishes cannot be added to an order.");

            var detail = order.OrderDetails.FirstOrDefault(item => item.DishId == dish.Id);
            if (detail is null)
            {
                detail = new OrderDetail
                {
                    OrderId = order.Id,
                    Order = order,
                    DishId = dish.Id,
                    Dish = dish,
                    Quantity = request.Quantity,
                    UnitPrice = dish.Price,
                    UnitCost = dish.Cost
                };
                order.OrderDetails.Add(detail);
                await orders.AddDetailAsync(detail, cancellationToken);
            }
            else
            {
                if (request.Quantity > int.MaxValue - detail.Quantity)
                    throw OrderValidation.InvalidQuantity();
                detail.Quantity = checked(detail.Quantity + request.Quantity);
            }

            OrderTotals.Recalculate(order);
            orders.Update(order);
            await unitOfWork.SaveChangesAsync(cancellationToken);
            await unitOfWork.CommitTransactionAsync(cancellationToken);
            return OrderMapping.ToPublicDto(order);
        }
        catch
        {
            await unitOfWork.RollbackTransactionAsync(CancellationToken.None);
            throw;
        }
    }
}

public sealed class SetOrderItemQuantityHandler(
    IOrderRepository orders,
    IDishRepository dishes,
    IUnitOfWork unitOfWork)
    : IRequestHandler<SetOrderItemQuantityCommand, OrderDto>
{
    public async Task<OrderDto> Handle(SetOrderItemQuantityCommand request, CancellationToken cancellationToken)
    {
        if (request.Quantity <= 0)
            throw OrderValidation.InvalidQuantity();
        await unitOfWork.BeginTransactionAsync(cancellationToken);
        try
        {
            var order = await OrderCommands.ActiveOrderForUpdateAsync(orders, request.OrderId, cancellationToken);
            var detail = order.OrderDetails.FirstOrDefault(item => item.DishId == request.DishId)
                ?? throw new NotFoundException("The dish is not part of this order.");
            if (request.Quantity > detail.Quantity)
            {
                var dish = await dishes.GetByIdWithCategoryAsync(request.DishId, cancellationToken)
                    ?? throw new NotFoundException($"Dish {request.DishId} was not found.");
                if (!dish.IsAvailable)
                    throw new ConflictException("Unavailable dishes cannot be added to an order.");
            }
            detail.Quantity = request.Quantity;
            OrderTotals.Recalculate(order);
            orders.Update(order);
            await unitOfWork.SaveChangesAsync(cancellationToken);
            await unitOfWork.CommitTransactionAsync(cancellationToken);
            return OrderMapping.ToPublicDto(order);
        }
        catch
        {
            await unitOfWork.RollbackTransactionAsync(CancellationToken.None);
            throw;
        }
    }
}

public sealed class RemoveOrderItemHandler(IOrderRepository orders, IUnitOfWork unitOfWork)
    : IRequestHandler<RemoveOrderItemCommand, OrderDto>
{
    public async Task<OrderDto> Handle(RemoveOrderItemCommand request, CancellationToken cancellationToken)
    {
        await unitOfWork.BeginTransactionAsync(cancellationToken);
        try
        {
            var order = await OrderCommands.ActiveOrderForUpdateAsync(orders, request.OrderId, cancellationToken);
            var detail = order.OrderDetails.FirstOrDefault(item => item.DishId == request.DishId)
                ?? throw new NotFoundException("The dish is not part of this order.");
            order.OrderDetails.Remove(detail);
            orders.DeleteDetail(detail);
            OrderTotals.Recalculate(order);
            orders.Update(order);
            await unitOfWork.SaveChangesAsync(cancellationToken);
            await unitOfWork.CommitTransactionAsync(cancellationToken);
            return OrderMapping.ToPublicDto(order);
        }
        catch
        {
            await unitOfWork.RollbackTransactionAsync(CancellationToken.None);
            throw;
        }
    }
}

public sealed class CancelOrderHandler(
    IOrderRepository orders,
    ITableRepository tables,
    IUnitOfWork unitOfWork)
    : IRequestHandler<CancelOrderCommand, OrderDto>
{
    public async Task<OrderDto> Handle(CancelOrderCommand request, CancellationToken cancellationToken)
    {
        await unitOfWork.BeginTransactionAsync(cancellationToken);
        try
        {
            var order = await OrderCommands.ActiveOrderForUpdateAsync(orders, request.OrderId, cancellationToken);
            if (order.TableId.HasValue)
            {
                var table = await tables.GetByIdForUpdateAsync(order.TableId.Value, cancellationToken)
                    ?? throw new NotFoundException($"Table {order.TableId.Value} was not found.");
                table.Status = TableStatuses.Available;
            }
            order.Status = OrderStatuses.Cancelled;
            order.ClosedAt = DateTime.UtcNow;
            orders.Update(order);
            await unitOfWork.SaveChangesAsync(cancellationToken);
            await unitOfWork.CommitTransactionAsync(cancellationToken);
            return OrderMapping.ToPublicDto(order);
        }
        catch
        {
            await unitOfWork.RollbackTransactionAsync(CancellationToken.None);
            throw;
        }
    }
}

internal static class OrderMapping
{
    public static OrderDto ToPublicDto(Order order) => new(
        order.Id, order.TableId, order.Table?.TableNumber, order.WaiterId,
        order.Waiter?.Username ?? string.Empty, order.OrderedAt, order.ClosedAt, order.Status,
        order.Total, order.OrderDetails.Select(detail => new OrderDetailDto(
            detail.Id, detail.DishId, detail.Dish?.Name ?? string.Empty, detail.Quantity,
            detail.UnitPrice, detail.UnitPrice * detail.Quantity)).ToArray());

    public static AdminOrderDto ToAdminDto(Order order) => new(
        order.Id, order.TableId, order.Table?.TableNumber, order.WaiterId,
        order.Waiter?.Username ?? string.Empty, order.OrderedAt, order.ClosedAt, order.Status,
        order.Total,
        order.OrderDetails.Sum(detail => detail.UnitCost * detail.Quantity),
        order.OrderDetails.Select(detail => new AdminOrderDetailDto(
            detail.Id, detail.DishId, detail.Dish?.Name ?? string.Empty, detail.Quantity,
            detail.UnitPrice, detail.UnitCost, detail.UnitPrice * detail.Quantity)).ToArray());
}

internal static class OrderTotals
{
    private const decimal MaximumTotal = 9_999_999_999.99m;

    public static void Recalculate(Order order)
    {
        var total = order.OrderDetails.Sum(detail => detail.UnitPrice * detail.Quantity);
        if (total > MaximumTotal)
            throw new ValidationException(new Dictionary<string, string[]>
            {
                ["total"] = ["Order total exceeds NUMERIC(12,2)."]
            });
        order.Total = total;
    }
}

internal static class OrderValidation
{
    public static ValidationException InvalidQuantity() =>
        new(new Dictionary<string, string[]> { ["quantity"] = ["Quantity must be greater than zero."] });
}

internal static class OrderCommands
{
    public static async Task<Order> ActiveOrderForUpdateAsync(
        IOrderRepository orders,
        long id,
        CancellationToken cancellationToken)
    {
        var order = await orders.GetByIdForUpdateAsync(id, cancellationToken)
            ?? throw new NotFoundException($"Order {id} was not found.");
        if (!OrderStatuses.Active.Contains(order.Status))
            throw new ConflictException("A finalized or cancelled order cannot be modified.");
        return order;
    }
}
