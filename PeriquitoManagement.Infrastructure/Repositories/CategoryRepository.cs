using Microsoft.EntityFrameworkCore;
using PeriquitoManagement.Domain.Entities;
using PeriquitoManagement.Domain.Interfaces;
using PeriquitoManagement.Infrastructure.Persistence;

namespace PeriquitoManagement.Infrastructure.Repositories;

public sealed class CategoryRepository(PeriquitoDbContext context)
    : Repository<Category>(context), ICategoryRepository
{
    public Task<bool> NameExistsAsync(
        string name,
        long? excludedId = null,
        CancellationToken cancellationToken = default)
    {
        var escapedName = name
            .Replace("\\", "\\\\")
            .Replace("%", "\\%")
            .Replace("_", "\\_");

        var query = Context.Categories
            .Where(category => EF.Functions.ILike(category.Name, escapedName, "\\"));

        if (excludedId.HasValue)
            query = query.Where(category => category.Id != excludedId.Value);

        return query.AnyAsync(cancellationToken);
    }

    public Task<bool> HasDishesAsync(
        long categoryId,
        CancellationToken cancellationToken = default)
    {
        return Context.Dishes.AnyAsync(
            dish => dish.CategoryId == categoryId,
            cancellationToken);
    }
}
