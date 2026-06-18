using Application.Identity.Ports;
using Microsoft.Extensions.Configuration;
using Shared.Exceptions;
using Shared.Utils;

namespace Infrastructure.Identity;

/// <summary>Mã hoá/giải mã dữ liệu định danh nhạy cảm bằng AES-256 (key/iv từ cấu hình).</summary>
public class Aes256IdentityProtector : IIdentityProtector
{
    private readonly string _key;
    private readonly string _iv;

    public Aes256IdentityProtector(IConfiguration configuration)
    {
        _key = configuration["AES_256:Key"] ?? throw CustomSystemException.SystemExceptionCaller();
        _iv = configuration["AES_256:IV"] ?? throw CustomSystemException.SystemExceptionCaller();
    }

    public string Encrypt(string plainText) => AES256Helper.Encrypt(plainText, _key, _iv);

    public string Decrypt(string cipherText) => AES256Helper.Decrypt(cipherText, _key, _iv);
}
