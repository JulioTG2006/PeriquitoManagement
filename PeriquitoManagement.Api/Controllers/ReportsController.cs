using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PeriquitoManagement.Application.UseCases.Reports;
using PeriquitoManagement.Domain.Constants;

namespace PeriquitoManagement.Api.Controllers;

[ApiController]
[Route("api/reports")]
[Authorize(Roles = RoleNames.Administrator)]
public sealed class ReportsController(ISender sender) : ControllerBase
{
    [HttpGet("sales.xlsx")]
    [Produces("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> DownloadSalesReport(
        [FromQuery] DateOnly? fromDate,
        [FromQuery] DateOnly? toDate,
        CancellationToken cancellationToken)
    {
        var report = await sender.Send(
            new GenerateSalesReportQuery(fromDate, toDate), cancellationToken);
        return File(report.Content, report.ContentType, report.FileName);
    }
}
