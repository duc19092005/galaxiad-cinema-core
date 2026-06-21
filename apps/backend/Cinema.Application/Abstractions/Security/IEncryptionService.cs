namespace Cinema.Application.Abstractions.Security;

public interface IEncryptionService
{
    string Encrypt(string plainText, string keyHex, string ivHex);

    string Decrypt(string cipherText, string keyHex, string ivHex);
}
