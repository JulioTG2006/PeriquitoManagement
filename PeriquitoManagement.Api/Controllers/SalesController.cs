using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PeriquitoManagement.Application.DTOs;
using PeriquitoManagement.Application.UseCases.Sales;
using PeriquitoManagement.Domain.Constants;

namespace PeriquitoManagement.Api.Controllers;

[ApiController]
[Route("api/sales")]
[Authorize(Roles = RoleNames.Administrator + "," + RoleNames.Waiter)]
public sealed class SalesController(ISender sender) : ControllerBase
{
    [HttpPost("orders/{orderId:long}/complete")]
    [ProducesResponseType<SaleConfirmationDto>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<SaleConfirmationDto>> CompleteOrder(
        long orderId,
        CancellationToken cancellationToken)
    {
        return Ok(await sender.Send(new CompleteOrderCommand(orderId), cancellationToken));
    }

    [HttpGet]
    [Authorize(Roles = RoleNames.Administrator)]
    [ProducesResponseType<IReadOnlyList<SaleDto>>(StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<SaleDto>>> GetAll(
        [FromQuery] DateTimeOffset? fromUtc,
        [FromQuery] DateTimeOffset? toUtc,
        CancellationToken cancellationToken)
    {
        return Ok(await sender.Send(new GetSalesQuery(fromUtc, toUtc), cancellationToken));
    }

    [HttpGet("{id:long}")]
    [Authorize(Roles = RoleNames.Administrator)]
    [ProducesResponseType<SaleDto>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<SaleDto>> GetById(long id, CancellationToken cancellationToken)
    {
        return Ok(await sender.Send(new GetSaleByIdQuery(id), cancellationToken));
    }
}
