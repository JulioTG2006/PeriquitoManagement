using PeriquitoManagement.Application.Interfaces;
using PeriquitoManagement.Domain.Interfaces;
using PeriquitoManagement.Infrastructure.Persistence;
using PeriquitoManagement.Infrastructure.Repositories;
using PeriquitoManagement.Infrastructure.Services;

namespace PeriquitoManagement.Api.Configuration;

public static class DependencyInjection
{
    public static IServiceCollection AddProjectDependencies(
        this IServiceCollection services)
    {
        services.AddScoped(
            typeof(IRepository<>),
            typeof(Repository<>));

        services.AddScoped<IUnitOfWork, UnitOfWork>();
        services.AddScoped<IDatabaseHealthService, DatabaseHealthService>();

        return services;
    }
}
