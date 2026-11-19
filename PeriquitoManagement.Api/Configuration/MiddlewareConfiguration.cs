using PeriquitoManagement.Api.Middleware;

namespace PeriquitoManagement.Api.Configuration;

public static class MiddlewareConfiguration
{
    public static IApplicationBuilder UseMiddlewareConfiguration(
        this IApplicationBuilder app)
    {
        app.UseMiddleware<ExceptionMiddleware>();
        app.UseRouting();
        app.UseCors("Frontend");
        app.UseMiddleware<RequestLoggingMiddleware>();

        return app;
    }
}
