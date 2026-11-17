namespace PeriquitoManagement.Application.DTOs;

public sealed record SaleDto(
    long Id,
    long OrderId,
    DateTime SoldAt,
    decimal TotalAmount,
    decimal GrossProfit);

public sealed record SaleConfirmationDto(
    long Id,
    long OrderId,
    DateTime SoldAt,
    decimal TotalAmount);
