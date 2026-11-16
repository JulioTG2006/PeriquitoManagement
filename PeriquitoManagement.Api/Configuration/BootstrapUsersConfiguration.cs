using PeriquitoManagement.Application.Interfaces;

namespace PeriquitoManagement.Api.Configuration;

public static class BootstrapUsersConfiguration
{
    public static async Task InitializeBootstrapUsersAsync(this WebApplication app)
    {
        await using var scope = app.Services.CreateAsyncScope();
        var bootstrapper = scope.ServiceProvider.GetRequiredService<IUserBootstrapper>();
        await bootstrapper.EnsureUsersAsync();
    }
}
