using Backend.Shard.Exceptions;
// ReSharper disable All

namespace Shared.Ultis;
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
        catch (Exception e)
        {
            throw new appException("Hashing password failed", 500 , "H01");
        }
    }

    public static bool Validate(string dbPassword, string inputPassword)
    {
        try
        {
            return BCrypt.Verify(inputPassword , dbPassword);
        }catch (Exception e)
        {
            throw new appException("Validate password failed", 500 , "H01");
        }
    }
}