using PeriquitoManagement.Domain.Entities;

namespace PeriquitoManagement.Domain.Interfaces;

public interface ICategoryRepository : IRepository<Category>
{
    Task<bool> NameExistsAsync(
        string name,
        long? excludedId = null,
        CancellationToken cancellationToken = default);

    Task<bool> HasDishesAsync(
        long categoryId,
        CancellationToken cancellationToken = default);
}
