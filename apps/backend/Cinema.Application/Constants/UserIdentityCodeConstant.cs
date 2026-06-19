// ReSharper disable All


using Cinema.Domain.Exceptions;
using Cinema.Domain.Localization;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Cinema.Domain.Utils;

namespace Cinema.Application.Constants;

public class UserIdentityCodeConstant
{
    public IConfiguration _IConfiguration;
    
    private ILogger<UserIdentityCodeConstant> _logger;

    public UserIdentityCodeConstant(IConfiguration _IConfiguration ,
        ILogger<UserIdentityCodeConstant> _logger)
    {
        this._IConfiguration = _IConfiguration;
        this._logger = _logger;
    }

    public string[] getUserIdentityCode()
    {
        string? getAESKey = _IConfiguration["AES_256:Key"];
        string? getAESIV = _IConfiguration["AES_256:IV"];
        
        if (getAESKey == null || getAESIV == null)
        {
            _logger.LogError("AES Key is Null !");
            throw new AppException(Messages.System.GeneralError, 500, "E01");
        }
    
        // Khởi tạo mảng để chứa 8 mã định danh đã mã hóa
        string[] encryptedUsers = new string[8];

        encryptedUsers[0] = AES256Helper.Encrypt("382947105632", getAESKey, getAESIV);
        encryptedUsers[1] = AES256Helper.Encrypt("710584293641", getAESKey, getAESIV);
        encryptedUsers[2] = AES256Helper.Encrypt("924618375025", getAESKey, getAESIV);
        encryptedUsers[3] = AES256Helper.Encrypt("159302847619", getAESKey, getAESIV);
        encryptedUsers[4] = AES256Helper.Encrypt("603847219584", getAESKey, getAESIV);
        encryptedUsers[5] = AES256Helper.Encrypt("472105938672", getAESKey, getAESIV);
        encryptedUsers[6] = AES256Helper.Encrypt("836491025740", getAESKey, getAESIV);
        encryptedUsers[7] = AES256Helper.Encrypt("836491025712", getAESKey, getAESIV);

        return encryptedUsers;
    }
}
