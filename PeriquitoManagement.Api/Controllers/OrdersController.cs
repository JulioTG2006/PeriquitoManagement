using System.Security.Claims;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PeriquitoManagement.Application.DTOs;
using PeriquitoManagement.Application.UseCases.Orders;
using PeriquitoManagement.Domain.Constants;

namespace PeriquitoManagement.Api.Controllers;

[ApiController]
[Route("api/orders")]
[Authorize(Roles = RoleNames.Administrator + "," + RoleNames.Waiter)]
public sealed class OrdersController(ISender sender) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken cancellationToken)
    {
        if (User.IsInRole(RoleNames.Administrator))
            return Ok(await sender.Send(new GetAllOrdersQuery(), cancellationToken));
        return Ok(await sender.Send(new GetActiveOrdersQuery(), cancellationToken));
    }

    [HttpGet("active")]
    public async Task<IActionResult> GetActive(CancellationToken cancellationToken)
    {
        if (User.IsInRole(RoleNames.Administrator))
            return Ok(await sender.Send(new GetAdminActiveOrdersQuery(), cancellationToken));
        return Ok(await sender.Send(new GetActiveOrdersQuery(), cancellationToken));
    }

    [HttpGet("{id:long}")]
    public async Task<IActionResult> GetById(long id, CancellationToken cancellationToken)
    {
        if (User.IsInRole(RoleNames.Administrator))
            return Ok(await sender.Send(new GetAdminOrderByIdQuery(id), cancellationToken));
        return Ok(await sender.Send(new GetOrderByIdQuery(id), cancellationToken));
    }

    [HttpGet("tables/{tableId:long}/active")]
    public async Task<IActionResult> GetActiveByTable(long tableId, CancellationToken cancellationToken)
    {
        if (User.IsInRole(RoleNames.Administrator))
            return Ok(await sender.Send(new GetAdminActiveOrderByTableQuery(tableId), cancellationToken));
        return Ok(await sender.Send(new GetActiveOrderByTableQuery(tableId), cancellationToken));
    }

    [HttpPost]
    [ProducesResponseType<OrderDto>(StatusCodes.Status201Created)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<OrderDto>> Create(
        [FromBody] CreateOrderRequest request,
        CancellationToken cancellationToken)
    {
        var identity = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!long.TryParse(identity, out var userId))
            return Unauthorized();
        var order = await sender.Send(new CreateOrderCommand(request.TableId, userId), cancellationToken);
        return CreatedAtAction(nameof(GetById), new { id = order.Id }, order);
    }

    [HttpPost("{orderId:long}/items")]
    [ProducesResponseType<OrderDto>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<OrderDto>> AddItem(
        long orderId,
        [FromBody] AddOrderItemRequest request,
        CancellationToken cancellationToken)
    {
        return Ok(await sender.Send(
            new AddOrderItemCommand(orderId, request.DishId, request.Quantity), cancellationToken));
    }

    [HttpPut("{orderId:long}/items/{dishId:long}")]
    public async Task<ActionResult<OrderDto>> SetItemQuantity(
        long orderId,
        long dishId,
        [FromBody] SetOrderItemQuantityRequest request,
        CancellationToken cancellationToken)
    {
        return Ok(await sender.Send(
            new SetOrderItemQuantityCommand(orderId, dishId, request.Quantity), cancellationToken));
    }

    [HttpDelete("{orderId:long}/items/{dishId:long}")]
    public async Task<ActionResult<OrderDto>> RemoveItem(
        long orderId,
        long dishId,
        CancellationToken cancellationToken)
    {
        return Ok(await sender.Send(new RemoveOrderItemCommand(orderId, dishId), cancellationToken));
    }

    [HttpPost("{orderId:long}/cancel")]
    public async Task<ActionResult<OrderDto>> Cancel(long orderId, CancellationToken cancellationToken)
    {
        return Ok(await sender.Send(new CancelOrderCommand(orderId), cancellationToken));
    }
}
