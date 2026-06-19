using BCrypt.Net;
using Cinema.Domain.Exceptions;
using Cinema.Domain.Localization;

namespace Cinema.Domain.Utils;

public class BCrypt_helper
{
    public static string Hash(string password)
    {
        try
        {
            string hashedPassword = BCrypt.Net.BCrypt.HashPassword(password);
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
            return BCrypt.Net.BCrypt.Verify(inputPassword , dbPassword);
        }
        catch (Exception)
        {
            throw new AppException(Messages.Utility.ValidatePasswordFailed, 500 , "H01");
        }
    }
}
