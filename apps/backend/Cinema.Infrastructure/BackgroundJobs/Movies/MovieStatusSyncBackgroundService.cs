using Cinema.Domain.Entities.MovieInfos;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Cinema.Domain.Interfaces.Persistence;

namespace Cinema.Infrastructure.BackgroundJobs;

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

        var utcNow = DateTime.UtcNow;

        _logger.LogInformation("MovieStatusSyncBackgroundService running sync at UTC {Time}", utcNow);

        // 1. Cập nhật MovieInfoEntity: nếu Current > EndedDate -> IsActive = false, IsCommingSoon = false
        var movieRepository = unitOfWork.Repository<MovieInfoEntity>();
        var scheduleRepository = unitOfWork.Repository<MovieScheduleInfoEntity>();

        var overDueMovieIds = await movieRepository.Query()
            .Where(m => (m.IsActive == true || m.IsCommingSoon == true) && m.EndedDate < utcNow && !m.IsDeleted)
            .Select(m => m.MovieId)
            .ToListAsync(cancellationToken);

        if (overDueMovieIds.Any())
        {
            await movieRepository.Query()
                .Where(m => overDueMovieIds.Contains(m.MovieId))
                .ExecuteUpdateAsync(setters => setters
                    .SetProperty(m => m.IsActive, false)
                    .SetProperty(m => m.IsCommingSoon, false), cancellationToken);

            _logger.LogInformation($"Updated {overDueMovieIds.Count} movies to IsActive = false, IsCommingSoon = false due to EndedDate.");
        }

        // Nếu ActiveAt <= Current < EndedDate -> IsActive = true, IsCommingSoon = false
        var startingMovieIds = await movieRepository.Query()
            .Where(m => (m.IsActive == false || m.IsCommingSoon == true) 
                        && m.ActiveAt <= utcNow && m.EndedDate > utcNow && !m.IsDeleted)
            .Select(m => m.MovieId)
            .ToListAsync(cancellationToken);

        if (startingMovieIds.Any())
        {
            await movieRepository.Query()
                .Where(m => startingMovieIds.Contains(m.MovieId))
                .ExecuteUpdateAsync(setters => setters
                    .SetProperty(m => m.IsActive, true)
                    .SetProperty(m => m.IsCommingSoon, false), cancellationToken);

            _logger.LogInformation($"Updated {startingMovieIds.Count} movies to IsActive = true, IsCommingSoon = false.");
        }

        // 2. Cập nhật MovieScheduleInfoEntity (Lịch chiếu): nếu Current > EndedTime -> IsActive = false
        var overDueScheduleCount = await scheduleRepository.Query()
            .Where(s => s.IsActive == true && s.EndedTime < utcNow && !s.IsDeleted)
            .ExecuteUpdateAsync(setters => setters.SetProperty(s => s.IsActive, false), cancellationToken);

        if (overDueScheduleCount > 0)
        {
            _logger.LogInformation($"Updated {overDueScheduleCount} schedules to IsActive = false due to EndedTime.");
        }
        
        // Cập nhật lịch chiếu tới giờ chạy (StartTime <= Current < EndedTime)
        var startingScheduleCount = await scheduleRepository.Query()
            .Where(s => s.IsActive == false && s.StartTime <= utcNow && s.EndedTime > utcNow && !s.IsDeleted)
            .ExecuteUpdateAsync(setters => setters.SetProperty(s => s.IsActive, true), cancellationToken);
            
        if (startingScheduleCount > 0)
        {
            _logger.LogInformation($"Updated {startingScheduleCount} schedules to IsActive = true.");
        }

        // Đồng bộ AI (nếu có cập nhật phim)
        if (startingMovieIds.Any() || overDueMovieIds.Any())
        {
            foreach (var movieId in startingMovieIds)
            {
                await aiMovieEmbeddingSyncService.SyncMovieAsync(movieId, cancellationToken);
            }

            foreach (var movieId in overDueMovieIds)
            {
                await aiMovieEmbeddingSyncService.DeleteMovieAsync(movieId, cancellationToken);
            }
        }
    }
}
