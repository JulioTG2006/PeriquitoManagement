using Microsoft.EntityFrameworkCore;
using PeriquitoManagement.Domain.Constants;
using PeriquitoManagement.Domain.Entities;
using PeriquitoManagement.Domain.Interfaces;
using PeriquitoManagement.Infrastructure.Persistence;

namespace PeriquitoManagement.Infrastructure.Repositories;

public sealed class OrderRepository(PeriquitoDbContext context)
    : Repository<Order>(context), IOrderRepository
{
    public async Task<IReadOnlyList<Order>> GetOrdersAsync(
        bool activeOnly,
        CancellationToken cancellationToken = default)
    {
        var query = QueryWithDetails();
        if (activeOnly)
            query = query.Where(order => OrderStatuses.Active.Contains(order.Status));
        return await query.OrderByDescending(order => order.OrderedAt)
            .ToListAsync(cancellationToken);
    }

    public Task<Order?> GetByIdWithDetailsAsync(long id, CancellationToken cancellationToken = default)
    {
        return QueryWithDetails().FirstOrDefaultAsync(order => order.Id == id, cancellationToken);
    }

    public async Task<Order?> GetByIdForUpdateAsync(long id, CancellationToken cancellationToken = default)
    {
        var locked = await Context.Orders.FromSqlInterpolated(
                $"SELECT * FROM orders WHERE id = {id} FOR UPDATE")
            .FirstOrDefaultAsync(cancellationToken);
        if (locked is null)
            return null;
        return await GetByIdWithDetailsAsync(id, cancellationToken);
    }

    public Task<Order?> GetActiveByTableAsync(long tableId, CancellationToken cancellationToken = default)
    {
        return QueryWithDetails()
            .FirstOrDefaultAsync(order => order.TableId == tableId
                && OrderStatuses.Active.Contains(order.Status), cancellationToken);
    }

    public Task AddDetailAsync(OrderDetail detail, CancellationToken cancellationToken = default)
    {
        return Context.OrderDetails.AddAsync(detail, cancellationToken).AsTask();
    }

    public void DeleteDetail(OrderDetail detail)
    {
        Context.OrderDetails.Remove(detail);
    }

    private IQueryable<Order> QueryWithDetails()
    {
        return Context.Orders
            .Include(order => order.Table)
            .Include(order => order.Waiter)
            .Include(order => order.OrderDetails)
                .ThenInclude(detail => detail.Dish)
            .Include(order => order.Sale)
            .AsQueryable();
    }
}
