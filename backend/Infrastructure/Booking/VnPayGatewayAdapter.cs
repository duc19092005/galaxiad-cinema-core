using Application.Booking.Ports;
using Shared.Utils;

namespace Infrastructure.Booking;

/// <summary>
/// Adapter cho cổng thanh toán VNPay, dùng VnPayHelper (Shared) cho cả tạo URL lẫn verify callback.
/// Hợp nhất về một implementation VNPay duy nhất (giảm thiểu B6).
/// </summary>
public class VnPayGatewayAdapter : IPaymentGateway
{
    private readonly VnPayHelper _vnPayHelper;

    public VnPayGatewayAdapter(VnPayHelper vnPayHelper)
    {
        _vnPayHelper = vnPayHelper;
    }

    public string GeneratePaymentUrl(long amount, string orderId, string ipAddress)
    {
        var orderGuid = Guid.TryParse(orderId, out var g) ? g : Guid.Empty;
        var orderInfo = $"Thanh toan don hang {orderId}";
        return _vnPayHelper.CreatePaymentUrl(orderGuid, amount, orderInfo, ipAddress);
    }

    public bool ValidateCallback(IDictionary<string, string> parameters)
        => _vnPayHelper.ValidateCallback(parameters);

    public bool IsPaymentSuccess(string responseCode)
        => _vnPayHelper.IsPaymentSuccess(responseCode);
}
