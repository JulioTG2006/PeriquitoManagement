using PeriquitoManagement.Domain.Entities;

namespace PeriquitoManagement.Domain.Interfaces;

public interface IIngredientRepository : IRepository<Ingredient>
{
    Task<bool> NameExistsAsync(
        string name,
        long? excludedId = null,
        CancellationToken cancellationToken = default);

    Task LockNameAsync(string name, CancellationToken cancellationToken = default);

    Task<Ingredient?> GetByIdForUpdateAsync(long id, CancellationToken cancellationToken = default);

    Task<Ingredient?> GetByIdNoTrackingAsync(long id, CancellationToken cancellationToken = default);

    Task<IReadOnlyList<Ingredient>> GetLowStockAsync(CancellationToken cancellationToken = default);

    Task<bool> HasMovementsAsync(long ingredientId, CancellationToken cancellationToken = default);
}
