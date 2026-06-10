using Application.Booking.Ports;
using Application.Common;
using Microsoft.Extensions.Logging;

namespace Application.Booking.UseCases;

/// <summary>
/// Huỷ các đơn Pending đã quá hạn thanh toán để nhả ghế bị giữ (khắc phục B3).
/// Dùng cùng quy tắc chuyển trạng thái của domain (Order.Cancel) → chỉ huỷ đơn còn Pending.
/// </summary>
public class CancelExpiredPendingOrdersUseCase
{
    /// <summary>Thời gian giữ chỗ tối đa cho đơn Pending (khớp vnp_ExpireDate = 15 phút).</summary>
    public static readonly TimeSpan HoldDuration = TimeSpan.FromMinutes(15);

    private const int MaxBatch = 200;

    private readonly IExpiredOrderQuery _expiredOrderQuery;
    private readonly IOrderRepository _orderRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IClock _clock;
    private readonly ILogger<CancelExpiredPendingOrdersUseCase> _logger;

    public CancelExpiredPendingOrdersUseCase(
        IExpiredOrderQuery expiredOrderQuery,
        IOrderRepository orderRepository,
        IUnitOfWork unitOfWork,
        IClock clock,
        ILogger<CancelExpiredPendingOrdersUseCase> logger)
    {
        _expiredOrderQuery = expiredOrderQuery;
        _orderRepository = orderRepository;
        _unitOfWork = unitOfWork;
        _clock = clock;
        _logger = logger;
    }

    /// <summary>Trả về số đơn đã huỷ.</summary>
    public async Task<int> ExecuteAsync(CancellationToken cancellationToken = default)
    {
        var cutoff = _clock.VietnamNow - HoldDuration;
        var expiredIds = await _expiredOrderQuery.GetExpiredPendingOrderIdsAsync(cutoff, MaxBatch, cancellationToken);

        var cancelled = 0;
        foreach (var orderId in expiredIds)
        {
            var order = await _orderRepository.GetByIdAsync(orderId, cancellationToken);
            if (order == null)
            {
                continue;
            }
            if (order.Cancel())
            {
                await _orderRepository.UpdateAsync(order, cancellationToken);
                cancelled++;
            }
        }

        if (cancelled > 0)
        {
            await _unitOfWork.SaveChangesAsync(cancellationToken);
            _logger.LogInformation("Cancelled {Count} expired pending orders.", cancelled);
        }

        return cancelled;
    }
}
