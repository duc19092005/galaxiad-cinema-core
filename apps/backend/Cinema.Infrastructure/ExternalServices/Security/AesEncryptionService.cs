using System.Security.Cryptography;
using Cinema.Application.Abstractions.Security;

namespace Cinema.Infrastructure.Services;

public class AesEncryptionService : IEncryptionService
{
    public string Encrypt(string plainText, string keyHex, string ivHex)
    {
        using var aes = Aes.Create();
        aes.Key = Convert.FromHexString(keyHex);
        aes.IV = Convert.FromHexString(ivHex);
        aes.Mode = CipherMode.CBC;
        aes.Padding = PaddingMode.PKCS7;

        using var encryptor = aes.CreateEncryptor(aes.Key, aes.IV);
        using var msEncrypt = new MemoryStream();
        using (var csEncrypt = new CryptoStream(msEncrypt, encryptor, CryptoStreamMode.Write))
        using (var swEncrypt = new StreamWriter(csEncrypt))
        {
            swEncrypt.Write(plainText);
        }

        return Convert.ToBase64String(msEncrypt.ToArray());
    }

    public string Decrypt(string cipherText, string keyHex, string ivHex)
    {
        if (string.IsNullOrEmpty(cipherText))
        {
            return "";
        }

        using var aes = Aes.Create();
        aes.Key = Convert.FromHexString(keyHex);
        aes.IV = Convert.FromHexString(ivHex);
        aes.Mode = CipherMode.CBC;
        aes.Padding = PaddingMode.PKCS7;

        using var decryptor = aes.CreateDecryptor(aes.Key, aes.IV);
        using var msDecrypt = new MemoryStream(Convert.FromBase64String(cipherText));
        using var csDecrypt = new CryptoStream(msDecrypt, decryptor, CryptoStreamMode.Read);
        using var srDecrypt = new StreamReader(csDecrypt);
        return srDecrypt.ReadToEnd();
    }
}
