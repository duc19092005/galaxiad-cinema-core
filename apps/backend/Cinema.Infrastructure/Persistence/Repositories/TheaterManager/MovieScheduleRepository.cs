using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Cinema.Application.Dtos.TheaterManager.Auditoriums.Responses;
using Cinema.Application.Dtos.TheaterManager.MovieSchedules.Responses;
using Cinema.Application.Interfaces.TheaterManager;
using Cinema.Domain.Entities.CinemaInfos;
using Cinema.Domain.Entities.MovieInfos;
using Cinema.Domain.Entities.UserInfos;
using Cinema.Domain.Enums;

namespace Cinema.Infrastructure.Repositories;

public class MovieScheduleRepository : IMovieScheduleRepository
{
    private readonly CinemaDbContext _dbContext;

    public MovieScheduleRepository(CinemaDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<CinemaInfoEntity?> GetCinemaWithDetailsByManagerAsync(Guid managerId, bool isAdmin)
    {
        var query = _dbContext.Set<CinemaInfoEntity>()
            .Include(x => x.AuditoriumInfoEntities)
            .Include(x => x.TheaterManager)
            .Include(x => x.FacilitiesManager)
            .AsNoTracking();

        if (!isAdmin)
        {
            query = query.Where(x => x.TheaterManagerId == managerId);
        }

        return await query.FirstOrDefaultAsync();
    }

    public async Task<List<TheaterManagerAuditoriumInfos>> GetAuditoriumsByCinemaIdAsync(Guid cinemaId)
    {
        return await _dbContext.Set<AuditoriumInfoEntities>()
            .AsNoTracking()
            .Include(x => x.SeatsInfoEntity)
            .Include(x => x.AuditoriumFormatInfosList)
                .ThenInclude(y => y.MovieFormatInfoEntity)
            .Where(x => x.CinemaId == cinemaId && x.IsActive && !x.IsDeleted)
            .Select(x => new TheaterManagerAuditoriumInfos
            {
                AuditoriumId = x.AuditoriumId,
                AuditoriumNumber = x.AuditoriumNumber,
                TotalSeats = x.SeatsInfoEntity.Count,
                AuditoriumSupportedFormats = x.AuditoriumFormatInfosList.Select(y => y.MovieFormatInfoEntity.MovieFormatName)
            })
            .ToListAsync();
    }

    public async Task<AuditoriumInfoEntities?> GetAuditoriumWithCinemaAsync(Guid auditoriumId)
    {
        return await _dbContext.Set<AuditoriumInfoEntities>()
            .Include(x => x.CinemaInfoEntity)
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.AuditoriumId == auditoriumId);
    }

    public async Task<List<TheaterManagerMovieScheduleResDto>> GetSchedulesByAuditoriumIdAsync(Guid auditoriumId)
    {
        return await _dbContext.Set<MovieScheduleInfoEntity>()
            .AsNoTracking()
            .Include(x => x.MovieInfoEntity)
            .Include(x => x.MovieFormatInfoEntity)
            .Where(x => x.AuditoriumId == auditoriumId)
            .Select(x => new TheaterManagerMovieScheduleResDto
            {
                ScheduleId = x.MovieScheduleInfoId,
                MovieId = x.MovieId,
                MovieName = x.MovieInfoEntity!.MovieName,
                FormatId = x.MovieFormatId,
                FormatName = x.MovieFormatInfoEntity!.MovieFormatName,
                AuditoriumId = x.AuditoriumId,
                StartedDate = x.ActiveAt,
                EndedTime = x.EndedTime,
                IsDeleted = x.IsDeleted
            })
            .OrderBy(x => x.StartedDate)
            .ToListAsync();
    }

    public async Task<bool> AuditoriumExistsAsync(Guid auditoriumId)
    {
        return await _dbContext.Set<AuditoriumInfoEntities>().AnyAsync(x => x.AuditoriumId == auditoriumId);
    }

    public async Task<bool> IsAuditoriumExistForManagerAsync(Guid auditoriumId, Guid managerId, bool isAdmin)
    {
        var query = _dbContext.Set<AuditoriumInfoEntities>()
            .Include(x => x.CinemaInfoEntity);
        if (isAdmin)
        {
            return await query.AnyAsync(x => x.AuditoriumId == auditoriumId);
        }
        return await query.AnyAsync(x => x.AuditoriumId == auditoriumId && x.CinemaInfoEntity.TheaterManagerId == managerId);
    }

    public async Task<bool> IsAuditoriumExistForTheaterOrFacilitiesManagerAsync(Guid auditoriumId, Guid managerId, bool isAdmin)
    {
        var query = _dbContext.Set<AuditoriumInfoEntities>()
            .Include(x => x.CinemaInfoEntity);
        if (isAdmin)
        {
            return await query.AnyAsync(x => x.AuditoriumId == auditoriumId);
        }
        return await query.AnyAsync(x => x.AuditoriumId == auditoriumId && (x.CinemaInfoEntity.TheaterManagerId == managerId || x.CinemaInfoEntity.FacilitiesManagerId == managerId));
    }

    public async Task<Guid> GetCinemaIdByAuditoriumAsync(Guid auditoriumId)
    {
        return await _dbContext.Set<AuditoriumInfoEntities>()
            .Where(x => x.AuditoriumId == auditoriumId)
            .Select(x => x.CinemaId)
            .FirstOrDefaultAsync();
    }

