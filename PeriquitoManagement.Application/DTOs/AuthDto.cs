namespace PeriquitoManagement.Application.DTOs;

public sealed record LoginRequest(string? Username, string? Password);

public sealed record AuthenticatedUserDto(
    long Id,
    string Username,
    string FullName,
    string Role);

public sealed record TokenResponse(
    string AccessToken,
    DateTime ExpiresAtUtc,
    AuthenticatedUserDto User);

public sealed record CurrentUserDto(long Id, string Username, string Role);

public sealed record UserDto(
    long Id,
    string Username,
    string FullName,
    string Role,
    bool IsActive,
    DateTime CreatedAt);

public sealed record CreateUserRequest(
    string? Username,
    string? FullName,
    string? Password,
    string? Role);

public sealed record UpdateUserRequest(
    string? FullName,
    string? Role,
    bool IsActive,
    string? Password);
