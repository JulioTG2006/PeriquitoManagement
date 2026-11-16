namespace PeriquitoManagement.Application.Interfaces;

public interface IUserBootstrapper
{
    Task EnsureUsersAsync(CancellationToken cancellationToken = default);
}
