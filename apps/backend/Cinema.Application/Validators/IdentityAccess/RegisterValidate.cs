using Cinema.Application.Abstractions.Security;
using Cinema.Domain.Entities.UserInfos;

namespace Cinema.Application.Validators.IdentityAccess;

public static class RegisterValidate
{
    public static bool CheckExistEmail(IQueryable<UserInfoEntity> users, string email)
    {
        return users.Any(x => x.UserEmail == email);
    }

    public static bool CheckExistIdentityCode(
        IEncryptionService encryptionService,
        string aes256Key,
        string aes256Iv,
        IQueryable<UserInfoEntity> users,
        string inputIdentityCode)
    {
        var encryptedInput = encryptionService.Encrypt(inputIdentityCode, aes256Key, aes256Iv);

        return users.Any(x => x.IdentityCode == encryptedInput);
    }
}
