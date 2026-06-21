using Cinema.Application.Interfaces.Booking;
using Microsoft.Extensions.Logging;
using Cinema.Domain.Enums;
using Cinema.Domain.Utils;
using Cinema.Application.Interfaces.IThirdPersonServices;
using Cinema.Domain.Interfaces.Persistence;
using Cinema.Domain.Localization;

namespace Cinema.Application.UseCases.Booking;

public class ProcessVnPayCallbackUseCase
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IPaymentCallbackRepository _repo;
    private readonly IVnPayService _vnPayService;
    private readonly ILogger<ProcessVnPayCallbackUseCase> _logger;

    public ProcessVnPayCallbackUseCase(
        IPaymentCallbackRepository repo,
        IVnPayService vnPayService,
        ILogger<ProcessVnPayCallbackUseCase> logger,
        IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
        _repo = repo;
        _vnPayService = vnPayService;
        _logger = logger;
    }

    public async Task<(bool success, Guid orderId)> ExecuteAsync(IDictionary<string, string> vnpParams)
    {
        // Validate signature
        if (!_vnPayService.ValidateCallback(vnpParams))
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

        var order = await _repo.GetOrderByIdAsync(orderId);

        if (order == null)
        {
            _logger.LogWarning("Order not found for VNPay callback: {OrderId}", orderId);
            return (false, orderId);
        }

        if (order.OrderStatus != OrderStatusEnum.Pending)
        {
            _logger.LogWarning("Order {OrderId} is not in Pending status, current: {Status}",
                orderId, order.OrderStatus);
            return (false, orderId);
        }

        var isSuccess = _vnPayService.IsPaymentSuccess(responseCode);

        if (isSuccess)
        {
            order.OrderStatus = OrderStatusEnum.Booked;
            order.VnPayTransactionId = transactionId;

            // Credit points and mark voucher as used
            if (order.UserId.HasValue)
            {
                var customerProfile = await _repo.GetCustomerProfileWithSegmentAsync(order.UserId.Value);

                decimal earningMultiplier = 1m;
                if (customerProfile?.UserSegmentsInfoEntity != null)
                {
                    var segmentName = customerProfile.UserSegmentsInfoEntity.UserSegmentName;
                    if (segmentName == "VIP Member")
                        earningMultiplier = 2m;
                    else if (segmentName == "Student")
                        earningMultiplier = 1.5m;
                }

                var ticketCount = await _repo.CountOrderDetailsAsync(order.OrderId);
                var pointsFromPrice = (long)Math.Floor(order.TotalPrice / 10000m);
                var pointsFromTickets = ticketCount * 10L;
                var pointsEarned = Math.Max(1L, (long)Math.Floor((pointsFromPrice + pointsFromTickets) * earningMultiplier));

                if (pointsEarned > 0)
                {
                    var user = await _repo.FindUserByIdAsync(order.UserId.Value);
                    if (user != null)
                    {
                        user.RewardPoints += pointsEarned;
                    }
                }

                if (order.VoucherId.HasValue)
                {
                    var userVoucher = await _repo.GetUserVoucherForUsageAsync(order.VoucherId.Value, order.UserId.Value);
                    if (userVoucher != null)
                    {
                        userVoucher.IsUsed = true;
                        userVoucher.UsedAt = DateTime.UtcNow;
                    }
                }
            }
        }
        else
        {
            order.OrderStatus = OrderStatusEnum.Canceled;
        }

        await _unitOfWork.SaveChangesAsync();

        return (isSuccess, orderId);
    }
}

