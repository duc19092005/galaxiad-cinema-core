using System.Data;
using Application.Booking.Ports;
using Application.Common;
using Domain.Booking;
using Microsoft.Extensions.Logging;
using Shared.Enums;
using Shared.Exceptions;
using Shared.Localization;

namespace Application.Booking.UseCases;

/// <summary>
/// Use case tạo đơn đặt vé. Đóng gói toàn bộ quy tắc:
/// kiểm tra suất chiếu, ghế, phân khúc, định giá theo phụ thu, và tạo đơn Pending.
/// Khắc phục race-condition B2 bằng transaction Serializable bao quanh
/// (check ghế trống + insert), và bắt lỗi ghi trùng để báo "ghế vừa bị đặt".
/// </summary>
public class CreateBookingUseCase
{
    private readonly IOrderRepository _orderRepository;
    private readonly IBookingQueryRepository _query;
    private readonly IPaymentGateway _paymentGateway;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IClock _clock;
    private readonly ILogger<CreateBookingUseCase> _logger;

    public CreateBookingUseCase(
        IOrderRepository orderRepository,
        IBookingQueryRepository query,
        IPaymentGateway paymentGateway,
        IUnitOfWork unitOfWork,
        IClock clock,
        ILogger<CreateBookingUseCase> logger)
    {
        _orderRepository = orderRepository;
        _query = query;
        _paymentGateway = paymentGateway;
        _unitOfWork = unitOfWork;
        _clock = clock;
        _logger = logger;
    }

    public async Task<CreateBookingResult> ExecuteAsync(
        CreateBookingCommand command, Guid? userId, CancellationToken cancellationToken = default)
    {
        // Serializable bao quanh check + insert để chống đặt trùng ghế (B2).
        await using var transaction = await _unitOfWork.BeginTransactionAsync(
            IsolationLevel.Serializable, cancellationToken);
        try
        {
            var schedule = await _query.GetScheduleForBookingAsync(command.ScheduleId, cancellationToken);
            if (schedule == null || !schedule.MovieIsActive)
            {
                throw new BadRequestException(Messages.Booking.ScheduleNotFoundOrInactive, "BK01");
            }

            if (schedule.StartTime <= _clock.VietnamNow)
            {
                throw new BadRequestException(Messages.Booking.ShowtimeAlreadyStarted, "BK02");
            }

            var seatIds = command.SeatSelections.Select(s => s.SeatId).ToList();
            var segmentIds = command.SeatSelections.Select(s => s.UserSegmentId).Distinct().ToList();

            var validSeatCount = await _query.CountValidSeatsAsync(schedule.AuditoriumId, seatIds, cancellationToken);
            if (validSeatCount != seatIds.Count)
            {
                throw new BadRequestException(Messages.Booking.InvalidSeats, "BK03");
            }

            var validSegmentCount = await _query.CountValidSegmentsAsync(segmentIds, cancellationToken);
            if (validSegmentCount != segmentIds.Count)
            {
                throw new BadRequestException("Loại khách hàng không hợp lệ.", "BK06");
            }

            var occupied = await _query.GetOccupiedSeatIdsAsync(command.ScheduleId, seatIds, cancellationToken);
            if (occupied.Count > 0)
            {
                throw new BadRequestException(Messages.Booking.SeatsAlreadyBooked, "BK04");
            }

            var surcharges = schedule.CinemaId.HasValue
                ? await _query.GetSurchargesAsync(schedule.CinemaId.Value, schedule.MovieFormatId, cancellationToken)
                : new List<SurchargeInfo>();

            var details = new List<OrderDetail>();
            foreach (var sel in command.SeatSelections)
            {
                var surcharge = surcharges.FirstOrDefault(s => s.UserSegmentId == sel.UserSegmentId);
                var priceEach = schedule.BasePrice;
                if (surcharge != null)
                {
                    priceEach = schedule.BasePrice * (1 + (surcharge.SurchargePercent / 100));
                }
                priceEach = Math.Round(priceEach, 0);
                details.Add(new OrderDetail(sel.SeatId, command.ScheduleId, sel.UserSegmentId, priceEach));
            }

            string? customerName;
            string? customerEmail;
            string? customerAddress;

            if (userId.HasValue)
            {
                var info = await _query.GetUserCustomerInfoAsync(userId.Value, cancellationToken);
                customerName = info?.CustomerName;
                customerEmail = info?.CustomerEmail;
                customerAddress = null;
            }
            else
            {
                if (string.IsNullOrEmpty(command.CustomerName) || string.IsNullOrEmpty(command.CustomerEmail))
                {
                    throw new BadRequestException("Guest booking requires Customer Name and Email.", "BK05");
                }
                customerName = command.CustomerName;
                customerEmail = command.CustomerEmail;
                customerAddress = command.CustomerAddress;
            }

            var order = Order.CreatePending(
                userId,
                PaymentMethodEnum.VNPAY,
                _clock.VietnamNow,
                customerName,
                customerEmail,
                customerAddress,
                details);

            await _orderRepository.AddAsync(order, cancellationToken);

            try
            {
                await _unitOfWork.SaveChangesAsync(cancellationToken);
                await transaction.CommitAsync(cancellationToken);
            }
            catch (ConcurrencyConflictException)
            {
                // Ghế vừa bị người khác đặt giữa lúc check và insert.
                await transaction.RollbackAsync(cancellationToken);
                throw new BadRequestException(Messages.Booking.SeatsAlreadyBooked, "BK04");
            }

            var paymentUrl = _paymentGateway.GeneratePaymentUrl(
                (long)order.TotalPrice, order.OrderId.ToString(), command.IpAddress);

            return new CreateBookingResult(
                order.OrderId, paymentUrl, order.TotalPrice, order.TotalQuantity, order.OrderDate);
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync(cancellationToken);
            if (ex is AppException) throw;
            if (ex is DomainException domainEx)
            {
                throw new BadRequestException(domainEx.Message, "BK07");
            }
            _logger.LogError(ex, "Error creating booking");
            throw CustomSystemException.SystemExceptionCaller();
        }
    }
}
