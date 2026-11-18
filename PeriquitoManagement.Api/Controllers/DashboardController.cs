using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PeriquitoManagement.Application.DTOs;
using PeriquitoManagement.Application.UseCases.Dashboard;
using PeriquitoManagement.Domain.Constants;

namespace PeriquitoManagement.Api.Controllers;

[ApiController]
[Route("api/dashboard")]
[Authorize(Roles = RoleNames.Administrator)]
public sealed class DashboardController(ISender sender) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType<DashboardDto>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<DashboardDto>> Get(
        [FromQuery] DateOnly? fromDate,
        [FromQuery] DateOnly? toDate,
        CancellationToken cancellationToken)
    {
        return Ok(await sender.Send(new GetDashboardQuery(fromDate, toDate), cancellationToken));
    }
}
