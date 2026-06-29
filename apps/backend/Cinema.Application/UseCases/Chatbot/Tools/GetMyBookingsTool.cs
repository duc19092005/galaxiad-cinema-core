using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using Cinema.Application.Interfaces.Chatbot;
using Cinema.Application.Interfaces.Booking;
using Cinema.Application.Interfaces;
using Cinema.Application.Constants;
using Cinema.Domain.Constants;
using Cinema.Domain.Utils;

namespace Cinema.Application.UseCases.Chatbot.Tools;

public class GetMyBookingsTool : IChatTool
{
    private readonly IUserBookingRepository _repo;
    private readonly IUserContextService _userContextService;

    public GetMyBookingsTool(IUserBookingRepository repo, IUserContextService userContextService)
    {
        _repo = repo;
        _userContextService = userContextService;
    }

    public string IntentName => ChatbotConstants.Intents.GetMyBookings;

    public async Task<string> ExecuteAsync(Dictionary<string, string> parameters)
    {
        var userId = _userContextService.GetUserId();
        if (userId == Guid.Empty)
        {
            return JsonSerializer.Serialize(new { Error = ChatbotResponseMessages.Refusals.RequireLogin });
        }

        var orders = await _repo.GetUserBookingHistoryAsync(userId);
        var nowUtc = DateTime.UtcNow;

        var result = orders.Select(o => new
        {
            o.OrderId,
            o.OrderDate,
            o.TotalPrice,
            OrderStatus = o.OrderStatus.ToString(),
            MovieId = o.OrderDetailsInfo.Select(od => od.MovieScheduleInfoEntity.MovieInfoEntity!.MovieId).FirstOrDefault(),
            MovieName = o.OrderDetailsInfo.Select(od => od.MovieScheduleInfoEntity.MovieInfoEntity!.MovieName).FirstOrDefault() ?? "",
            CinemaName = o.OrderDetailsInfo.Select(od => od.MovieScheduleInfoEntity.AuditoriumInfoEntities!.CinemaInfoEntity.CinemaName).FirstOrDefault() ?? "",
            AuditoriumNumber = o.OrderDetailsInfo.Select(od => od.MovieScheduleInfoEntity.AuditoriumInfoEntities!.AuditoriumNumber).FirstOrDefault() ?? "",
            StartTime = DateTimeHelper.ToVietnamTime(o.OrderDetailsInfo.Select(od => od.MovieScheduleInfoEntity.StartTime).FirstOrDefault()),
            Seats = o.OrderDetailsInfo.Select(od => od.SeatsInfoEntity.SeatNumber).ToList(),
            MovieAiringStatus = o.OrderDetailsInfo.Select(od =>
                nowUtc < od.MovieScheduleInfoEntity.StartTime ? "Sắp chiếu (Upcoming)" :
                (nowUtc >= od.MovieScheduleInfoEntity.StartTime && nowUtc <= od.MovieScheduleInfoEntity.EndedTime) ? "Đang chiếu (Airing)" : "Đã kết thúc (Finished)"
            ).FirstOrDefault() ?? ""
        }).ToList();

        return JsonSerializer.Serialize(result);
    }
}
