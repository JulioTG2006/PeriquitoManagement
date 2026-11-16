using Microsoft.Extensions.Options;
using PeriquitoManagement.Application.Interfaces;
using PeriquitoManagement.Domain.Constants;
using PeriquitoManagement.Domain.Entities;
using PeriquitoManagement.Domain.Interfaces;

namespace PeriquitoManagement.Infrastructure.Services;

public sealed class UserBootstrapper(
    IOptions<BootstrapUserOptions> options,
    IUserRepository users,
    IPasswordService passwords,
    IUnitOfWork unitOfWork) : IUserBootstrapper
{
    public async Task EnsureUsersAsync(CancellationToken cancellationToken = default)
    {
        var configuration = options.Value;
        if (!configuration.Enabled)
            return;

        ValidateAccount(configuration.Administrator, "administrator");
        ValidateAccount(configuration.Waiter, "waiter");
        if (string.Equals(configuration.Administrator.Username, configuration.Waiter.Username,
                StringComparison.OrdinalIgnoreCase))
            throw new InvalidOperationException("Bootstrap usernames must be different.");

        var adminRole = await users.GetRoleByNameAsync(RoleNames.Administrator, cancellationToken)
            ?? throw new InvalidOperationException("The Administrador role is missing from the database.");
        var waiterRole = await users.GetRoleByNameAsync(RoleNames.Waiter, cancellationToken)
            ?? throw new InvalidOperationException("The Mesero role is missing from the database.");

        var transactionStarted = false;
        try
        {
            await unitOfWork.BeginTransactionAsync(cancellationToken);
            transactionStarted = true;
            await EnsureAccountAsync(configuration.Administrator, adminRole, cancellationToken);
            await EnsureAccountAsync(configuration.Waiter, waiterRole, cancellationToken);
            await unitOfWork.SaveChangesAsync(cancellationToken);
            await unitOfWork.CommitTransactionAsync(cancellationToken);
            transactionStarted = false;
        }
        catch
        {
            if (transactionStarted)
                await unitOfWork.RollbackTransactionAsync(cancellationToken);
            throw;
        }
    }

    private async Task EnsureAccountAsync(
        BootstrapUserAccount account,
        Role role,
        CancellationToken cancellationToken)
    {
        if (await users.UsernameExistsAsync(account.Username.Trim(), cancellationToken: cancellationToken))
            return;

        var user = new User
        {
            Username = account.Username.Trim(),
            FullName = account.FullName.Trim(),
            RoleId = role.Id,
            Role = role,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };
        user.PasswordHash = passwords.HashPassword(user, account.Password);
        await users.AddAsync(user, cancellationToken);
    }

    private static void ValidateAccount(BootstrapUserAccount account, string name)
    {
        if (string.IsNullOrWhiteSpace(account.Username) || account.Username.Trim().Length > 60
            || string.IsNullOrWhiteSpace(account.FullName) || account.FullName.Trim().Length > 120
            || string.IsNullOrWhiteSpace(account.Password) || account.Password.Length < 12
            || account.Password.Length > 128)
            throw new InvalidOperationException(
                $"Bootstrap {name} credentials must have a username (max 60), full name (max 120), and password (12-128 characters).");
    }
}
