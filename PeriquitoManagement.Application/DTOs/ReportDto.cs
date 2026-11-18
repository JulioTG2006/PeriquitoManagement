namespace PeriquitoManagement.Application.DTOs;

public sealed record ReportSaleDto(
    long SaleId,
    long OrderId,
    DateTime SoldAtUtc,
    short? TableNumber,
    string WaiterUsername,
    decimal Revenue,
    decimal Cost,
    decimal GrossProfit);

public sealed record ReportProductDto(
    string DishName,
    long QuantitySold,
    decimal Revenue,
    decimal Cost,
    decimal GrossProfit);

public sealed record SalesReportDataDto(
    DateOnly? FromDate,
    DateOnly? ToDate,
    DashboardSummaryDto Summary,
    IReadOnlyList<ReportSaleDto> Sales,
    IReadOnlyList<ReportProductDto> Products);

public sealed record ReportFileDto(
    string FileName,
    string ContentType,
    byte[] Content);
