using PeriquitoManagement.Domain.Entities;

namespace PeriquitoManagement.Application.Interfaces;

public interface IPasswordService
{
    string HashPassword(User user, string password);

    bool VerifyPassword(User user, string password);
}
