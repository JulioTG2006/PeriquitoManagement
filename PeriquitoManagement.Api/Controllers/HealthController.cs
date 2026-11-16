using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using PeriquitoManagement.Application.Interfaces;

namespace PeriquitoManagement.Api.Controllers;

[ApiController]
[Route("api/health")]
[AllowAnonymous]
public class HealthController(IDatabaseHealthService databaseHealthService)
    : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Get(CancellationToken cancellationToken)
    {
        var connected = await databaseHealthService
            .CanConnectAsync(cancellationToken);

        if (!connected)
            return StatusCode(503, new { status = "disconnected" });

        return Ok(new { status = "connected" });
    }
}
