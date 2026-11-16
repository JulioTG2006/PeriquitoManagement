using PeriquitoManagement.Domain.Entities;

namespace PeriquitoManagement.Domain.Interfaces;

public interface IUserRepository : IRepository<User>
{
    Task<User?> GetByUsernameAsync(string username, CancellationToken cancellationToken = default);

    Task<User?> GetByIdWithRoleAsync(long id, CancellationToken cancellationToken = default);

    Task<IReadOnlyList<User>> GetAllWithRolesAsync(CancellationToken cancellationToken = default);

    Task<Role?> GetRoleByNameAsync(string roleName, CancellationToken cancellationToken = default);

    Task<bool> UsernameExistsAsync(string username, long? excludedId = null, CancellationToken cancellationToken = default);

    Task<int> CountActiveAdministratorsAsync(CancellationToken cancellationToken = default);
}
