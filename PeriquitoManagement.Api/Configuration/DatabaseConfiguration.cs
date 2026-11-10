using Microsoft.EntityFrameworkCore;
using PeriquitoManagement.Infrastructure.Persistence;

namespace PeriquitoManagement.Api.Configuration;

public static class DatabaseConfiguration
{
    public static IServiceCollection AddDatabase(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        var connectionString = configuration
                                   .GetConnectionString("DefaultConnection")
                               ?? throw new InvalidOperationException(
                                   "Database connection string not found.");

        services.AddDbContext<PeriquitoDbContext>(options =>
            options.UseNpgsql(connectionString));

        return services;
    }
}