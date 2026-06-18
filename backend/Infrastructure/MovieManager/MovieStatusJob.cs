using DataAccess;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Infrastructure.MovieManager;

/// <summary>
/// Handler được Hangfire gọi để bật/tắt trạng thái phim theo lịch.
/// Tách khỏi use case ghi để giữ Application thuần.
/// </summary>
public class MovieStatusJob
{
    private readonly CinemaDbContext _dbContext;
    private readonly ILogger<MovieStatusJob> _logger;

    public MovieStatusJob(CinemaDbContext dbContext, ILogger<MovieStatusJob> logger)
    {
        _dbContext = dbContext;
        _logger = logger;
    }

    /// <summary>Phim bắt đầu chiếu: bỏ "sắp chiếu", bật active.</summary>
    public async Task SetActive(Guid movieId)
    {
        var movie = await _dbContext.MovieInfoEntity.FirstOrDefaultAsync(x => x.MovieId == movieId);
        if (movie == null)
        {
            _logger.LogError("Can't find movie {MovieId} to activate", movieId);
            return;
        }
        movie.IsCommingSoon = false;
        movie.IsActive = true;
        await _dbContext.SaveChangesAsync();
    }

    /// <summary>Phim hết hạn chiếu: tắt active.</summary>
    public async Task SetInactive(Guid movieId)
    {
        var movie = await _dbContext.MovieInfoEntity.FirstOrDefaultAsync(x => x.MovieId == movieId);
        if (movie == null)
        {
            _logger.LogError("Can't find movie {MovieId} to deactivate", movieId);
            return;
        }
        movie.IsCommingSoon = false;
        movie.IsActive = false;
        await _dbContext.SaveChangesAsync();
    }
}
