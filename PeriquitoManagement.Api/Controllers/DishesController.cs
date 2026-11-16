using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PeriquitoManagement.Application.DTOs;
using PeriquitoManagement.Application.UseCases.Dishes;
using PeriquitoManagement.Domain.Constants;

namespace PeriquitoManagement.Api.Controllers;

[ApiController]
[Route("api/dishes")]
[Authorize(Roles = RoleNames.Administrator + "," + RoleNames.Waiter)]
public sealed class DishesController(ISender sender) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType<IReadOnlyList<DishDto>>(StatusCodes.Status200OK)]
    [ProducesResponseType<IReadOnlyList<AdminDishDto>>(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll(
        [FromQuery] long? categoryId,
        [FromQuery] bool? isAvailable,
        CancellationToken cancellationToken)
    {
        if (User.IsInRole(RoleNames.Administrator))
            return Ok(await sender.Send(new GetAdminDishesQuery(categoryId, isAvailable), cancellationToken));
        return Ok(await sender.Send(new GetDishesQuery(categoryId, isAvailable), cancellationToken));
    }

    [HttpGet("{id:long}")]
    public async Task<IActionResult> GetById(long id, CancellationToken cancellationToken)
    {
        if (User.IsInRole(RoleNames.Administrator))
            return Ok(await sender.Send(new GetAdminDishByIdQuery(id), cancellationToken));
        return Ok(await sender.Send(new GetDishByIdQuery(id), cancellationToken));
    }

    [HttpPost]
    [Authorize(Roles = RoleNames.Administrator)]
    [ProducesResponseType<AdminDishDto>(StatusCodes.Status201Created)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<AdminDishDto>> Create(
        [FromBody] SaveDishRequest request,
        CancellationToken cancellationToken)
    {
        var dish = await sender.Send(new CreateDishCommand(
            request.CategoryId, request.Name, request.Description, request.Price,
            request.Cost, request.IsAvailable), cancellationToken);
        return CreatedAtAction(nameof(GetById), new { id = dish.Id }, dish);
    }

    [HttpPut("{id:long}")]
    [Authorize(Roles = RoleNames.Administrator)]
    public async Task<ActionResult<AdminDishDto>> Update(
        long id,
        [FromBody] SaveDishRequest request,
        CancellationToken cancellationToken)
    {
        return Ok(await sender.Send(new UpdateDishCommand(
            id, request.CategoryId, request.Name, request.Description, request.Price,
            request.Cost, request.IsAvailable), cancellationToken));
    }

    [HttpPatch("{id:long}/availability")]
    [Authorize(Roles = RoleNames.Administrator)]
    public async Task<ActionResult<AdminDishDto>> ChangeAvailability(
        long id,
        [FromBody] bool isAvailable,
        CancellationToken cancellationToken)
    {
        return Ok(await sender.Send(new ChangeDishAvailabilityCommand(id, isAvailable), cancellationToken));
    }

    [HttpDelete("{id:long}")]
    [Authorize(Roles = RoleNames.Administrator)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Delete(long id, CancellationToken cancellationToken)
    {
        await sender.Send(new DeleteDishCommand(id), cancellationToken);
        return NoContent();
    }
}
