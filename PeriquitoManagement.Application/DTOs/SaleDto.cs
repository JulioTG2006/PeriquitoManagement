namespace PeriquitoManagement.Application.DTOs;

public sealed record SaleDto(
    long Id,
    long OrderId,
    DateTime SoldAt,
    decimal TotalAmount,
    decimal GrossProfit,
    decimal TotalCost,
    short? TableNumber,
    string WaiterName,
    IReadOnlyList<SaleDetailDto> Details);

public sealed record SaleDetailDto(
    long DishId,
    string DishName,
    int Quantity,
    decimal UnitPrice,
    decimal UnitCost,
    decimal Subtotal);

public sealed record SaleConfirmationDto(
    long Id,
    long OrderId,
    DateTime SoldAt,
    decimal TotalAmount);
