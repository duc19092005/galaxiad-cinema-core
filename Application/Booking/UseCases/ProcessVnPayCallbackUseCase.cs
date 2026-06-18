using Application.Booking.Ports;
using Application.Common;
using Microsoft.Extensions.Logging;

namespace Application.Booking.UseCases;

/// <summary>
/// Use case xử lý callback VNPay. Idempotent: chỉ chuyển Pending → Booked/Canceled
/// đúng một lần kể cả khi VNPay gọi lại nhiều lần (khắc phục B5).
/// </summary>
public class ProcessVnPayCallbackUseCase
{
    private readonly IOrderRepository _orderRepository;
    private readonly IPaymentGateway _paymentGateway;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ILogger<ProcessVnPayCallbackUseCase> _logger;

    public ProcessVnPayCallbackUseCase(
        IOrderRepository orderRepository,
        IPaymentGateway paymentGateway,
        IUnitOfWork unitOfWork,
        ILogger<ProcessVnPayCallbackUseCase> logger)
    {
        _orderRepository = orderRepository;
        _paymentGateway = paymentGateway;
        _unitOfWork = unitOfWork;
        _logger = logger;
    }

    public async Task<(bool success, Guid orderId)> ExecuteAsync(
        IDictionary<string, string> vnpParams, CancellationToken cancellationToken = default)
    {
        if (!_paymentGateway.ValidateCallback(vnpParams))
        {
            _logger.LogWarning("Invalid VNPay callback signature");
            return (false, Guid.Empty);
        }

        vnpParams.TryGetValue("vnp_TxnRef", out var orderIdStr);
        vnpParams.TryGetValue("vnp_ResponseCode", out var responseCode);
        vnpParams.TryGetValue("vnp_TransactionNo", out var transactionId);
        orderIdStr ??= "";
        responseCode ??= "";
        transactionId ??= "";

        if (!Guid.TryParse(orderIdStr, out var orderId))
        {
            _logger.LogWarning("Invalid order ID in VNPay callback: {OrderId}", orderIdStr);
            return (false, Guid.Empty);
        }

        var order = await _orderRepository.GetByIdAsync(orderId, cancellationToken);
        if (order == null)
        {
            _logger.LogWarning("Order not found for VNPay callback: {OrderId}", orderId);
            return (false, orderId);
        }

        if (!order.IsPending)
        {
            // Đã xử lý trước đó → idempotent, không xử lý lại.
            _logger.LogWarning("Order {OrderId} is not Pending, current: {Status}", orderId, order.OrderStatus);
            return (false, orderId);
        }

        var isSuccess = _paymentGateway.IsPaymentSuccess(responseCode);

        if (isSuccess)
        {
            order.ConfirmPayment(transactionId);
        }
        else
        {
            order.Cancel();
        }

        await _orderRepository.UpdateAsync(order, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return (isSuccess, orderId);
    }
}
