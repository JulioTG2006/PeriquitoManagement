using Microsoft.EntityFrameworkCore;
using PeriquitoManagement.Domain.Entities;
using PeriquitoManagement.Domain.Interfaces;
using PeriquitoManagement.Infrastructure.Persistence;

namespace PeriquitoManagement.Infrastructure.Repositories;

public sealed class SaleRepository(PeriquitoDbContext context)
    : Repository<Sale>(context), ISaleRepository
{
    public Task<bool> ExistsForOrderAsync(long orderId, CancellationToken cancellationToken = default)
    {
        return Context.Sales.AnyAsync(sale => sale.OrderId == orderId, cancellationToken);
    }

    public Task<Sale?> GetByIdWithOrderAsync(long id, CancellationToken cancellationToken = default)
    {
        return Context.Sales.AsNoTracking()
            .Include(sale => sale.Order).ThenInclude(order => order.Table)
            .Include(sale => sale.Order).ThenInclude(order => order.Waiter)
            .Include(sale => sale.Order).ThenInclude(order => order.OrderDetails).ThenInclude(detail => detail.Dish)
            .AsSplitQuery()
            .FirstOrDefaultAsync(sale => sale.Id == id, cancellationToken);
    }

    public async Task<IReadOnlyList<Sale>> GetBetweenAsync(
        DateTime? fromUtc,
        DateTime? toUtc,
        CancellationToken cancellationToken = default)
    {
        var query = Context.Sales.AsNoTracking()
            .Include(sale => sale.Order).ThenInclude(order => order.Table)
            .Include(sale => sale.Order).ThenInclude(order => order.Waiter)
            .Include(sale => sale.Order).ThenInclude(order => order.OrderDetails).ThenInclude(detail => detail.Dish)
            .AsSplitQuery();
        if (fromUtc.HasValue)
            query = query.Where(sale => sale.SoldAt >= fromUtc.Value);
        if (toUtc.HasValue)
            query = query.Where(sale => sale.SoldAt <= toUtc.Value);
        return await query.OrderByDescending(sale => sale.SoldAt)
            .ToListAsync(cancellationToken);
    }
}
