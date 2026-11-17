namespace PeriquitoManagement.Application.DTOs;

public sealed record OrderDetailDto(
    long Id,
    long DishId,
    string DishName,
    int Quantity,
    decimal UnitPrice,
    decimal Subtotal);

public sealed record AdminOrderDetailDto(
    long Id,
    long DishId,
    string DishName,
    int Quantity,
    decimal UnitPrice,
    decimal UnitCost,
    decimal Subtotal);
