using Cinema.Application.Interfaces.Admin;
using Cinema.Domain.Entities.CinemaInfos;
using Cinema.Domain.Entities.MovieInfos;
using Microsoft.EntityFrameworkCore;

namespace Cinema.Infrastructure.Repositories;

public class AdminAccessScopeRepository : IAdminAccessScopeRepository
{
    private readonly CinemaDbContext _dbContext;

    public AdminAccessScopeRepository(CinemaDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<List<Guid>> GetManagerCinemaIdsAsync(Guid userId, bool isFacilitiesManager, bool isTheaterManager)
    {
        return await _dbContext.Set<CinemaInfoEntity>()
            .Where(c =>
                (isFacilitiesManager && c.FacilitiesManagerId == userId) ||
                (isTheaterManager && c.TheaterManagerId == userId))
            .Select(c => c.CinemaId)
            .ToListAsync();
    }

    public async Task<List<CinemaInfoEntity>> GetCinemasByManagerOrIdAsync(Guid? managerUserId, Guid? cinemaId, bool isFacilities)
    {
        var query = _dbContext.Set<CinemaInfoEntity>().AsQueryable();
        if (cinemaId.HasValue)
        {
            query = query.Where(c => c.CinemaId == cinemaId.Value);
        }
        else if (managerUserId.HasValue)
        {
            query = isFacilities
                ? query.Where(c => c.FacilitiesManagerId == managerUserId.Value)
                : query.Where(c => c.TheaterManagerId == managerUserId.Value);
        }

        return await query.ToListAsync();
    }

    public async Task<List<MovieInfoEntity>> GetMoviesByManagerOrIdAsync(Guid? managerUserId, Guid? movieId)
    {
        var query = _dbContext.Set<MovieInfoEntity>().AsQueryable();
        if (movieId.HasValue)
        {
            query = query.Where(m => m.MovieId == movieId.Value);
        }
        else if (managerUserId.HasValue)
        {
            query = query.Where(m => m.MovieManagerId == managerUserId.Value);
        }

        return await query.ToListAsync();
    }
}
