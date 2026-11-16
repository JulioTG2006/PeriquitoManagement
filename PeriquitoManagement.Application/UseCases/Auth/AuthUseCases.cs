using MediatR;
using PeriquitoManagement.Application.DTOs;
using PeriquitoManagement.Application.Exceptions;
using PeriquitoManagement.Application.Interfaces;
using PeriquitoManagement.Domain.Interfaces;

namespace PeriquitoManagement.Application.UseCases.Auth;

public sealed record LoginCommand(string? Username, string? Password) : IRequest<TokenResponse>;

public sealed class LoginHandler(
    IUserRepository users,
    IPasswordService passwords,
    ITokenService tokens)
    : IRequestHandler<LoginCommand, TokenResponse>
{
    public async Task<TokenResponse> Handle(
        LoginCommand request,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Username) || string.IsNullOrEmpty(request.Password))
            throw new UnauthorizedException("Invalid username or password.");

        var user = await users.GetByUsernameAsync(request.Username.Trim(), cancellationToken);
        if (user is null || !user.IsActive || user.Role is null
            || !passwords.VerifyPassword(user, request.Password))
            throw new UnauthorizedException("Invalid username or password.");

        return tokens.CreateToken(user.Id, user.Username, user.FullName, user.Role.Name);
    }
}
