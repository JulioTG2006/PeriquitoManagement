using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PeriquitoManagement.Application.DTOs;
using PeriquitoManagement.Application.UseCases.Inventory;
using PeriquitoManagement.Domain.Constants;

namespace PeriquitoManagement.Api.Controllers;

[ApiController]
[Route("api/ingredients")]
[Authorize(Roles = RoleNames.Administrator)]
public sealed class IngredientsController(ISender sender) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType<IReadOnlyList<IngredientDto>>(StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<IngredientDto>>> GetAll(
        CancellationToken cancellationToken)
    {
        return Ok(await sender.Send(new GetIngredientsQuery(), cancellationToken));
    }

    [HttpGet("low-stock")]
    [ProducesResponseType<IReadOnlyList<IngredientDto>>(StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<IngredientDto>>> GetLowStock(
        CancellationToken cancellationToken)
    {
        return Ok(await sender.Send(new GetLowStockIngredientsQuery(), cancellationToken));
    }

    [HttpGet("{id:long}")]
    [ProducesResponseType<IngredientDto>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<IngredientDto>> GetById(
        long id,
        CancellationToken cancellationToken)
    {
        return Ok(await sender.Send(new GetIngredientByIdQuery(id), cancellationToken));
    }

    [HttpPost]
    [ProducesResponseType<IngredientDto>(StatusCodes.Status201Created)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<IngredientDto>> Create(
        [FromBody] CreateIngredientRequest request,
        CancellationToken cancellationToken)
    {
        var ingredient = await sender.Send(new CreateIngredientCommand(
            request.Name, request.UnitOfMeasure, request.MinimumStock), cancellationToken);
        return CreatedAtAction(nameof(GetById), new { id = ingredient.Id }, ingredient);
    }

    [HttpPut("{id:long}")]
    [ProducesResponseType<IngredientDto>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<IngredientDto>> Update(
        long id,
        [FromBody] UpdateIngredientRequest request,
        CancellationToken cancellationToken)
    {
        return Ok(await sender.Send(new UpdateIngredientCommand(
            id, request.Name, request.UnitOfMeasure, request.MinimumStock, request.IsActive),
            cancellationToken));
    }

    [HttpDelete("{id:long}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Delete(long id, CancellationToken cancellationToken)
    {
        await sender.Send(new DeleteIngredientCommand(id), cancellationToken);
        return NoContent();
    }
}
