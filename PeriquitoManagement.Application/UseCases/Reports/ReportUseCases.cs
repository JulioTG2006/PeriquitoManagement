using MediatR;
using PeriquitoManagement.Application.DTOs;
using PeriquitoManagement.Application.Interfaces;
using PeriquitoManagement.Application.UseCases.Dashboard;
using PeriquitoManagement.Domain.Interfaces;

namespace PeriquitoManagement.Application.UseCases.Reports;

public sealed record GenerateSalesReportQuery(DateOnly? FromDate, DateOnly? ToDate)
    : IRequest<ReportFileDto>;

public sealed class GenerateSalesReportHandler(
    ISender sender,
    IDashboardRepository dashboard,
    IExcelReportService excelReport)
    : IRequestHandler<GenerateSalesReportQuery, ReportFileDto>
{
    private const string XlsxContentType =
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

    public async Task<ReportFileDto> Handle(
        GenerateSalesReportQuery request,
        CancellationToken cancellationToken)
    {
        var dashboardData = await sender.Send(
            new GetDashboardQuery(request.FromDate, request.ToDate), cancellationToken);
        var range = DashboardDateRange.Resolve(request.FromDate, request.ToDate);
        var sales = await dashboard.GetSalesForReportAsync(
            range.FromUtc, range.ToExclusiveUtc, cancellationToken);

        var reportData = new SalesReportDataDto(
            request.FromDate,
            request.ToDate,
            dashboardData.Summary,
            sales.Select(sale => new ReportSaleDto(
                sale.SaleId,
                sale.OrderId,
                sale.SoldAt,
                sale.TableNumber,
                sale.WaiterUsername,
                sale.Revenue,
                sale.Cost,
                sale.GrossProfit)).ToArray(),
            dashboardData.ProductSales.Select(product => new ReportProductDto(
                product.DishName,
                product.QuantitySold,
                product.Revenue,
                product.Cost,
                product.GrossProfit)).ToArray());

        var content = await excelReport.GenerateSalesReportAsync(reportData, cancellationToken);
        var from = request.FromDate?.ToString("yyyyMMdd") ?? "inicio";
        var to = request.ToDate?.ToString("yyyyMMdd") ?? "actualidad";
        return new ReportFileDto(
            $"reporte-ventas-{from}-{to}.xlsx",
            XlsxContentType,
            content);
    }
}
