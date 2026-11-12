using PeriquitoManagement.Application.Configuration;
using PeriquitoManagement.Application.Interfaces;
using PeriquitoManagement.Domain.Entities;
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
        services.AddApplication();
        services.AddScoped(
            typeof(IRepository<>),
            typeof(Repository<>));
        services.AddScoped<ICategoryRepository, CategoryRepository>();
        services.AddScoped<IRepository<Category>>(
            provider => provider.GetRequiredService<ICategoryRepository>());
        services.AddScoped<IUnitOfWork, UnitOfWork>();
        services.AddScoped<IDatabaseHealthService, DatabaseHealthService>();

        return services;
    }
}
