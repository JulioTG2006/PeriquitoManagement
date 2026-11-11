using Microsoft.EntityFrameworkCore;
using PeriquitoManagement.Domain.Interfaces;
using PeriquitoManagement.Infrastructure.Persistence;

namespace PeriquitoManagement.Infrastructure.Repositories;

public class Repository<T>(PeriquitoDbContext context)
    : IRepository<T> where T : class
{
    protected readonly PeriquitoDbContext Context = context;
    protected readonly DbSet<T> DbSet = context.Set<T>();

    public async Task<T?> GetByIdAsync(
        long id,
        CancellationToken cancellationToken = default)
    {
        return await DbSet.FindAsync(
            new object[] { id }, cancellationToken);
    }

    public async Task<IReadOnlyList<T>> GetAllAsync(
        CancellationToken cancellationToken = default)
    {
        return await DbSet.AsNoTracking()
            .ToListAsync(cancellationToken);
    }

    public async Task AddAsync(
        T entity,
        CancellationToken cancellationToken = default)
    {
        await DbSet.AddAsync(entity, cancellationToken);
    }

    public void Update(T entity)
    {
        DbSet.Update(entity);
    }

    public void Delete(T entity)
    {
        DbSet.Remove(entity);
    }
}
