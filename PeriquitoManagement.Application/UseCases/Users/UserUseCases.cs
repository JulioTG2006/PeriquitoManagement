using System.Data;
using MediatR;
using PeriquitoManagement.Application.DTOs;
using PeriquitoManagement.Application.Exceptions;
using PeriquitoManagement.Application.Interfaces;
using PeriquitoManagement.Domain.Constants;
using PeriquitoManagement.Domain.Entities;
using PeriquitoManagement.Domain.Interfaces;

namespace PeriquitoManagement.Application.UseCases.Users;

public sealed record GetUsersQuery : IRequest<IReadOnlyList<UserDto>>;
public sealed record GetUserByIdQuery(long Id) : IRequest<UserDto>;
public sealed record CreateUserCommand(string? Username, string? FullName, string? Password, string? Role)
    : IRequest<UserDto>;
public sealed record UpdateUserCommand(long Id, string? FullName, string? Role, bool IsActive, string? Password)
    : IRequest<UserDto>;
public sealed record DeactivateUserCommand(long Id) : IRequest;

public sealed class GetUsersHandler(IUserRepository users)
    : IRequestHandler<GetUsersQuery, IReadOnlyList<UserDto>>
{
    public async Task<IReadOnlyList<UserDto>> Handle(GetUsersQuery request, CancellationToken cancellationToken)
    {
        var entities = await users.GetAllWithRolesAsync(cancellationToken);
        return entities.Select(UserMapping.ToDto).ToArray();
    }
}

public sealed class GetUserByIdHandler(IUserRepository users)
    : IRequestHandler<GetUserByIdQuery, UserDto>
{
    public async Task<UserDto> Handle(GetUserByIdQuery request, CancellationToken cancellationToken)
    {
        var user = await users.GetByIdWithRoleAsync(request.Id, cancellationToken)
            ?? throw new NotFoundException($"User {request.Id} was not found.");
        return UserMapping.ToDto(user);
    }
}

public sealed class CreateUserHandler(
    IUserRepository users,
    IPasswordService passwords,
    IUnitOfWork unitOfWork)
    : IRequestHandler<CreateUserCommand, UserDto>
{
    public async Task<UserDto> Handle(CreateUserCommand request, CancellationToken cancellationToken)
    {
        var username = UserValidation.Required(request.Username, "username", 60);
        var fullName = UserValidation.Required(request.FullName, "fullName", 120);
        UserValidation.Password(request.Password);
        var roleName = UserValidation.Role(request.Role);

        if (await users.UsernameExistsAsync(username, cancellationToken: cancellationToken))
            throw new ConflictException("A user with this username already exists.");

        var role = await users.GetRoleByNameAsync(roleName, cancellationToken)
            ?? throw new ValidationException(new Dictionary<string, string[]> { ["role"] = ["Role is not configured."] });
        var user = new User
        {
            Username = username,
            FullName = fullName,
            RoleId = role.Id,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };
        user.PasswordHash = passwords.HashPassword(user, request.Password!);
        await users.AddAsync(user, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);
        user.Role = role;
        return UserMapping.ToDto(user);
    }
}

public sealed class UpdateUserHandler(
    IUserRepository users,
    IPasswordService passwords,
    IUnitOfWork unitOfWork)
    : IRequestHandler<UpdateUserCommand, UserDto>
{
    public async Task<UserDto> Handle(UpdateUserCommand request, CancellationToken cancellationToken)
    {
        await unitOfWork.BeginTransactionAsync(cancellationToken, IsolationLevel.Serializable);
        try
        {
            var user = await users.GetByIdWithRoleAsync(request.Id, cancellationToken)
                ?? throw new NotFoundException($"User {request.Id} was not found.");
            var fullName = UserValidation.Required(request.FullName, "fullName", 120);
            var roleName = UserValidation.Role(request.Role);
            var role = await users.GetRoleByNameAsync(roleName, cancellationToken)
                ?? throw new ValidationException(new Dictionary<string, string[]> { ["role"] = ["Role is not configured."] });

            if (user.IsActive && user.Role.Name == RoleNames.Administrator
                && (!request.IsActive || roleName != RoleNames.Administrator)
                && await users.CountActiveAdministratorsAsync(cancellationToken) <= 1)
                throw new ConflictException("The last active administrator cannot be deactivated or reassigned.");

            if (request.Password is not null)
            {
                UserValidation.Password(request.Password);
                user.PasswordHash = passwords.HashPassword(user, request.Password);
            }

            user.FullName = fullName;
            user.RoleId = role.Id;
            user.Role = role;
            user.IsActive = request.IsActive;
            users.Update(user);
            await unitOfWork.SaveChangesAsync(cancellationToken);
            await unitOfWork.CommitTransactionAsync(cancellationToken);
            return UserMapping.ToDto(user);
        }
        catch
        {
            await unitOfWork.RollbackTransactionAsync(cancellationToken);
            throw;
        }
    }
}

public sealed class DeactivateUserHandler(IUserRepository users, IUnitOfWork unitOfWork)
    : IRequestHandler<DeactivateUserCommand>
{
    public async Task Handle(DeactivateUserCommand request, CancellationToken cancellationToken)
    {
        await unitOfWork.BeginTransactionAsync(cancellationToken, IsolationLevel.Serializable);
        try
        {
            var user = await users.GetByIdWithRoleAsync(request.Id, cancellationToken)
                ?? throw new NotFoundException($"User {request.Id} was not found.");
            if (user.IsActive && user.Role.Name == RoleNames.Administrator
                && await users.CountActiveAdministratorsAsync(cancellationToken) <= 1)
                throw new ConflictException("The last active administrator cannot be deactivated.");
            user.IsActive = false;
            users.Update(user);
            await unitOfWork.SaveChangesAsync(cancellationToken);
            await unitOfWork.CommitTransactionAsync(cancellationToken);
        }
        catch
        {
            await unitOfWork.RollbackTransactionAsync(cancellationToken);
            throw;
        }
    }
}

internal static class UserMapping
{
    public static UserDto ToDto(User user) => new(
        user.Id, user.Username, user.FullName, user.Role.Name, user.IsActive, user.CreatedAt);
}

internal static class UserValidation
{
    public static string Required(string? value, string field, int maxLength)
    {
        var normalized = value?.Trim();
        if (string.IsNullOrWhiteSpace(normalized) || normalized.Length > maxLength)
            throw new ValidationException(new Dictionary<string, string[]>
            {
                [field] = [$"{field} is required and must not exceed {maxLength} characters."]
            });
        return normalized;
    }

    public static void Password(string? value)
    {
        if (string.IsNullOrWhiteSpace(value) || value.Length < 12 || value.Length > 128)
            throw new ValidationException(new Dictionary<string, string[]>
            {
                ["password"] = ["Password must contain between 12 and 128 characters."]
            });
    }

    public static string Role(string? value)
    {
        if (value is not (RoleNames.Administrator or RoleNames.Waiter))
            throw new ValidationException(new Dictionary<string, string[]>
            {
                ["role"] = ["Role must be Administrador or Mesero."]
            });
        return value;
    }
}
