using PeriquitoManagement.Domain.Entities;

namespace PeriquitoManagement.Domain.Interfaces;

public interface ITableRepository : IRepository<Table>
{
    Task<IReadOnlyList<Table>> GetByStatusAsync(string? status, CancellationToken cancellationToken = default);

    Task<bool> NumberExistsAsync(short tableNumber, long? excludedId = null, CancellationToken cancellationToken = default);

    Task<bool> HasOrderHistoryAsync(long tableId, CancellationToken cancellationToken = default);

    Task<bool> HasActiveOrderAsync(long tableId, CancellationToken cancellationToken = default);

    Task<Table?> GetByIdForUpdateAsync(long id, CancellationToken cancellationToken = default);
}
