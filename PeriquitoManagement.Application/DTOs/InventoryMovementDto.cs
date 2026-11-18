namespace PeriquitoManagement.Application.DTOs;

public sealed record InventoryMovementDto(
    long Id,
    long IngredientId,
    string IngredientName,
    string UnitOfMeasure,
    string MovementType,
    decimal Quantity,
    DateTime OccurredAt,
    string? Reason,
    long? UserId,
    string? ResponsibleUsername);

public sealed record InventoryMovementResultDto(
    InventoryMovementDto Movement,
    decimal CurrentStock);

public sealed record CreateInventoryMovementRequest(
    decimal Quantity,
    string? Reason);
