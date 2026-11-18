using PeriquitoManagement.Application.DTOs;

namespace PeriquitoManagement.Application.Interfaces;

public interface IExcelReportService
{
    Task<byte[]> GenerateSalesReportAsync(
        SalesReportDataDto report,
        CancellationToken cancellationToken = default);
}
