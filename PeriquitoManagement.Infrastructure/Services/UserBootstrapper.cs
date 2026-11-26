using Microsoft.Extensions.Logging;
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
    IUnitOfWork unitOfWork,
    ILogger<UserBootstrapper> logger) : IUserBootstrapper
{
    public async Task EnsureUsersAsync(CancellationToken cancellationToken = default)
    {
        var configuration = options.Value;
        if (!configuration.Enabled)
        {
            logger.LogInformation("Initial user bootstrap is disabled; no accounts were changed.");
            return;
        }

        logger.LogInformation("Initial user bootstrap is enabled.");
        var transactionStarted = false;
        try
        {
            ValidateAccount(configuration.Administrator, "administrator");
            ValidateAccount(configuration.Waiter, "waiter");
            if (string.Equals(configuration.Administrator.Username, configuration.Waiter.Username,
                    StringComparison.OrdinalIgnoreCase))
                throw new InvalidOperationException("Bootstrap usernames must be different.");

            var adminRole = await users.GetRoleByNameAsync(RoleNames.Administrator, cancellationToken)
                ?? throw new InvalidOperationException("The Administrador role is missing from the database.");
            var waiterRole = await users.GetRoleByNameAsync(RoleNames.Waiter, cancellationToken)
                ?? throw new InvalidOperationException("The Mesero role is missing from the database.");

            await unitOfWork.BeginTransactionAsync(cancellationToken);
            transactionStarted = true;
            var createdCount = 0;
            if (await EnsureAccountAsync(configuration.Administrator, adminRole, cancellationToken))
                createdCount++;
            if (await EnsureAccountAsync(configuration.Waiter, waiterRole, cancellationToken))
                createdCount++;
            await unitOfWork.SaveChangesAsync(cancellationToken);
            await unitOfWork.CommitTransactionAsync(cancellationToken);
            transactionStarted = false;

            logger.LogInformation(
                "Initial user bootstrap completed. Created {CreatedCount} account(s); existing accounts were left unchanged.",
                createdCount);
        }
        catch (Exception exception)
        {
            if (transactionStarted)
            {
                try
                {
                    await unitOfWork.RollbackTransactionAsync(cancellationToken);
                }
                catch (Exception rollbackException)
                {
                    logger.LogError(
                        "Initial user bootstrap rollback failed with {ExceptionType}.",
                        rollbackException.GetType().Name);
                }
            }

            logger.LogError(
                "Initial user bootstrap failed with {ExceptionType}. Credential values and password hashes were omitted.",
                exception.GetType().Name);
            throw;
        }
    }

    private async Task<bool> EnsureAccountAsync(
        BootstrapUserAccount account,
        Role role,
        CancellationToken cancellationToken)
    {
        if (await users.UsernameExistsAsync(account.Username.Trim(), cancellationToken: cancellationToken))
            return false;

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
        return true;
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
