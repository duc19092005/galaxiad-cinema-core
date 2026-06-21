using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Cinema.Application.Dtos.FacilitiesManager.Cinemas.Responses;
using Cinema.Domain.Entities.CinemaInfos;
using Cinema.Domain.Entities.MovieInfos;
using Cinema.Domain.Entities.UserInfos;
using Cinema.Application.Interfaces.Facilities;
using Cinema.Domain.Enums;

namespace Cinema.Infrastructure.Repositories;

public class CinemaRepository : ICinemaRepository
{
    private readonly CinemaDbContext _dbContext;

    public CinemaRepository(CinemaDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<List<ResFacilitiesManagerCinema>> GetAllCinemasAsync(Guid userId, bool isAdmin, bool isFacilitiesManager, bool isTheaterManager)
    {
        var query = _dbContext.Set<CinemaInfoEntity>().AsQueryable();

        if (!isAdmin)
        {
            query = query.Where(x => 
                (isFacilitiesManager && x.FacilitiesManagerId == userId) ||
                (isTheaterManager && x.TheaterManagerId == userId)
            );
        }

        return await query.Select(x => new ResFacilitiesManagerCinema
        {
            CinemaId = x.CinemaId,
            CinemaLocation = x.CinemaLocation,
            CinemaDescription = x.CinemaDescription,
            CinemaName = x.CinemaName,
            CinemaHotlineNumber = x.CinemaHotLineNumber,
            Latitude = x.Latitude,
            Longitude = x.Longitude,
            TotalRooms = x.AuditoriumInfoEntities.Count(a => !a.IsDeleted),
            TheaterManagerName = x.TheaterManager != null ? x.TheaterManager.UserName ?? "Chưa có" : "Chưa có",
            FacilitiesManagerName = x.FacilitiesManager != null ? x.FacilitiesManager.UserName ?? "Chưa có" : "Chưa có"
        }).ToListAsync();
    }

    public async Task<ResFacilitiesManagerCinema?> GetCinemaByIdAsync(Guid id, Guid userId, bool isAdmin, bool isFacilitiesManager, bool isTheaterManager)
    {
        var query = _dbContext.Set<CinemaInfoEntity>().Where(x => x.CinemaId == id);

        if (!isAdmin)
        {
            query = query.Where(x => 
                (isFacilitiesManager && x.FacilitiesManagerId == userId) ||
                (isTheaterManager && x.TheaterManagerId == userId)
            );
        }

        return await query.Select(x => new ResFacilitiesManagerCinema
        {
            CinemaId = x.CinemaId,
            CinemaName = x.CinemaName,
            CinemaDescription = x.CinemaDescription,
            CinemaLocation = x.CinemaLocation,
            CinemaHotlineNumber = x.CinemaHotLineNumber,
            Latitude = x.Latitude,
            Longitude = x.Longitude,
            TotalRooms = x.AuditoriumInfoEntities.Count(a => !a.IsDeleted),
            TheaterManagerName = x.TheaterManager != null ? x.TheaterManager.UserName ?? "Chưa có" : "Chưa có",
            FacilitiesManagerName = x.FacilitiesManager != null ? x.FacilitiesManager.UserName ?? "Chưa có" : "Chưa có"
        }).FirstOrDefaultAsync();
    }

    public async Task<CinemaInfoEntity?> GetCinemaEntityByIdAsync(Guid id, Guid userId, bool isAdmin)
    {
        var query = _dbContext.Set<CinemaInfoEntity>().Where(x => x.CinemaId == id);
        if (!isAdmin)
        {
            query = query.Where(x => x.FacilitiesManagerId == userId || x.TheaterManagerId == userId);
        }
        return await query.FirstOrDefaultAsync();
    }

    public async Task<bool> IsDuplicateCinemaNameAsync(Guid? cinemaId, string name)
    {
        var query = _dbContext.Set<CinemaInfoEntity>().Where(x => x.CinemaName.ToLower() == name.ToLower() && !x.IsDeleted);
        if (cinemaId.HasValue)
        {
            query = query.Where(x => x.CinemaId != cinemaId.Value);
        }
        return await query.AnyAsync();
    }

    public async Task<bool> IsDuplicateCinemaDescriptionAsync(Guid? cinemaId, string description)
    {
        var query = _dbContext.Set<CinemaInfoEntity>().Where(x => x.CinemaDescription.ToLower() == description.ToLower() && !x.IsDeleted);
        if (cinemaId.HasValue)
        {
            query = query.Where(x => x.CinemaId != cinemaId.Value);
        }
        return await query.AnyAsync();
    }

    public async Task<bool> IsDuplicateCinemaLocationAsync(Guid? cinemaId, string location)
    {
        var query = _dbContext.Set<CinemaInfoEntity>().Where(x => x.CinemaLocation.ToLower() == location.ToLower() && !x.IsDeleted);
        if (cinemaId.HasValue)
        {
            query = query.Where(x => x.CinemaId != cinemaId.Value);
        }
        return await query.AnyAsync();
    }

    public async Task<bool> IsDuplicateCinemaHotlineAsync(Guid? cinemaId, string hotline)
    {
        var query = _dbContext.Set<CinemaInfoEntity>().Where(x => x.CinemaHotLineNumber.ToLower() == hotline.ToLower() && !x.IsDeleted);
        if (cinemaId.HasValue)
        {
            query = query.Where(x => x.CinemaId != cinemaId.Value);
        }
        return await query.AnyAsync();
    }

    public async Task<bool> HasBookedBookingForCinemaAsync(Guid cinemaId)
    {
        return await _dbContext.Set<OrderDetailsInfo>()
            .AnyAsync(od => od.MovieScheduleInfoEntity.AuditoriumInfoEntities != null
                            && od.MovieScheduleInfoEntity.AuditoriumInfoEntities.CinemaId == cinemaId
                            && od.OrderInfoEntity.OrderStatus == OrderStatusEnum.Booked
                            && !od.MovieScheduleInfoEntity.IsDeleted);
    }

    public async Task<List<AuditoriumInfoEntities>> GetActiveAuditoriumsByCinemaIdAsync(Guid cinemaId)
    {
        return await _dbContext.Set<AuditoriumInfoEntities>()
            .Where(a => a.CinemaId == cinemaId && !a.IsDeleted)
            .ToListAsync();
    }

    public async Task<List<MovieScheduleInfoEntity>> GetActiveSchedulesByAuditoriumIdAsync(Guid auditoriumId)
    {
        return await _dbContext.Set<MovieScheduleInfoEntity>()
            .Where(s => s.AuditoriumId == auditoriumId && !s.IsDeleted)
            .ToListAsync();
    }

    public async Task CancelPendingOrdersForScheduleAsync(Guid scheduleId)
    {
        var pendingOrders = await _dbContext.Set<OrderInfoEntity>()
            .Where(o => o.OrderDetailsInfo.Any(od => od.MovieScheduleId == scheduleId)
                        && o.OrderStatus == OrderStatusEnum.Pending)
            .ToListAsync();

        foreach (var order in pendingOrders)
        {
            order.OrderStatus = OrderStatusEnum.Canceled;
        }
    }

    public async Task AddCinemaAsync(CinemaInfoEntity cinema)
    {
        await _dbContext.Set<CinemaInfoEntity>().AddAsync(cinema);
    }
}
