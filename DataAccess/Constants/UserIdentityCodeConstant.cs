// ReSharper disable All


using Shared.Exceptions;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Shared.Utils;

namespace DataAccess.Constants;

public class user_identity_code_constant
{
    public IConfiguration _IConfiguration;
    
    private ILogger<user_identity_code_constant> _logger;

    public user_identity_code_constant(IConfiguration _IConfiguration ,
        ILogger<user_identity_code_constant> _logger)
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
            throw new AppException("There's a error with System", 500, "E01");
        }
    
        // Khởi tạo mảng để chứa 7 mã định danh đã mã hóa
        string[] encryptedUsers = new string[7];

        encryptedUsers[0] = AES256Helper.Encrypt("382947105632", getAESKey, getAESIV);
        encryptedUsers[1] = AES256Helper.Encrypt("710584293641", getAESKey, getAESIV);
        encryptedUsers[2] = AES256Helper.Encrypt("924618375025", getAESKey, getAESIV);
        encryptedUsers[3] = AES256Helper.Encrypt("159302847619", getAESKey, getAESIV);
        encryptedUsers[4] = AES256Helper.Encrypt("603847219584", getAESKey, getAESIV);
        encryptedUsers[5] = AES256Helper.Encrypt("472105938672", getAESKey, getAESIV);
        encryptedUsers[6] = AES256Helper.Encrypt("836491025740", getAESKey, getAESIV);

        return encryptedUsers;
    }
}
