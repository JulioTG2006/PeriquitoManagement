using Microsoft.AspNetCore.Mvc;
using PeriquitoManagement.Infrastructure.Persistence;

namespace PeriquitoManagement.Api.Controllers;

[ApiController]
[Route("api/health")]
public class HealthController(PeriquitoDbContext context)
    : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Get()
    {
        var connected = await context.Database.CanConnectAsync();

        if (!connected)
            return StatusCode(503, new { status = "disconnected" });

        return Ok(new { status = "connected" });
    }
}