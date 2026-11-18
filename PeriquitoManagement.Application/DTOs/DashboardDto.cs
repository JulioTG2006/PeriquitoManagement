namespace PeriquitoManagement.Application.DTOs;

public sealed record DashboardSummaryDto(
    long CompletedOrders,
    decimal Revenue,
    decimal GrossProfit,
    decimal Cost,
    decimal AverageTicket);

public sealed record DashboardDailySalesDto(
    DateOnly Date,
    long SalesCount,
    decimal Revenue,
    decimal GrossProfit,
    decimal Cost);

public sealed record DashboardProductSalesDto(
    long DishId,
    string DishName,
    long QuantitySold,
    decimal Revenue,
    decimal Cost,
    decimal GrossProfit);

public sealed record DashboardCurrentStatusDto(
    long AvailableTables,
    long OccupiedTables,
    long ActiveOrders,
    long LowStockIngredients);

public sealed record DashboardDto(
    DateOnly? FromDate,
    DateOnly? ToDate,
    DashboardSummaryDto Summary,
    IReadOnlyList<DashboardDailySalesDto> DailySales,
    IReadOnlyList<DashboardProductSalesDto> TopFiveDishes,
    IReadOnlyList<DashboardProductSalesDto> ProductSales,
    DashboardCurrentStatusDto CurrentStatus);
