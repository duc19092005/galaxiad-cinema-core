using System.Collections.Generic;

namespace Cinema.Application.Interfaces.IThirdPersonServices;

public interface IVnPayService
{
    string GenerateVnpayUrl(long amount, string orderId, string ipAddress);
    bool ValidateCallback(IDictionary<string, string> vnpParams);
    bool IsPaymentSuccess(string responseCode);
}
