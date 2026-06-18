using Application.Identity.Ports;
using BCrypt.Net;
using Shared.Exceptions;
using Shared.Localization;

namespace Infrastructure.Identity;

/// <summary>Băm & xác thực mật khẩu bằng BCrypt.</summary>
public class BcryptPasswordHasher : IPasswordHasher
{
    public string Hash(string password)
    {
        try
        {
            return BCrypt.Net.BCrypt.HashPassword(password);
        }
        catch
        {
            throw new AppException(Messages.Utility.HashingPasswordFailed, 500, "H01");
        }
    }

    public bool Verify(string hash, string password)
    {
        try
        {
            return BCrypt.Net.BCrypt.Verify(password, hash);
        }
        catch
        {
            throw new AppException(Messages.Utility.ValidatePasswordFailed, 500, "H01");
        }
    }
}
