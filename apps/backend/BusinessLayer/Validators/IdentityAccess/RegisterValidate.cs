
using Shared.Exceptions;
using Shared.Localization;
using BusinessLayer.Entities.UserInfos;
using Shared.Enums;
using Shared.Utils;

namespace BusinessLayer.Validators.IdentityAccess;

public static class RegisterValidate
{
    public static bool CheckExistEmail(IQueryable<UserInfoEntity> users, string email)
    {
        return users.Any(x => x.UserEmail == email);
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
                throw new AppException(Messages.Auth.InvalidUserType, 400, "UError01");
        }
    }

    public static bool CheckExistIdentityCode(string aes256Key, string aes256Iv, IQueryable<UserInfoEntity> users, string inputIdentityCode)
    {
        var encryptedInput = AES256Helper.Encrypt(inputIdentityCode, aes256Key, aes256Iv);
        
        return users.Any(x => x.IdentityCode == encryptedInput);
    }
}

