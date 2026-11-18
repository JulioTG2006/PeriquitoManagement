using System.Security.Claims;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PeriquitoManagement.Application.DTOs;
using PeriquitoManagement.Application.UseCases.Inventory;
using PeriquitoManagement.Domain.Constants;

namespace PeriquitoManagement.Api.Controllers;

[ApiController]
[Route("api/inventory")]
[Authorize(Roles = RoleNames.Administrator)]
public sealed class InventoryController(ISender sender) : ControllerBase
{
    [HttpGet("movements")]
    [ProducesResponseType<IReadOnlyList<InventoryMovementDto>>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<IReadOnlyList<InventoryMovementDto>>> GetMovements(
        [FromQuery] long? ingredientId,
        [FromQuery] string? movementType,
        [FromQuery] DateTimeOffset? fromUtc,
        [FromQuery] DateTimeOffset? toUtc,
        CancellationToken cancellationToken)
    {
        return Ok(await sender.Send(new GetInventoryMovementsQuery(
            ingredientId, movementType, fromUtc, toUtc), cancellationToken));
    }

    [HttpPost("ingredients/{ingredientId:long}/entries")]
    [ProducesResponseType<InventoryMovementResultDto>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict)]
    public Task<ActionResult<InventoryMovementResultDto>> RegisterEntry(
        long ingredientId,
        [FromBody] CreateInventoryMovementRequest request,
        CancellationToken cancellationToken)
    {
        return RegisterMovement(
            ingredientId, InventoryMovementTypes.Entry, request, cancellationToken);
    }

    [HttpPost("ingredients/{ingredientId:long}/exits")]
    [ProducesResponseType<InventoryMovementResultDto>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict)]
    public Task<ActionResult<InventoryMovementResultDto>> RegisterExit(
        long ingredientId,
        [FromBody] CreateInventoryMovementRequest request,
        CancellationToken cancellationToken)
    {
        return RegisterMovement(
            ingredientId, InventoryMovementTypes.Exit, request, cancellationToken);
    }

    private async Task<ActionResult<InventoryMovementResultDto>> RegisterMovement(
        long ingredientId,
        string movementType,
        CreateInventoryMovementRequest request,
        CancellationToken cancellationToken)
    {
        var identity = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!long.TryParse(identity, out var userId))
            return Unauthorized();

        var result = await sender.Send(new RegisterInventoryMovementCommand(
            ingredientId, movementType, request.Quantity, request.Reason, userId),
            cancellationToken);
        return Ok(result);
    }
}
