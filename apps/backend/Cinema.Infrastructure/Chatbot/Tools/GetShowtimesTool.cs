using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using Cinema.Application.Interfaces.Chatbot;
using Cinema.Application.Interfaces.Catalog;
using Cinema.Domain.Constants;
using Cinema.Domain.Localization;
using Cinema.Domain.Utils;

namespace Cinema.Infrastructure.Chatbot.Tools;

public class GetShowtimesTool : IChatTool
{
    private readonly IPublicCatalogRepository _catalogRepository;

    public GetShowtimesTool(IPublicCatalogRepository catalogRepository)
    {
        _catalogRepository = catalogRepository;
    }

    public string IntentName => ChatbotConstants.Intents.GetShowtimes;

    public async Task<string> ExecuteAsync(Dictionary<string, string> parameters)
    {
        Guid movieId = Guid.Empty;
        if (parameters.TryGetValue("movieId", out var movieIdStr) && Guid.TryParse(movieIdStr, out var parsedMovieId))
        {
            movieId = parsedMovieId;
        }

        string? city = null;
        if (parameters.TryGetValue("city", out var cityParam) && !string.IsNullOrWhiteSpace(cityParam))
        {
            city = cityParam;
        }

        // Check if a date range (fromDate / toDate) was provided (e.g. "tuần này", "cuối tuần")
        parameters.TryGetValue("fromDate", out var fromDateStr);
        parameters.TryGetValue("toDate", out var toDateStr);
        DateTime parsedFromDate = DateTime.MinValue;
        DateTime parsedToDate = DateTime.MinValue;
        bool hasRange = !string.IsNullOrWhiteSpace(fromDateStr)
                     && !string.IsNullOrWhiteSpace(toDateStr)
                     && DateTime.TryParse(fromDateStr, out parsedFromDate)
                     && DateTime.TryParse(toDateStr, out parsedToDate);

        if (hasRange)
        {
            var startUtcRange = DateTimeHelper.ToUtc(parsedFromDate.Date);
            var endUtcRange = DateTimeHelper.ToUtc(parsedToDate.Date).AddDays(1); // inclusive

            var rangeSchedules = await _catalogRepository.GetSchedulesByDateAsync(startUtcRange, endUtcRange, city);

            if (rangeSchedules.Count == 0)
            {
                var upcomingDates = await _catalogRepository.GetAllUpcomingUtcTimesAsync(city, null);
                var datesList = upcomingDates
                    .Select(d => DateTimeHelper.ToVietnamTime(d).ToString("yyyy-MM-dd"))
                    .Distinct().Take(7).ToList();
                return JsonSerializer.Serialize(new
                {
                    Message = Messages.Chatbot.NoShowtimesForDate,
                    AvailableDates = datesList
                });
            }

            var rangeResult = rangeSchedules.Select(s => new
            {
                ScheduleId = s.MovieScheduleInfoId,
                MovieId = s.MovieInfoEntity?.MovieId,
                MovieName = s.MovieInfoEntity?.MovieName ?? "",
                CinemaName = s.AuditoriumInfoEntities?.CinemaInfoEntity?.CinemaName ?? "",
                CinemaLocation = s.AuditoriumInfoEntities?.CinemaInfoEntity?.CinemaLocation ?? "",
                AuditoriumNumber = s.AuditoriumInfoEntities?.AuditoriumNumber ?? "",
                FormatName = s.MovieFormatInfoEntity?.MovieFormatName ?? "",
                Date = DateTimeHelper.ToVietnamTime(s.StartTime).ToString("dd/MM/yyyy"),
                ShowTime = DateTimeHelper.ToVietnamTime(s.StartTime).ToString("HH:mm")
            })
            .OrderBy(s => s.Date).ThenBy(s => s.ShowTime)
            .ToList();

            return JsonSerializer.Serialize(new
            {
                FromDate = parsedFromDate.ToString("dd/MM/yyyy"),
                ToDate = parsedToDate.ToString("dd/MM/yyyy"),
                Schedules = rangeResult
            });
        }

        // Single-day query
        DateTime date = DateTime.Today;
        if (parameters.TryGetValue("date", out var dateStr) && DateTime.TryParse(dateStr, out var parsedDate))
        {
            date = parsedDate;
        }

        if (movieId == Guid.Empty)
        {
            // No specific movie - return all schedules for the given date
            var startUtcAll = DateTimeHelper.ToUtc(date.Date);
            var endUtcAll = startUtcAll.AddDays(1);

            var allSchedules = await _catalogRepository.GetSchedulesByDateAsync(startUtcAll, endUtcAll, city);

            if (allSchedules.Count == 0)
            {
                // Return upcoming dates as fallback
                var upcomingDates = await _catalogRepository.GetAllUpcomingUtcTimesAsync(city, null);
                var datesList = upcomingDates.Select(d => DateTimeHelper.ToVietnamTime(d).ToString("yyyy-MM-dd")).Distinct().Take(7).ToList();
                return JsonSerializer.Serialize(new
                {
                    Message = Messages.Chatbot.NoShowtimesForDate,
                    AvailableDates = datesList
                });
            }

            var scheduleResult = allSchedules.Select(s => new
            {
                ScheduleId = s.MovieScheduleInfoId,
                MovieId = s.MovieInfoEntity?.MovieId,
                MovieName = s.MovieInfoEntity?.MovieName ?? "",
                CinemaName = s.AuditoriumInfoEntities?.CinemaInfoEntity?.CinemaName ?? "",
                CinemaLocation = s.AuditoriumInfoEntities?.CinemaInfoEntity?.CinemaLocation ?? "",
                AuditoriumNumber = s.AuditoriumInfoEntities?.AuditoriumNumber ?? "",
                FormatName = s.MovieFormatInfoEntity?.MovieFormatName ?? "",
                ShowTime = DateTimeHelper.ToVietnamTime(s.StartTime).ToString("HH:mm")
            }).ToList();

            return JsonSerializer.Serialize(new
            {
                Date = date.ToString("dd/MM/yyyy"),
                Schedules = scheduleResult
            });
        }

        var startUtc = DateTimeHelper.ToUtc(date.Date);
        var endUtc = startUtc.AddDays(1);

        var flatSchedules = await _catalogRepository.GetScheduleDetailsRawAsync(movieId, startUtc, endUtc, city);

        var result = flatSchedules.Select(s => new
        {
            ScheduleId = s.MovieScheduleInfoId,
            MovieId = s.MovieInfoEntity?.MovieId,
            MovieName = s.MovieInfoEntity?.MovieName ?? "",
            CinemaName = s.AuditoriumInfoEntities?.CinemaInfoEntity?.CinemaName ?? "",
            CinemaLocation = s.AuditoriumInfoEntities?.CinemaInfoEntity?.CinemaLocation ?? "",
            AuditoriumNumber = s.AuditoriumInfoEntities?.AuditoriumNumber ?? "",
            FormatName = s.MovieFormatInfoEntity?.MovieFormatName ?? "",
            ShowTime = DateTimeHelper.ToVietnamTime(s.StartTime).ToString("HH:mm:ss")
        }).ToList();

        return JsonSerializer.Serialize(result);
    }
}

