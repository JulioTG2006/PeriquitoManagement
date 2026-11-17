using PeriquitoManagement.Domain.Entities;

namespace PeriquitoManagement.Domain.Interfaces;

public interface ISaleRepository : IRepository<Sale>
{
    Task<bool> ExistsForOrderAsync(long orderId, CancellationToken cancellationToken = default);

    Task<Sale?> GetByIdWithOrderAsync(long id, CancellationToken cancellationToken = default);

    Task<IReadOnlyList<Sale>> GetBetweenAsync(
        DateTime? fromUtc,
        DateTime? toUtc,
        CancellationToken cancellationToken = default);
}
