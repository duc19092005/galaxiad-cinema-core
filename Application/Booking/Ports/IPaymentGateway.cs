namespace Application.Booking.Ports;

/// <summary>
/// Cổng cổng thanh toán (VNPay). Tách Application khỏi chi tiết ký/参số của nhà cung cấp.
/// </summary>
public interface IPaymentGateway
{
    string GeneratePaymentUrl(long amount, string orderId, string ipAddress);

    bool ValidateCallback(IDictionary<string, string> parameters);

    bool IsPaymentSuccess(string responseCode);
}
