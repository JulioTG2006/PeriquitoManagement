using PeriquitoManagement.Domain.Entities;

namespace PeriquitoManagement.Domain.Interfaces;

public interface IDishRepository : IRepository<Dish>
{
    Task<IReadOnlyList<Dish>> GetWithCategoryAsync(
        long? categoryId,
        bool? isAvailable,
        CancellationToken cancellationToken = default);

    Task<Dish?> GetByIdWithCategoryAsync(long id, CancellationToken cancellationToken = default);

    Task<Category?> GetCategoryByIdAsync(long categoryId, CancellationToken cancellationToken = default);

    Task<bool> NameExistsAsync(string name, long? excludedId = null, CancellationToken cancellationToken = default);

    Task<bool> CategoryExistsAsync(long categoryId, CancellationToken cancellationToken = default);

    Task<bool> HasOrderHistoryAsync(long dishId, CancellationToken cancellationToken = default);
}
