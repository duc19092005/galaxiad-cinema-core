using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Cinema.Application.Interfaces.Comments;
using Cinema.Domain.Entities.MovieInfos;
using StackExchange.Redis;

namespace Cinema.Infrastructure.BackgroundJobs;

public class MovieViewBufferSyncService : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly IConnectionMultiplexer _redis;
    private readonly ILogger<MovieViewBufferSyncService> _logger;

    private const string QueueKey = "cinema:movie_views_queue";
    private const int BatchSizeThreshold = 100;
    private readonly TimeSpan _maxSyncInterval = TimeSpan.FromMinutes(5);
    private DateTime _lastSyncTime = DateTime.UtcNow;

    public MovieViewBufferSyncService(
        IServiceProvider serviceProvider,
        IConnectionMultiplexer redis,
        ILogger<MovieViewBufferSyncService> logger)
    {
        _serviceProvider = serviceProvider;
        _redis = redis;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("MovieViewBufferSyncService starting...");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                var db = _redis.GetDatabase();
                var length = await db.ListLengthAsync(QueueKey);

                if (length >= BatchSizeThreshold || DateTime.UtcNow - _lastSyncTime >= _maxSyncInterval)
                {
                    if (length > 0)
                    {
                        await SyncViewsAsync(stoppingToken);
                    }
                    _lastSyncTime = DateTime.UtcNow;
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking or syncing movie views buffer.");
            }

            // Sleep for 10 seconds before next check.
            // This is responsive and keeps Redis overhead negligible.
            await Task.Delay(TimeSpan.FromSeconds(10), stoppingToken);
        }
    }

    private async Task SyncViewsAsync(CancellationToken stoppingToken)
    {
        var db = _redis.GetDatabase();

        if (!await db.KeyExistsAsync(QueueKey))
        {
            return;
        }

        var processingKey = $"cinema:movie_views_processing:{Guid.NewGuid()}";

        try
        {
            // Atomically rename key to separate it from concurrent write requests
            await db.KeyRenameAsync(QueueKey, processingKey);
        }
        catch (RedisServerException ex) when (ex.Message.Contains("no such key"))
        {
            // The key was deleted or processed concurrently in a split second
            return;
        }

        try
        {
            var rawItems = await db.ListRangeAsync(processingKey);
            if (rawItems == null || rawItems.Length == 0)
            {
                await db.KeyDeleteAsync(processingKey);
                return;
            }

            _logger.LogInformation("Processing {Count} buffered movie views from Redis.", rawItems.Length);

            var dtos = new List<RedisMovieViewDto>();
            foreach (var rawItem in rawItems)
            {
                try
                {
                    var dto = JsonSerializer.Deserialize<RedisMovieViewDto>(rawItem.ToString());
                    if (dto != null && dto.MovieId != Guid.Empty)
                    {
                        dtos.Add(dto);
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Failed to deserialize movie view item from Redis: {Raw}", rawItem);
                }
            }

            if (dtos.Count == 0)
            {
                await db.KeyDeleteAsync(processingKey);
                return;
            }

            using var scope = _serviceProvider.CreateScope();
            var dbContext = scope.ServiceProvider.GetRequiredService<CinemaDbContext>();

            // Query only valid movie IDs to avoid foreign key conflicts
            var uniqueMovieIds = dtos.Select(d => d.MovieId).Distinct().ToList();
            var existingMovieIds = await dbContext.MovieInfoEntity
                .Where(m => uniqueMovieIds.Contains(m.MovieId))
                .Select(m => m.MovieId)
                .ToListAsync(stoppingToken);

            var existingMovieIdsSet = new HashSet<Guid>(existingMovieIds);

            var validEntities = new List<MovieViewEntity>();
            foreach (var dto in dtos)
            {
                if (existingMovieIdsSet.Contains(dto.MovieId))
                {
                    validEntities.Add(new MovieViewEntity
                    {
                        MovieViewId = Guid.NewGuid(),
                        MovieId = dto.MovieId,
                        UserId = dto.UserId,
                        ViewedAt = dto.ViewedAt
                    });
                }
                else
                {
                    _logger.LogWarning("Skipping view event for non-existent MovieId: {MovieId}", dto.MovieId);
                }
            }

            if (validEntities.Count > 0)
            {
                await dbContext.MovieViewEntity.AddRangeAsync(validEntities, stoppingToken);
                await dbContext.SaveChangesAsync(stoppingToken);
                _logger.LogInformation("Successfully persisted {Count} movie views to SQL Server.", validEntities.Count);
            }

            // Remove the processing list since database transaction completed successfully
            await db.KeyDeleteAsync(processingKey);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to process and sync movie views from key {ProcessingKey}. Restoring items to main queue.", processingKey);

            try
            {
                var rawItems = await db.ListRangeAsync(processingKey);
                if (rawItems != null && rawItems.Length > 0)
                {
                    foreach (var rawItem in rawItems)
                    {
                        await db.ListLeftPushAsync(QueueKey, rawItem);
                    }
                }
                await db.KeyDeleteAsync(processingKey);
                _logger.LogInformation("Successfully restored {Count} items back to {QueueKey}.", rawItems?.Length ?? 0, QueueKey);
            }
            catch (Exception restoreEx)
            {
                _logger.LogError(restoreEx, "Failed to restore items back to the queue. Key {ProcessingKey} remains in Redis for troubleshooting.", processingKey);
            }
        }
    }
}
