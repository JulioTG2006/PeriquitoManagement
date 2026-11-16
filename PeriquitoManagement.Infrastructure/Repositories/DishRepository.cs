using Microsoft.EntityFrameworkCore;
using PeriquitoManagement.Domain.Entities;
using PeriquitoManagement.Domain.Interfaces;
using PeriquitoManagement.Infrastructure.Persistence;

namespace PeriquitoManagement.Infrastructure.Repositories;

public sealed class DishRepository(PeriquitoDbContext context)
    : Repository<Dish>(context), IDishRepository
{
    public async Task<IReadOnlyList<Dish>> GetWithCategoryAsync(
        long? categoryId,
        bool? isAvailable,
        CancellationToken cancellationToken = default)
    {
        var query = Context.Dishes.AsNoTracking().Include(dish => dish.Category).AsQueryable();
        if (categoryId.HasValue)
            query = query.Where(dish => dish.CategoryId == categoryId.Value);
        if (isAvailable.HasValue)
            query = query.Where(dish => dish.IsAvailable == isAvailable.Value);
        return await query.OrderBy(dish => dish.Name).ToListAsync(cancellationToken);
    }

    public Task<Dish?> GetByIdWithCategoryAsync(long id, CancellationToken cancellationToken = default)
    {
        return Context.Dishes.Include(dish => dish.Category)
            .FirstOrDefaultAsync(dish => dish.Id == id, cancellationToken);
    }

    public Task<Category?> GetCategoryByIdAsync(long categoryId, CancellationToken cancellationToken = default)
    {
        return Context.Categories.AsNoTracking()
            .FirstOrDefaultAsync(category => category.Id == categoryId, cancellationToken);
    }

    public Task<bool> NameExistsAsync(string name, long? excludedId = null, CancellationToken cancellationToken = default)
    {
        var query = Context.Dishes.Where(dish => dish.Name == name);
        if (excludedId.HasValue)
            query = query.Where(dish => dish.Id != excludedId.Value);
        return query.AnyAsync(cancellationToken);
    }

    public Task<bool> CategoryExistsAsync(long categoryId, CancellationToken cancellationToken = default)
    {
        return Context.Categories.AnyAsync(category => category.Id == categoryId, cancellationToken);
    }

    public Task<bool> HasOrderHistoryAsync(long dishId, CancellationToken cancellationToken = default)
    {
        return Context.OrderDetails.AnyAsync(detail => detail.DishId == dishId, cancellationToken);
    }
}
