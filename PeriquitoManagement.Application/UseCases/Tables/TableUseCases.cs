using MediatR;
using PeriquitoManagement.Application.DTOs;
using PeriquitoManagement.Application.Exceptions;
using PeriquitoManagement.Domain.Constants;
using PeriquitoManagement.Domain.Entities;
using PeriquitoManagement.Domain.Interfaces;

namespace PeriquitoManagement.Application.UseCases.Tables;

public sealed record GetTablesQuery(string? Status = null) : IRequest<IReadOnlyList<TableDto>>;
public sealed record GetTableByIdQuery(long Id) : IRequest<TableDto>;
public sealed record CreateTableCommand(short TableNumber, short Capacity) : IRequest<TableDto>;
public sealed record UpdateTableCommand(long Id, short TableNumber, short Capacity) : IRequest<TableDto>;
public sealed record DeleteTableCommand(long Id) : IRequest;

public sealed class GetTablesHandler(ITableRepository tables)
    : IRequestHandler<GetTablesQuery, IReadOnlyList<TableDto>>
{
    public async Task<IReadOnlyList<TableDto>> Handle(GetTablesQuery request, CancellationToken cancellationToken)
    {
        if (request.Status is not null && request.Status is not (
                TableStatuses.Available or TableStatuses.Occupied or
                TableStatuses.Reserved or TableStatuses.OutOfService))
            throw new ValidationException(new Dictionary<string, string[]>
            {
                ["status"] = ["Unsupported table status."]
            });
        var entities = await tables.GetByStatusAsync(request.Status, cancellationToken);
        return entities.Select(TableMapping.ToDto).ToArray();
    }
}

public sealed class GetTableByIdHandler(ITableRepository tables)
    : IRequestHandler<GetTableByIdQuery, TableDto>
{
    public async Task<TableDto> Handle(GetTableByIdQuery request, CancellationToken cancellationToken)
    {
        var table = await tables.GetByIdAsync(request.Id, cancellationToken)
            ?? throw new NotFoundException($"Table {request.Id} was not found.");
        return TableMapping.ToDto(table);
    }
}

public sealed class CreateTableHandler(ITableRepository tables, IUnitOfWork unitOfWork)
    : IRequestHandler<CreateTableCommand, TableDto>
{
    public async Task<TableDto> Handle(CreateTableCommand request, CancellationToken cancellationToken)
    {
        Validate(request.TableNumber, request.Capacity);
        if (await tables.NumberExistsAsync(request.TableNumber, cancellationToken: cancellationToken))
            throw new ConflictException("A table with this number already exists.");
        var table = new Table
        {
            TableNumber = request.TableNumber,
            Capacity = request.Capacity,
            Status = TableStatuses.Available
        };
        await tables.AddAsync(table, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);
        return TableMapping.ToDto(table);
    }

    internal static void Validate(short number, short capacity)
    {
        if (number <= 0 || capacity <= 0)
            throw new ValidationException(new Dictionary<string, string[]>
            {
                ["table"] = ["Table number and capacity must be positive."]
            });
    }
}

public sealed class UpdateTableHandler(ITableRepository tables, IUnitOfWork unitOfWork)
    : IRequestHandler<UpdateTableCommand, TableDto>
{
    public async Task<TableDto> Handle(UpdateTableCommand request, CancellationToken cancellationToken)
    {
        var table = await tables.GetByIdAsync(request.Id, cancellationToken)
            ?? throw new NotFoundException($"Table {request.Id} was not found.");
        CreateTableHandler.Validate(request.TableNumber, request.Capacity);
        if (await tables.NumberExistsAsync(request.TableNumber, request.Id, cancellationToken))
            throw new ConflictException("A table with this number already exists.");
        table.TableNumber = request.TableNumber;
        table.Capacity = request.Capacity;
        tables.Update(table);
        await unitOfWork.SaveChangesAsync(cancellationToken);
        return TableMapping.ToDto(table);
    }
}

public sealed class DeleteTableHandler(ITableRepository tables, IUnitOfWork unitOfWork)
    : IRequestHandler<DeleteTableCommand>
{
    public async Task Handle(DeleteTableCommand request, CancellationToken cancellationToken)
    {
        var table = await tables.GetByIdAsync(request.Id, cancellationToken)
            ?? throw new NotFoundException($"Table {request.Id} was not found.");
        if (await tables.HasOrderHistoryAsync(request.Id, cancellationToken))
            throw new ConflictException("A table with order history cannot be deleted.");
        tables.Delete(table);
        await unitOfWork.SaveChangesAsync(cancellationToken);
    }
}

internal static class TableMapping
{
    public static TableDto ToDto(Table table) =>
        new(table.Id, table.TableNumber, table.Capacity, table.Status);
}
