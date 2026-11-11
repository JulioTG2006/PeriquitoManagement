using PeriquitoManagement.Application.Interfaces;
using PeriquitoManagement.Infrastructure.Persistence;

namespace PeriquitoManagement.Infrastructure.Services;

public sealed class DatabaseHealthService(PeriquitoDbContext context)
    : IDatabaseHealthService
{
    public Task<bool> CanConnectAsync(
        CancellationToken cancellationToken = default)
    {
        return context.Database.CanConnectAsync(cancellationToken);
    }
}
