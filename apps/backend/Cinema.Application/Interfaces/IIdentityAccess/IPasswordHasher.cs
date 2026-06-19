namespace Cinema.Application.Interfaces.IIdentityAccess;

/// <summary>
/// Abstraction for password hashing, decoupling Application from BCrypt.Net dependency.
/// </summary>
public interface IPasswordHasher
{
    string Hash(string password);
    bool Validate(string hashedPassword, string inputPassword);
}
