// ReSharper disable All

using Cinema.Application.Abstractions.Security;
using Cinema.Application.Exceptions;
using Cinema.Domain.Localization;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace Cinema.Application.Constants;

public class UserIdentityCodeConstant
{
    public IConfiguration _IConfiguration;
    
    private ILogger<UserIdentityCodeConstant> _logger;
    private readonly IEncryptionService _encryptionService;

    public UserIdentityCodeConstant(IConfiguration _IConfiguration ,
        ILogger<UserIdentityCodeConstant> _logger,
        IEncryptionService encryptionService)
    {
        this._IConfiguration = _IConfiguration;
        this._logger = _logger;
        _encryptionService = encryptionService;
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

        encryptedUsers[0] = _encryptionService.Encrypt("382947105632", getAESKey, getAESIV);
        encryptedUsers[1] = _encryptionService.Encrypt("710584293641", getAESKey, getAESIV);
        encryptedUsers[2] = _encryptionService.Encrypt("924618375025", getAESKey, getAESIV);
        encryptedUsers[3] = _encryptionService.Encrypt("159302847619", getAESKey, getAESIV);
        encryptedUsers[4] = _encryptionService.Encrypt("603847219584", getAESKey, getAESIV);
        encryptedUsers[5] = _encryptionService.Encrypt("472105938672", getAESKey, getAESIV);
        encryptedUsers[6] = _encryptionService.Encrypt("836491025740", getAESKey, getAESIV);
        encryptedUsers[7] = _encryptionService.Encrypt("836491025712", getAESKey, getAESIV);

        return encryptedUsers;
    }
}
