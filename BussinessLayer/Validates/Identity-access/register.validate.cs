// ReSharper disable All

using System.Net;
using Backend.Shard.Exceptions;
using DataAccess;
using DataAccess.Enums;
using Shared.Ultis;

namespace BussinessLayer.Validates.Identity_access;

public class register_validate
{
    public static bool checkExistEmail(dbContext context , string email)
    {
        return context.user_info_entity.Any(x => x.userEmail == email);
    }
    // Nghiệp vụ : Ít nhất 16 tuổi mới đc đăng ký

    public static string? checkValidateAge(DateTime date , register_user_type_enum registerUserTypeEnum)
    {
        switch (registerUserTypeEnum)
        {
            case register_user_type_enum.Customer:
                return DateTime.Now.Year - date.Year < 16 ? "User Must Be At least 16 Years Old" : null;
            case register_user_type_enum.Staff:
                return DateTime.Now.Year - date.Year < 18 ? "Staff Must Be At least 18 Years Old" : null;
            default:
                throw new app_exception("Invalid User Type", 400, "UError01");
        }
    }

    public static bool checkExistIdentityCode(string AES256Key , string AES256_IV ,dbContext context, string inputIdentityCode)
    {
        var encryptedInput = AES256Helper.Encrypt(inputIdentityCode, AES256Key, AES256_IV);
        
        return context.user_profile_entity.Any(x => x.identityCode == encryptedInput);
    }
}