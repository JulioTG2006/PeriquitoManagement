using PeriquitoManagement.Application.Configuration;
using PeriquitoManagement.Application.Interfaces;
using Microsoft.AspNetCore.Identity;
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
        services.AddScoped<IUserRepository, UserRepository>();
        services.AddScoped<IRepository<User>>(
            provider => provider.GetRequiredService<IUserRepository>());
        services.AddScoped<IDishRepository, DishRepository>();
        services.AddScoped<IRepository<Dish>>(
            provider => provider.GetRequiredService<IDishRepository>());
        services.AddScoped<ITableRepository, TableRepository>();
        services.AddScoped<IRepository<Table>>(
            provider => provider.GetRequiredService<ITableRepository>());
        services.AddScoped<IOrderRepository, OrderRepository>();
        services.AddScoped<IRepository<Order>>(
            provider => provider.GetRequiredService<IOrderRepository>());
        services.AddScoped<ISaleRepository, SaleRepository>();
        services.AddScoped<IRepository<Sale>>(
            provider => provider.GetRequiredService<ISaleRepository>());
        services.AddScoped<IUnitOfWork, UnitOfWork>();
        services.AddScoped<IDatabaseHealthService, DatabaseHealthService>();
        services.AddScoped<IPasswordService, PasswordService>();
        services.AddScoped<ITokenService, TokenService>();
        services.AddScoped<IUserBootstrapper, UserBootstrapper>();
        services.AddSingleton<IPasswordHasher<User>, PasswordHasher<User>>();

        return services;
    }
}
