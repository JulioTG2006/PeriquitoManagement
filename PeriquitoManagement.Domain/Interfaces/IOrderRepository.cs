using PeriquitoManagement.Domain.Entities;

namespace PeriquitoManagement.Domain.Interfaces;

public interface IOrderRepository : IRepository<Order>
{
    Task<IReadOnlyList<Order>> GetOrdersAsync(bool activeOnly, CancellationToken cancellationToken = default);

    Task<Order?> GetByIdWithDetailsAsync(long id, CancellationToken cancellationToken = default);

    Task<Order?> GetByIdForUpdateAsync(long id, CancellationToken cancellationToken = default);

    Task<Order?> GetActiveByTableAsync(long tableId, CancellationToken cancellationToken = default);

    Task AddDetailAsync(OrderDetail detail, CancellationToken cancellationToken = default);

    void DeleteDetail(OrderDetail detail);
}
