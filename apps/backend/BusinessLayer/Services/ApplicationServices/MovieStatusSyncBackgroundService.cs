using BusinessLayer.Entities.MovieInfos;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Shared.Interfaces.Persistence;

namespace BusinessLayer.Services.ApplicationServices;

public class MovieStatusSyncBackgroundService : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<MovieStatusSyncBackgroundService> _logger;

    public MovieStatusSyncBackgroundService(IServiceProvider serviceProvider, ILogger<MovieStatusSyncBackgroundService> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("MovieStatusSyncBackgroundService starting...");
        
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await SyncMovieStatusesAsync(stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred executing MovieStatusSyncBackgroundService.");
            }

            // Chờ 10 phút trước khi chạy lại lệnh
            await Task.Delay(TimeSpan.FromMinutes(10), stoppingToken);
        }
    }

    private async Task SyncMovieStatusesAsync(CancellationToken cancellationToken)
    {
        using var scope = _serviceProvider.CreateScope();
        var unitOfWork = scope.ServiceProvider.GetRequiredService<IUnitOfWork>();
        var aiMovieEmbeddingSyncService = scope.ServiceProvider.GetRequiredService<AiMovieEmbeddingSyncService>();

        // Lấy thời gian hiện tại chuẩn Việt Nam (UTC+7)
        TimeZoneInfo vietnamTimeZone;
        try
        {
            vietnamTimeZone = TimeZoneInfo.FindSystemTimeZoneById("SE Asia Standard Time"); // Windows
        }
        catch (TimeZoneNotFoundException)
        {
            vietnamTimeZone = TimeZoneInfo.FindSystemTimeZoneById("Asia/Ho_Chi_Minh"); // Linux/Mac
        }

        var currentVnTime = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, vietnamTimeZone);

        _logger.LogInformation("MovieStatusSyncBackgroundService running sync at {Time}", currentVnTime);

        // 1. Cập nhật MovieInfoEntity: nếu Current > EndedDate -> IsActive = false
        var movieRepository = unitOfWork.Repository<MovieInfoEntity>();
        var scheduleRepository = unitOfWork.Repository<MovieScheduleInfoEntity>();

        var overDueMovies = await movieRepository.Query()
            .Where(m => m.IsActive == true && m.EndedDate < currentVnTime && !m.IsDeleted)
            .ToListAsync(cancellationToken);

        if (overDueMovies.Any())
        {
            foreach (var movie in overDueMovies)
            {
                movie.IsActive = false;
            }
            foreach (var movie in overDueMovies)
            {
                movieRepository.Update(movie);
            }
            _logger.LogInformation($"Updated {overDueMovies.Count} movies to IsActive = false due to EndedDate.");
        }

        // Nếu ActiveAt <= Current < EndedDate -> IsActive = true, IsCommingSoon = false
        var startingMovies = await movieRepository.Query()
            .Where(m => (m.IsActive == false || m.IsCommingSoon == true) 
                        && m.ActiveAt <= currentVnTime && m.EndedDate > currentVnTime && !m.IsDeleted)
            .ToListAsync(cancellationToken);

        if (startingMovies.Any())
        {
            foreach (var movie in startingMovies)
            {
                movie.IsActive = true;
                movie.IsCommingSoon = false;
            }
            foreach (var movie in startingMovies)
            {
                movieRepository.Update(movie);
            }
            _logger.LogInformation($"Updated {startingMovies.Count} movies to IsActive = true, IsCommingSoon = false.");
        }

        // 2. Cập nhật MovieScheduleInfoEntity (Lịch chiếu): nếu Current > EndedTime -> IsActive = false
        var overDueSchedules = await scheduleRepository.Query()
            .Where(s => s.IsActive == true && s.EndedTime < currentVnTime && !s.IsDeleted)
            .ToListAsync(cancellationToken);

        if (overDueSchedules.Any())
        {
            foreach (var schedule in overDueSchedules)
            {
                schedule.IsActive = false;
            }
            foreach (var schedule in overDueSchedules)
            {
                scheduleRepository.Update(schedule);
            }
            _logger.LogInformation($"Updated {overDueSchedules.Count} schedules to IsActive = false due to EndedTime.");
        }
        
        // Cập nhật lịch chiếu tới giờ chạy (StartTime <= Current < EndedTime)
        var startingSchedules = await scheduleRepository.Query()
            .Where(s => s.IsActive == false && s.StartTime <= currentVnTime && s.EndedTime > currentVnTime && !s.IsDeleted)
            .ToListAsync(cancellationToken);
            
        if (startingSchedules.Any())
        {
            foreach (var schedule in startingSchedules)
            {
                schedule.IsActive = true;
            }
            foreach (var schedule in startingSchedules)
            {
                scheduleRepository.Update(schedule);
            }
            _logger.LogInformation($"Updated {startingSchedules.Count} schedules to IsActive = true.");
        }

        if (overDueMovies.Any() || startingMovies.Any() || overDueSchedules.Any() || startingSchedules.Any())
        {
            await unitOfWork.SaveChangesAsync(cancellationToken);
            _logger.LogInformation("Changes saved to database successfully.");

            foreach (var movie in startingMovies)
            {
                await aiMovieEmbeddingSyncService.SyncMovieAsync(movie.MovieId, cancellationToken);
            }

            foreach (var movie in overDueMovies)
            {
                await aiMovieEmbeddingSyncService.DeleteMovieAsync(movie.MovieId, cancellationToken);
            }
        }
    }
}
