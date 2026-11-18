using PeriquitoManagement.Domain.ReadModels;

namespace PeriquitoManagement.Domain.Interfaces;

public interface IDashboardRepository
{
    Task<DashboardFinancialReadModel> GetFinancialSummaryAsync(
        DateTime? fromUtc,
        DateTime? toExclusiveUtc,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<DashboardDailyReadModel>> GetDailySalesAsync(
        DateTime? fromUtc,
        DateTime? toExclusiveUtc,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<DashboardProductReadModel>> GetProductSalesAsync(
        DateTime? fromUtc,
        DateTime? toExclusiveUtc,
        CancellationToken cancellationToken = default);

    Task<DashboardCurrentReadModel> GetCurrentMetricsAsync(
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<DashboardSaleReadModel>> GetSalesForReportAsync(
        DateTime? fromUtc,
        DateTime? toExclusiveUtc,
        CancellationToken cancellationToken = default);
}
