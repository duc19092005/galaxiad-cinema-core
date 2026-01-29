
using System.Net;
using Shared.Exceptions;
using DataAccess;
using Shared.Enums;
using Shared.Utils;

namespace BusinessLayer.Validators.IdentityAccess;

public class RegisterValidate
{
    public static bool CheckExistEmail(CinemaDbContext context , string email)
    {
        return context.UserInfoEntity.Any(x => x.UserEmail == email);
    }
    // Nghiệp vụ : Ít nhất 16 tuổi mới đc đăng ký

    public static string? CheckValidateAge(DateTime date , RegisterUserTypeEnum registerUserTypeEnum)
    {
        switch (registerUserTypeEnum)
        {
            case RegisterUserTypeEnum.Customer:
                return DateTime.Now.Year - date.Year < 16 ? "User Must Be At least 16 Years Old" : null;
            case RegisterUserTypeEnum.Staff:
                return DateTime.Now.Year - date.Year < 18 ? "Staff Must Be At least 18 Years Old" : null;
            default:
                throw new AppException("Invalid User Type", 400, "UError01");
        }
    }

    public static bool CheckExistIdentityCode(string AES256Key , string AES256_IV ,CinemaDbContext context, string inputIdentityCode)
    {
        var encryptedInput = AES256Helper.Encrypt(inputIdentityCode, AES256Key, AES256_IV);
        
        return context.UserProfileEntity.Any(x => x.IdentityCode == encryptedInput);
    }
}

