namespace BusinessLayer.Interfaces.IThirdPersonServices;

public interface ISha256Services
{
    string Encrypt(string text, string secretKey);
}
