using System.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;
using PeriquitoManagement.Domain.Interfaces;

namespace PeriquitoManagement.Infrastructure.Persistence;

public class UnitOfWork(PeriquitoDbContext context)
    : IUnitOfWork, IAsyncDisposable
{
    private IDbContextTransaction? _transaction;

    public Task<int> SaveChangesAsync(
        CancellationToken cancellationToken = default)
    {
        return context.SaveChangesAsync(cancellationToken);
    }

    public async Task BeginTransactionAsync(
        CancellationToken cancellationToken = default,
        IsolationLevel isolationLevel = IsolationLevel.ReadCommitted)
    {
        if (_transaction is not null)
            throw new InvalidOperationException(
                "A transaction is already active.");

        _transaction = await context.Database
            .BeginTransactionAsync(isolationLevel, cancellationToken);
    }

    public async Task CommitTransactionAsync(
        CancellationToken cancellationToken = default)
    {
        var transaction = _transaction;
        if (transaction is null)
            throw new InvalidOperationException(
                "No active transaction.");

        try
        {
            await transaction.CommitAsync(cancellationToken);
        }
        finally
        {
            _transaction = null;
            await transaction.DisposeAsync();
        }
    }

    public async Task RollbackTransactionAsync(
        CancellationToken cancellationToken = default)
    {
        var transaction = _transaction;
        if (transaction is null)
            return;

        try
        {
            await transaction.RollbackAsync(cancellationToken);
        }
        finally
        {
            _transaction = null;
            try
            {
                context.ChangeTracker.Clear();
            }
            finally
            {
                await transaction.DisposeAsync();
            }
        }
    }

    public async ValueTask DisposeAsync()
    {
        if (_transaction is not null)
            await RollbackTransactionAsync();
    }
}
