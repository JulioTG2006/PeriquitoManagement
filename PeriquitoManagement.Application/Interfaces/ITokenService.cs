using PeriquitoManagement.Application.DTOs;

namespace PeriquitoManagement.Application.Interfaces;

public interface ITokenService
{
    TokenResponse CreateToken(long userId, string username, string fullName, string role);
}
