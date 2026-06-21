using Cinema.Application.Interfaces.IIdentityAccess;
using Cinema.Application.Exceptions;
using Cinema.Domain.Localization;

namespace Cinema.Infrastructure.Identity;

/// <summary>
/// BCrypt.Net-based implementation of IPasswordHasher.
/// </summary>
public class BCryptPasswordHasher : IPasswordHasher
{
    public string Hash(string password)
    {
        try
        {
            return BCrypt.Net.BCrypt.HashPassword(password);
        }
        catch (Exception)
        {
            throw new AppException(Messages.Utility.HashingPasswordFailed, 500, "H01");
        }
    }

    public bool Validate(string hashedPassword, string inputPassword)
    {
        try
        {
            return BCrypt.Net.BCrypt.Verify(inputPassword, hashedPassword);
        }
        catch (Exception)
        {
            throw new AppException(Messages.Utility.ValidatePasswordFailed, 500, "H01");
        }
    }
}
