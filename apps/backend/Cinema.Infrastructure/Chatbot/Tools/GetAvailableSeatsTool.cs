using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using Cinema.Application.Interfaces.Catalog;
using Cinema.Application.Interfaces.Chatbot;
using Cinema.Domain.Constants;
using Cinema.Domain.Localization;
using Cinema.Domain.Utils;

namespace Cinema.Infrastructure.Chatbot.Tools;

public class GetAvailableSeatsTool : IChatTool
{
    private readonly IPublicCatalogRepository _catalogRepo;

    public GetAvailableSeatsTool(IPublicCatalogRepository catalogRepo)
    {
        _catalogRepo = catalogRepo;
    }

    public string IntentName => ChatbotConstants.Intents.GetAvailableSeats;

    public async Task<string> ExecuteAsync(Dictionary<string, string> parameters)
    {
        parameters.TryGetValue("movieName", out var movieName);
        parameters.TryGetValue("date",      out var dateStr);
        parameters.TryGetValue("time",      out var timeStr);

        // Guard: cần ít nhất movieName hoặc date
        if (string.IsNullOrWhiteSpace(movieName) && string.IsNullOrWhiteSpace(dateStr))
        {
            return JsonSerializer.Serialize(new
            {
                Error = Messages.Chatbot.ProvideMovieOrDate
            });
        }

        // Parse date → UTC range (mặc định hôm nay nếu không có)
        var localDate = DateTime.TryParse(dateStr, out var parsed) ? parsed.Date : DateTime.Today;
        var startUtc  = DateTimeHelper.ToUtc(localDate);
        var endUtc    = startUtc.AddDays(1);

        // Step 1: Lấy tất cả suất chiếu trong ngày
        var schedules = await _catalogRepo.GetSchedulesByDateAsync(startUtc, endUtc, city: null);

        // Step 2: Lọc theo tên phim nếu có
        if (!string.IsNullOrWhiteSpace(movieName))
        {
            schedules = schedules
                .Where(s => s.MovieInfoEntity != null &&
                            s.MovieInfoEntity.MovieName.Contains(movieName, StringComparison.OrdinalIgnoreCase))
                .ToList();
        }

        // Step 3: Lọc theo giờ chiếu nếu có (so sánh theo giờ)
        if (!string.IsNullOrWhiteSpace(timeStr) && TimeSpan.TryParse(timeStr, out var requestedTime))
        {
            schedules = schedules
                .Where(s =>
                {
                    var vnTime = DateTimeHelper.ToVietnamTime(s.StartTime).TimeOfDay;
                    return Math.Abs(vnTime.Hours - requestedTime.Hours) <= 1;
                })
                .ToList();
        }

        if (schedules.Count == 0)
        {
            return JsonSerializer.Serialize(new
            {
                Message = Messages.Chatbot.NoMatchingSchedule
            });
        }

        // Nếu có quá nhiều suất khớp → trả danh sách để user chọn
        if (schedules.Count > 3)
        {
            return JsonSerializer.Serialize(new
            {
                Message  = "Tìm thấy nhiều suất chiếu. Bạn muốn xem ghế của suất nào?",
                Schedules = schedules.Take(5).Select(s => new
                {
                    ScheduleId = s.MovieScheduleInfoId,
                    MovieName  = s.MovieInfoEntity?.MovieName ?? "",
                    ShowTime   = DateTimeHelper.ToVietnamTime(s.StartTime).ToString("HH:mm dd/MM/yyyy"),
                    CinemaName = s.AuditoriumInfoEntities?.CinemaInfoEntity?.CinemaName ?? ""
                })
            });
        }

        // Step 4: Lấy chi tiết ghế — tái dụng GetAuditoriumDetailsAsync đã có sẵn
        var targetScheduleId = schedules.First().MovieScheduleInfoId;
        var auditoriumInfo   = await _catalogRepo.GetAuditoriumDetailsAsync(targetScheduleId);

        if (auditoriumInfo == null)
        {
            return JsonSerializer.Serialize(new { Message = Messages.Chatbot.NoAuditoriumInfo });
        }

        var availableSeats = auditoriumInfo.SeatMap
            .Where(s => !s.IsBooked)
            .Select(s => new { s.SeatName })
            .ToList();

        var targetSchedule = schedules.First();

        return JsonSerializer.Serialize(new
        {
            ScheduleId     = targetScheduleId,
            MovieName      = auditoriumInfo.MovieName,
            ShowTime       = DateTimeHelper.ToVietnamTime(auditoriumInfo.StartTime).ToString("HH:mm dd/MM/yyyy"),
            CinemaName     = targetSchedule.AuditoriumInfoEntities?.CinemaInfoEntity?.CinemaName ?? "",
            AuditoriumName = auditoriumInfo.AuditoriumName,
            AvailableCount = availableSeats.Count,
            TotalSeats     = auditoriumInfo.SeatMap.Count,
            AvailableSeats = availableSeats
        });
    }
}
