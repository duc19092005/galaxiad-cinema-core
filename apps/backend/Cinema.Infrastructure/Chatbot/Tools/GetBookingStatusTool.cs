using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using Cinema.Application.Constants;
using Cinema.Application.Interfaces;
using Cinema.Application.Interfaces.Booking;
using Cinema.Application.Interfaces.Chatbot;
using Cinema.Domain.Constants;
using Cinema.Domain.Utils;
using Cinema.Domain.Localization;

namespace Cinema.Infrastructure.Chatbot.Tools;

public class GetBookingStatusTool : IChatTool
{
    private readonly IUserBookingRepository _repo;
    private readonly IUserContextService    _userContextService;

    public GetBookingStatusTool(
        IUserBookingRepository  repo,
        IUserContextService     userContextService)
    {
        _repo               = repo;
        _userContextService = userContextService;
    }

    public string IntentName => ChatbotConstants.Intents.GetBookingStatus;

    public async Task<string> ExecuteAsync(Dictionary<string, string> parameters)
    {
        // Guard 1: Phải đăng nhập
        var userId = Guid.Empty;
        try { userId = _userContextService.GetUserId(); } catch { }

        if (userId == Guid.Empty)
            return JsonSerializer.Serialize(new { Error = ChatbotResponseMessages.Refusals.RequireLogin });

        // Guard 2: Phải có bookingCode
        if (!parameters.TryGetValue("bookingCode", out var bookingCode)
            || string.IsNullOrWhiteSpace(bookingCode))
        {
            return JsonSerializer.Serialize(new
            {
                Error = "Vui lòng cung cấp mã đặt vé của bạn (ví dụ: GXD-XXXXXXXX)."
            });
        }

        // Guard 3: Ownership — chỉ được xem đơn của chính mình
        var order = await _repo.GetOrderByBookingCodeAsync(bookingCode.Trim().ToUpper());

        // Dùng cùng một thông báo cho cả "không tồn tại" lẫn "không phải của bạn"
        // để tránh user đoán mò mã của người khác (security by obscurity)
        if (order == null || order.UserId != userId)
            return JsonSerializer.Serialize(new { Error = ChatbotResponseMessages.Refusals.BookingNotFound });

        var firstDetail = order.OrderDetailsInfo.FirstOrDefault();
        var schedule    = firstDetail?.MovieScheduleInfoEntity;
        var cinema      = schedule?.AuditoriumInfoEntities?.CinemaInfoEntity;

        return JsonSerializer.Serialize(new
        {
            order.BookingCode,
            OrderStatus  = order.OrderStatus.ToString(),
            OrderDate    = order.OrderDate.ToString("dd/MM/yyyy HH:mm"),
            TotalPrice   = order.TotalPrice,
            FinalAmount  = order.FinalAmount,
            MovieName    = schedule?.MovieInfoEntity?.MovieName ?? "",
            CinemaName   = cinema?.CinemaName ?? "",
            ShowTime     = schedule != null
                           ? DateTimeHelper.ToVietnamTime(schedule.StartTime).ToString("HH:mm dd/MM/yyyy")
                           : "",
            Seats = order.OrderDetailsInfo
                         .Select(d => d.SeatsInfoEntity.SeatNumber)
                         .ToList()
        });
    }
}
