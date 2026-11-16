using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PeriquitoManagement.Application.DTOs;
using PeriquitoManagement.Application.UseCases.Tables;
using PeriquitoManagement.Domain.Constants;

namespace PeriquitoManagement.Api.Controllers;

[ApiController]
[Route("api/tables")]
[Authorize(Roles = RoleNames.Administrator + "," + RoleNames.Waiter)]
public sealed class TablesController(ISender sender) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType<IReadOnlyList<TableDto>>(StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<TableDto>>> GetAll(
        [FromQuery] string? status,
        CancellationToken cancellationToken)
    {
        return Ok(await sender.Send(new GetTablesQuery(status), cancellationToken));
    }

    [HttpGet("available")]
    public async Task<ActionResult<IReadOnlyList<TableDto>>> GetAvailable(CancellationToken cancellationToken)
    {
        return Ok(await sender.Send(new GetTablesQuery(TableStatuses.Available), cancellationToken));
    }

    [HttpGet("occupied")]
    public async Task<ActionResult<IReadOnlyList<TableDto>>> GetOccupied(CancellationToken cancellationToken)
    {
        return Ok(await sender.Send(new GetTablesQuery(TableStatuses.Occupied), cancellationToken));
    }

    [HttpGet("{id:long}")]
    public async Task<ActionResult<TableDto>> GetById(long id, CancellationToken cancellationToken)
    {
        return Ok(await sender.Send(new GetTableByIdQuery(id), cancellationToken));
    }

    [HttpPost]
    [Authorize(Roles = RoleNames.Administrator)]
    [ProducesResponseType<TableDto>(StatusCodes.Status201Created)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<TableDto>> Create(
        [FromBody] SaveTableRequest request,
        CancellationToken cancellationToken)
    {
        var table = await sender.Send(new CreateTableCommand(request.TableNumber, request.Capacity), cancellationToken);
        return CreatedAtAction(nameof(GetById), new { id = table.Id }, table);
    }

    [HttpPut("{id:long}")]
    [Authorize(Roles = RoleNames.Administrator)]
    public async Task<ActionResult<TableDto>> Update(
        long id,
        [FromBody] SaveTableRequest request,
        CancellationToken cancellationToken)
    {
        return Ok(await sender.Send(new UpdateTableCommand(id, request.TableNumber, request.Capacity), cancellationToken));
    }

    [HttpDelete("{id:long}")]
    [Authorize(Roles = RoleNames.Administrator)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Delete(long id, CancellationToken cancellationToken)
    {
        await sender.Send(new DeleteTableCommand(id), cancellationToken);
        return NoContent();
    }
}
