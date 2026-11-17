using Microsoft.EntityFrameworkCore;
using PeriquitoManagement.Domain.Constants;
using PeriquitoManagement.Domain.Entities;
using PeriquitoManagement.Domain.Interfaces;
using PeriquitoManagement.Infrastructure.Persistence;

namespace PeriquitoManagement.Infrastructure.Repositories;

public sealed class TableRepository(PeriquitoDbContext context)
    : Repository<Table>(context), ITableRepository
{
    public async Task<IReadOnlyList<Table>> GetByStatusAsync(
        string? status,
        CancellationToken cancellationToken = default)
    {
        var query = Context.Tables.AsNoTracking();
        if (status is not null)
            query = query.Where(table => table.Status == status);
        return await query.OrderBy(table => table.TableNumber).ToListAsync(cancellationToken);
    }

    public Task<bool> NumberExistsAsync(
        short tableNumber,
        long? excludedId = null,
        CancellationToken cancellationToken = default)
    {
        var query = Context.Tables.Where(table => table.TableNumber == tableNumber);
        if (excludedId.HasValue)
            query = query.Where(table => table.Id != excludedId.Value);
        return query.AnyAsync(cancellationToken);
    }

    public Task<bool> HasOrderHistoryAsync(long tableId, CancellationToken cancellationToken = default)
    {
        return Context.Orders.AnyAsync(order => order.TableId == tableId, cancellationToken);
    }

    public Task<bool> HasActiveOrderAsync(long tableId, CancellationToken cancellationToken = default)
    {
        return Context.Orders.AnyAsync(order => order.TableId == tableId
            && OrderStatuses.Active.Contains(order.Status), cancellationToken);
    }

    public Task<Table?> GetByIdForUpdateAsync(long id, CancellationToken cancellationToken = default)
    {
        return Context.Tables.FromSqlInterpolated(
                $"SELECT * FROM \"tables\" WHERE id = {id} FOR UPDATE")
            .FirstOrDefaultAsync(cancellationToken);
    }
}
