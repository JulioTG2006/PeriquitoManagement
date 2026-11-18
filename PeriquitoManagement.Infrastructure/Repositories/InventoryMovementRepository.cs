using Microsoft.EntityFrameworkCore;
using PeriquitoManagement.Domain.Entities;
using PeriquitoManagement.Domain.Interfaces;
using PeriquitoManagement.Infrastructure.Persistence;

namespace PeriquitoManagement.Infrastructure.Repositories;

public sealed class InventoryMovementRepository(PeriquitoDbContext context)
    : Repository<InventoryMovement>(context), IInventoryMovementRepository
{
    public async Task<IReadOnlyList<InventoryMovement>> GetHistoryAsync(
        long? ingredientId,
        string? movementType,
        DateTime? fromUtc,
        DateTime? toUtc,
        CancellationToken cancellationToken = default)
    {
        var query = Context.InventoryMovements
            .AsNoTracking()
            .Include(movement => movement.Ingredient)
            .Include(movement => movement.User)
            .AsQueryable();

        if (ingredientId.HasValue)
            query = query.Where(movement => movement.IngredientId == ingredientId.Value);
        if (movementType is not null)
            query = query.Where(movement => movement.MovementType == movementType);
        if (fromUtc.HasValue)
            query = query.Where(movement => movement.OccurredAt >= fromUtc.Value);
        if (toUtc.HasValue)
            query = query.Where(movement => movement.OccurredAt <= toUtc.Value);

        return await query.OrderByDescending(movement => movement.OccurredAt)
            .ThenByDescending(movement => movement.Id)
            .ToListAsync(cancellationToken);
    }
}
