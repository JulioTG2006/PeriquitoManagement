using MediatR;
using PeriquitoManagement.Application.DTOs;
using PeriquitoManagement.Application.Exceptions;
using PeriquitoManagement.Domain.Interfaces;

namespace PeriquitoManagement.Application.UseCases.Dashboard;

public sealed record GetDashboardQuery(DateOnly? FromDate, DateOnly? ToDate)
    : IRequest<DashboardDto>;

public sealed class GetDashboardHandler(IDashboardRepository dashboard)
    : IRequestHandler<GetDashboardQuery, DashboardDto>
{
    public async Task<DashboardDto> Handle(
        GetDashboardQuery request,
        CancellationToken cancellationToken)
    {
        var range = DashboardDateRange.Resolve(request.FromDate, request.ToDate);
        var summaryData = await dashboard.GetFinancialSummaryAsync(
            range.FromUtc, range.ToExclusiveUtc, cancellationToken);
        var averageTicket = summaryData.SalesCount == 0
            ? 0m
            : decimal.Round(summaryData.Revenue / summaryData.SalesCount, 2, MidpointRounding.AwayFromZero);
        var summary = new DashboardSummaryDto(
            summaryData.SalesCount,
            summaryData.Revenue,
            summaryData.GrossProfit,
            summaryData.Cost,
            averageTicket);

        var daily = await dashboard.GetDailySalesAsync(
            range.FromUtc, range.ToExclusiveUtc, cancellationToken);
        var products = await dashboard.GetProductSalesAsync(
            range.FromUtc, range.ToExclusiveUtc, cancellationToken);
        var current = await dashboard.GetCurrentMetricsAsync(cancellationToken);

        var productDtos = products.Select(product => new DashboardProductSalesDto(
            product.DishId,
            product.DishName,
            product.QuantitySold,
            product.Revenue,
            product.Cost,
            product.Revenue - product.Cost)).ToArray();

        return new DashboardDto(
            request.FromDate,
            request.ToDate,
            summary,
            daily.Select(day => new DashboardDailySalesDto(
                day.LocalDate, day.SalesCount, day.Revenue, day.GrossProfit, day.Cost)).ToArray(),
            productDtos.Take(5).ToArray(),
            productDtos,
            new DashboardCurrentStatusDto(
                current.AvailableTables,
                current.OccupiedTables,
                current.ActiveOrders,
                current.LowStockIngredients));
    }
}

internal static class DashboardDateRange
{
    private static readonly TimeSpan PeruUtcOffset = TimeSpan.FromHours(-5);

    public static (DateTime? FromUtc, DateTime? ToExclusiveUtc) Resolve(
        DateOnly? fromDate,
        DateOnly? toDate)
    {
        if (fromDate.HasValue && toDate.HasValue && fromDate.Value > toDate.Value)
            throw new ValidationException(new Dictionary<string, string[]>
            {
                ["dateRange"] = ["FromDate must be earlier than or equal to ToDate."]
            });

        DateTime? fromUtc = fromDate.HasValue
            ? PeruLocalMidnightToUtc(fromDate.Value)
            : null;
        DateTime? toExclusiveUtc = toDate.HasValue && toDate.Value < DateOnly.MaxValue
            ? PeruLocalMidnightToUtc(toDate.Value.AddDays(1))
            : null;

        return (fromUtc, toExclusiveUtc);
    }

    private static DateTime PeruLocalMidnightToUtc(DateOnly date)
    {
        var peruMidnight = DateTime.SpecifyKind(
            date.ToDateTime(TimeOnly.MinValue), DateTimeKind.Unspecified);
        return TimeZoneInfo.ConvertTimeToUtc(peruMidnight, TimeZoneInfo.CreateCustomTimeZone(
            "America/Lima", PeruUtcOffset, "America/Lima", "America/Lima"));
    }
}