    public async Task<Dictionary<Guid, MovieInfoEntity>> GetMoviesByIdsAsync(IEnumerable<Guid> movieIds)
    {
        return await _dbContext.Set<MovieInfoEntity>()
            .Where(x => movieIds.Contains(x.MovieId))
            .ToDictionaryAsync(x => x.MovieId, x => x);
    }

    public async Task<List<movieFormatMovieInfoEntity>> GetMovieFormatRelationsAsync(IEnumerable<Guid> movieIds)
    {
        return await _dbContext.Set<movieFormatMovieInfoEntity>()
            .Where(x => movieIds.Contains(x.MovieId))
            .ToListAsync();
    }

    public async Task<List<MovieFormatInfoEntity>> GetAllMovieFormatsAsync()
    {
        return await _dbContext.Set<MovieFormatInfoEntity>().ToListAsync();
    }

    public async Task<List<Guid>> GetAuthorizedMovieIdsAsync(IEnumerable<Guid> movieIds, Guid cinemaId)
    {
        return await _dbContext.Set<MovieCinemaEntity>()
            .Where(x => movieIds.Contains(x.MovieId) && x.CinemaId == cinemaId)
            .Select(x => x.MovieId)
            .ToListAsync();
    }

    public async Task<List<MovieScheduleInfoEntity>> GetExistingSchedulesForAuditoriumAsync(Guid auditoriumId, DateTime start, DateTime end)
    {
        return await _dbContext.Set<MovieScheduleInfoEntity>()
            .AsNoTracking()
            .Where(x => x.AuditoriumId == auditoriumId 
                     && x.EndedTime.AddMinutes(15) > start 
                     && x.ActiveAt < end
                     && !x.IsDeleted)
            .ToListAsync();
    }

    public async Task<List<MovieScheduleInfoEntity>> GetExistingSchedulesExcludeIdsAsync(Guid auditoriumId, DateTime start, DateTime end, IEnumerable<Guid> excludeIds)
    {
        return await _dbContext.Set<MovieScheduleInfoEntity>()
            .AsNoTracking()
            .Where(x => x.AuditoriumId == auditoriumId 
                     && x.EndedTime.AddMinutes(15) > start 
                     && x.ActiveAt < end
                     && !x.IsDeleted
                     && !excludeIds.Contains(x.MovieScheduleInfoId))
            .ToListAsync();
    }

    public async Task<List<MovieScheduleInfoEntity>> GetSchedulesByIdsAsync(IEnumerable<Guid> scheduleIds)
    {
        return await _dbContext.Set<MovieScheduleInfoEntity>()
            .Where(x => scheduleIds.Contains(x.MovieScheduleInfoId) && !x.IsDeleted)
            .ToListAsync();
    }

    public async Task<List<MovieScheduleInfoEntity>> GetSchedulesForUpdateAsync(Guid auditoriumId, IEnumerable<Guid> scheduleIds)
    {
        return await _dbContext.Set<MovieScheduleInfoEntity>()
            .Where(x => x.AuditoriumId == auditoriumId && scheduleIds.Contains(x.MovieScheduleInfoId) && !x.IsDeleted)
            .ToListAsync();
    }

    public async Task<List<string>> GetMovieNamesForSchedulesAsync(IEnumerable<Guid> scheduleIds)
    {
        return await _dbContext.Set<MovieScheduleInfoEntity>()
            .Where(x => scheduleIds.Contains(x.MovieScheduleInfoId)) 
            .Select(x => x.MovieInfoEntity!.MovieName)
            .Distinct()
            .ToListAsync();
    }

    public async Task<bool> HasSuccessfulBookingForSchedulesAsync(IEnumerable<Guid> scheduleIds)
    {
        return await _dbContext.Set<OrderDetailsInfo>()
            .AnyAsync(od => scheduleIds.Contains(od.MovieScheduleId) &&
                            od.OrderInfoEntity.OrderStatus == OrderStatusEnum.Booked);
    }

    public async Task<bool> HasSuccessfulBookingForScheduleAsync(Guid scheduleId)
    {
        return await _dbContext.Set<OrderDetailsInfo>()
            .AnyAsync(od => od.MovieScheduleId == scheduleId &&
                            od.OrderInfoEntity.OrderStatus == OrderStatusEnum.Booked);
    }

    public async Task<MovieScheduleInfoEntity?> GetScheduleByIdWithAuditoriumAsync(Guid scheduleId)
    {
        return await _dbContext.Set<MovieScheduleInfoEntity>()
            .Include(x => x.AuditoriumInfoEntities)
            .Include(x => x.MovieInfoEntity)
            .FirstOrDefaultAsync(x => x.MovieScheduleInfoId == scheduleId);
    }

    public async Task<MovieScheduleInfoEntity?> FindScheduleAsync(Guid scheduleId)
    {
        return await _dbContext.Set<MovieScheduleInfoEntity>().FindAsync(scheduleId);
    }

    public void RemoveSchedules(IEnumerable<MovieScheduleInfoEntity> schedules)
    {
        _dbContext.Set<MovieScheduleInfoEntity>().RemoveRange(schedules);
    }

    public void UpdateSchedule(MovieScheduleInfoEntity schedule)
    {
        _dbContext.Set<MovieScheduleInfoEntity>().Update(schedule);
    }

    public async Task AddSchedulesAsync(IEnumerable<MovieScheduleInfoEntity> schedules)
    {
        await _dbContext.Set<MovieScheduleInfoEntity>().AddRangeAsync(schedules);
    }
}
