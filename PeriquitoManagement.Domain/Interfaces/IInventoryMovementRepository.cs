using PeriquitoManagement.Domain.Entities;

namespace PeriquitoManagement.Domain.Interfaces;

public interface IInventoryMovementRepository : IRepository<InventoryMovement>
{
    Task<IReadOnlyList<InventoryMovement>> GetHistoryAsync(
        long? ingredientId,
        string? movementType,
        DateTime? fromUtc,
        DateTime? toUtc,
        CancellationToken cancellationToken = default);
}
