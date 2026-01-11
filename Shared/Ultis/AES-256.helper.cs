using System.Security.Cryptography;
using System.Text;

// ReSharper disable All

namespace Shared.Ultis;

public static class AES256Helper
{
    public static string Encrypt(string plainText, string keyHex, string ivHex)
    {
        using Aes aesAlg = Aes.Create();
        
        aesAlg.Key = Convert.FromHexString(keyHex); 
        aesAlg.IV = Convert.FromHexString(ivHex);
        
        aesAlg.Mode = CipherMode.CBC;
        aesAlg.Padding = PaddingMode.PKCS7;

        ICryptoTransform encryptor = aesAlg.CreateEncryptor(aesAlg.Key, aesAlg.IV);

        using MemoryStream msEncrypt = new MemoryStream();
        using (CryptoStream csEncrypt = new CryptoStream(msEncrypt, encryptor, CryptoStreamMode.Write))
        {
            using (StreamWriter swEncrypt = new StreamWriter(csEncrypt))
            {
                swEncrypt.Write(plainText);
            }
        }
        return Convert.ToBase64String(msEncrypt.ToArray());
    }
    
    public static string Decrypt(string cipherText, string keyHex, string ivHex)
    {
        if (string.IsNullOrEmpty(cipherText)) return "";

        using Aes aesAlg = Aes.Create();
        
        aesAlg.Key = Convert.FromHexString(keyHex);
        aesAlg.IV = Convert.FromHexString(ivHex);
        
        aesAlg.Mode = CipherMode.CBC;
        aesAlg.Padding = PaddingMode.PKCS7;

        ICryptoTransform decryptor = aesAlg.CreateDecryptor(aesAlg.Key, aesAlg.IV);

        using MemoryStream msDecrypt = new MemoryStream(Convert.FromBase64String(cipherText));
        using (CryptoStream csDecrypt = new CryptoStream(msDecrypt, decryptor, CryptoStreamMode.Read))
        {
            using (StreamReader srDecrypt = new StreamReader(csDecrypt))
            {
                return srDecrypt.ReadToEnd();
            }
        }
    }
}