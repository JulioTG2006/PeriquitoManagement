namespace PeriquitoManagement.Application.DTOs;

public sealed record IngredientDto(
    long Id,
    string Name,
    string UnitOfMeasure,
    decimal CurrentStock,
    decimal MinimumStock,
    bool IsActive,
    bool IsLowStock);

public sealed record CreateIngredientRequest(
    string? Name,
    string? UnitOfMeasure,
    decimal MinimumStock);

public sealed record UpdateIngredientRequest(
    string? Name,
    string? UnitOfMeasure,
    decimal MinimumStock,
    bool IsActive);
