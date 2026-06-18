namespace BusinessLayer.Interfaces.IThirdPersonServices;

public interface IVnPayService
{
    string GenerateVnpayUrl(long amount, string orderId, string ipAddress);
}
