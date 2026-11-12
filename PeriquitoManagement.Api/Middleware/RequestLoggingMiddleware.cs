using System.Diagnostics;
using Microsoft.AspNetCore.Routing;

namespace PeriquitoManagement.Api.Middleware;

public sealed class RequestLoggingMiddleware(
    RequestDelegate next,
    ILogger<RequestLoggingMiddleware> logger)
{
    public async Task InvokeAsync(HttpContext context)
    {
        var route = context.GetEndpoint() is RouteEndpoint endpoint
                    && endpoint.RoutePattern.RawText is { } routeTemplate
            ? $"/{routeTemplate.TrimStart('/')}"
            : "unmatched";
        var startedAt = Stopwatch.GetTimestamp();

        context.Response.OnCompleted(() =>
        {
            var elapsed = Stopwatch.GetElapsedTime(startedAt);
            logger.LogInformation(
                "HTTP {Method} {Route} responded {StatusCode} in {ElapsedMilliseconds} ms.",
                context.Request.Method,
                route,
                context.Response.StatusCode,
                elapsed.TotalMilliseconds);
            return Task.CompletedTask;
        });

        await next(context);
    }
}
