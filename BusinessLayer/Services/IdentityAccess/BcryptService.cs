using Shared.Exceptions;
using Shared.Localization;
// ReSharper disable All

namespace BusinessLayer.Services.IdentityAccess;
using BCrypt.Net;
public class BCrypt_helper
{
    public static string Hash(string password)
    {
        try
        {
            string hashedPassword = BCrypt.HashPassword(password);
            return hashedPassword;
        }
        catch (Exception)
        {
            throw new AppException(Messages.Utility.HashingPasswordFailed, 500 , "H01");
        }
    }

    public static bool Validate(string dbPassword, string inputPassword)
    {
        try
        {
            return BCrypt.Verify(inputPassword , dbPassword);
        }catch (Exception)
        {
            throw new AppException(Messages.Utility.ValidatePasswordFailed, 500 , "H01");
        }
    }
}
