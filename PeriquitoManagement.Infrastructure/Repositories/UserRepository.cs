using Microsoft.EntityFrameworkCore;
using PeriquitoManagement.Domain.Constants;
using PeriquitoManagement.Domain.Entities;
using PeriquitoManagement.Domain.Interfaces;
using PeriquitoManagement.Infrastructure.Persistence;

namespace PeriquitoManagement.Infrastructure.Repositories;

public sealed class UserRepository(PeriquitoDbContext context)
    : Repository<User>(context), IUserRepository
{
    public Task<User?> GetByUsernameAsync(string username, CancellationToken cancellationToken = default)
    {
        return Context.Users.AsNoTracking()
            .Include(user => user.Role)
            .FirstOrDefaultAsync(user => user.Username == username, cancellationToken);
    }

    public Task<User?> GetByIdWithRoleAsync(long id, CancellationToken cancellationToken = default)
    {
        return Context.Users.Include(user => user.Role)
            .FirstOrDefaultAsync(user => user.Id == id, cancellationToken);
    }

    public async Task<IReadOnlyList<User>> GetAllWithRolesAsync(CancellationToken cancellationToken = default)
    {
        return await Context.Users.AsNoTracking().Include(user => user.Role)
            .OrderBy(user => user.Id).ToListAsync(cancellationToken);
    }

    public Task<Role?> GetRoleByNameAsync(string roleName, CancellationToken cancellationToken = default)
    {
        return Context.Roles.FirstOrDefaultAsync(role => role.Name == roleName, cancellationToken);
    }

    public Task<bool> UsernameExistsAsync(
        string username,
        long? excludedId = null,
        CancellationToken cancellationToken = default)
    {
        var query = Context.Users.Where(user => user.Username == username);
        if (excludedId.HasValue)
            query = query.Where(user => user.Id != excludedId.Value);
        return query.AnyAsync(cancellationToken);
    }

    public Task<int> CountActiveAdministratorsAsync(CancellationToken cancellationToken = default)
    {
        return Context.Users.CountAsync(
            user => user.IsActive && user.Role.Name == RoleNames.Administrator,
            cancellationToken);
    }
}
