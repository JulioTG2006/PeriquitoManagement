using Microsoft.EntityFrameworkCore;
using PeriquitoManagement.Domain.Entities;
using PeriquitoManagement.Domain.Interfaces;
using PeriquitoManagement.Infrastructure.Persistence;

namespace PeriquitoManagement.Infrastructure.Repositories;

public sealed class IngredientRepository(PeriquitoDbContext context)
    : Repository<Ingredient>(context), IIngredientRepository
{
    public Task<bool> NameExistsAsync(
        string name,
        long? excludedId = null,
        CancellationToken cancellationToken = default)
    {
        var normalized = name.Trim().ToLower();
        var query = Context.Ingredients.Where(ingredient => ingredient.Name.ToLower() == normalized);
        if (excludedId.HasValue)
            query = query.Where(ingredient => ingredient.Id != excludedId.Value);
        return query.AnyAsync(cancellationToken);
    }

    public Task LockNameAsync(string name, CancellationToken cancellationToken = default)
    {
        var normalized = name.Trim().ToLowerInvariant();
        return Context.Database.ExecuteSqlInterpolatedAsync(
            $"SELECT pg_advisory_xact_lock(hashtext({normalized}), 728391)",
            cancellationToken);
    }

    public Task<Ingredient?> GetByIdForUpdateAsync(
        long id,
        CancellationToken cancellationToken = default)
    {
        return Context.Ingredients
            .FromSqlInterpolated($"SELECT * FROM ingredients WHERE id = {id} FOR UPDATE")
            .FirstOrDefaultAsync(cancellationToken);
    }

    public Task<Ingredient?> GetByIdNoTrackingAsync(
        long id,
        CancellationToken cancellationToken = default)
    {
        return Context.Ingredients.AsNoTracking()
            .FirstOrDefaultAsync(ingredient => ingredient.Id == id, cancellationToken);
    }

    public async Task<IReadOnlyList<Ingredient>> GetLowStockAsync(
        CancellationToken cancellationToken = default)
    {
        return await Context.Ingredients.AsNoTracking()
            .Where(ingredient => ingredient.CurrentStock <= ingredient.MinimumStock)
            .OrderBy(ingredient => ingredient.Name)
            .ToListAsync(cancellationToken);
    }

    public Task<bool> HasMovementsAsync(
        long ingredientId,
        CancellationToken cancellationToken = default)
    {
        return Context.InventoryMovements
            .AnyAsync(movement => movement.IngredientId == ingredientId, cancellationToken);
    }
}
