using Microsoft.AspNetCore.Identity;
using PeriquitoManagement.Application.Interfaces;
using PeriquitoManagement.Domain.Entities;

namespace PeriquitoManagement.Infrastructure.Services;

public sealed class PasswordService(IPasswordHasher<User> passwordHasher) : IPasswordService
{
    public string HashPassword(User user, string password) =>
        passwordHasher.HashPassword(user, password);

    public bool VerifyPassword(User user, string password) =>
        passwordHasher.VerifyHashedPassword(user, user.PasswordHash, password)
        != PasswordVerificationResult.Failed;
}
