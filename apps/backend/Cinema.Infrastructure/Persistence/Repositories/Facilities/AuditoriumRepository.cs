using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Cinema.Application.Dtos;
using Cinema.Application.Dtos.FacilitiesManager.Auditoriums.Requests;
using Cinema.Application.Dtos.FacilitiesManager.Auditoriums.Responses;
using Cinema.Domain.Entities.CinemaInfos;
using Cinema.Domain.Entities.MovieInfos;
using Cinema.Domain.Entities.UserInfos;
using Cinema.Application.Interfaces.Facilities;
using Cinema.Domain.Enums;

namespace Cinema.Infrastructure.Repositories;

public class AuditoriumRepository : IAuditoriumRepository
{
    private readonly CinemaDbContext _dbContext;

    public AuditoriumRepository(CinemaDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<List<GetResAuditoriumDto>> GetAllAuditoriumsAsync()
    {
        return await _dbContext.Set<AuditoriumInfoEntities>()
            .Select(x => new GetResAuditoriumDto
            {
                AuditoriumId = x.AuditoriumId,
                AuditoriumNumber = x.AuditoriumNumber,
                CinemaName = x.CinemaInfoEntity.CinemaName,
                TotalSeats = x.SeatsInfoEntity.Count(),
                FormatInfos = x.AuditoriumFormatInfosList.Select(y => new BaseFormatInfo
                {
                    FormatId = y.MovieFormatInfoEntity.MovieFormatId,
                    FormatName = y.MovieFormatInfoEntity.MovieFormatName
                }).ToList(),
                SeatsInfos = x.SeatsInfoEntity.Select(s => new ReqSeatsAuditoriumDto
                {
                    SeatNumber = s.SeatNumber,
                    CoordX = s.CoordX,
                    CoordY = s.CoordY,
                    ColIndex = s.ColIndex,
                    RowIndex = s.RowIndex
                }).ToList()
            })
            .ToListAsync();
    }

    public async Task<GetResAuditoriumDto?> GetAuditoriumByIdAsync(Guid id, Guid userId, bool isAdmin)
    {
        return await _dbContext.Set<AuditoriumInfoEntities>()
            .Where(x => x.AuditoriumId == id && !x.IsDeleted && (isAdmin || x.CreatedByUserId == userId))
            .Select(x => new GetResAuditoriumDto
            {
                AuditoriumId = x.AuditoriumId,
                AuditoriumNumber = x.AuditoriumNumber,
                CinemaName = x.CinemaInfoEntity.CinemaName,
                TotalSeats = x.SeatsInfoEntity.Count(),
                FormatInfos = x.AuditoriumFormatInfosList.Select(y => new BaseFormatInfo
                {
                    FormatId = y.MovieFormatInfoEntity.MovieFormatId,
                    FormatName = y.MovieFormatInfoEntity.MovieFormatName
                }).ToList(),
                SeatsInfos = x.SeatsInfoEntity.Select(s => new ReqSeatsAuditoriumDto
                {
                    SeatNumber = s.SeatNumber,
                    CoordX = s.CoordX,
                    CoordY = s.CoordY,
                    ColIndex = s.ColIndex,
                    RowIndex = s.RowIndex
                }).ToList()
            })
            .FirstOrDefaultAsync();
    }

    public async Task<List<GetResAuditoriumDtoCinema>> GetAuditoriumsByCinemaIdAsync(Guid cinemaId)
    {
        return await _dbContext.Set<AuditoriumInfoEntities>()
            .Where(x => !x.IsDeleted && x.CinemaId == cinemaId)
            .Select(x => new GetResAuditoriumDtoCinema
            {
                AuditoriumId = x.AuditoriumId,
                AuditoriumNumber = x.AuditoriumNumber,
                CinemaName = x.CinemaInfoEntity.CinemaName,
                TotalSeats = x.SeatsInfoEntity.Count(),
                FormatInfos = x.AuditoriumFormatInfosList.Select(y => new BaseFormatInfo
                {
                    FormatId = y.MovieFormatInfoEntity.MovieFormatId,
                    FormatName = y.MovieFormatInfoEntity.MovieFormatName
                }).ToList()
            })
            .ToListAsync();
    }

    public async Task<bool> IsDuplicateAuditoriumNumberAsync(Guid? auditoriumId, string auditoriumNumber, Guid cinemaId)
    {
        var query = _dbContext.Set<AuditoriumInfoEntities>()
            .Where(x => x.AuditoriumNumber.ToLower() == auditoriumNumber.ToLower() && x.CinemaId == cinemaId && !x.IsDeleted);

        if (auditoriumId.HasValue)
        {
            query = query.Where(x => x.AuditoriumId != auditoriumId.Value);
        }

        return await query.AnyAsync();
    }

    public async Task<AuditoriumInfoEntities?> GetAuditoriumEntityByIdAsync(Guid id)
    {
        return await _dbContext.Set<AuditoriumInfoEntities>()
            .FirstOrDefaultAsync(x => x.AuditoriumId == id);
    }

    public async Task AddAuditoriumAsync(AuditoriumInfoEntities auditorium)
    {
        await _dbContext.Set<AuditoriumInfoEntities>().AddAsync(auditorium);
    }

    public async Task AddAuditoriumFormatsAsync(IEnumerable<AuditoriumFormatInfos> formats)
    {
        await _dbContext.Set<AuditoriumFormatInfos>().AddRangeAsync(formats);
    }

    public async Task AddSeatsAsync(IEnumerable<SeatsInfoEntity> seats)
    {
        await _dbContext.Set<SeatsInfoEntity>().AddRangeAsync(seats);
    }

    public async Task DeleteAuditoriumFormatsAsync(IEnumerable<AuditoriumFormatInfos> formats)
    {
        _dbContext.Set<AuditoriumFormatInfos>().RemoveRange(formats);
        await Task.CompletedTask;
    }

    public async Task<List<AuditoriumFormatInfos>> GetFormatsByAuditoriumIdAsync(Guid auditoriumId)
    {
        return await _dbContext.Set<AuditoriumFormatInfos>()
            .Where(x => x.AuditoriumId == auditoriumId)
            .ToListAsync();
    }

    public async Task<List<SeatsInfoEntity>> GetSeatsByAuditoriumIdAsync(Guid auditoriumId)
    {
        return await _dbContext.Set<SeatsInfoEntity>()
            .Where(x => x.AuditoriumId == auditoriumId)
            .ToListAsync();
    }

    public async Task DeleteSeatsAsync(IEnumerable<SeatsInfoEntity> seats)
    {
        _dbContext.Set<SeatsInfoEntity>().RemoveRange(seats);
        await Task.CompletedTask;
    }

    public async Task<bool> HasBookedBookingForAuditoriumAsync(Guid auditoriumId)
    {
        return await _dbContext.Set<OrderDetailsInfo>()
            .AnyAsync(od => od.MovieScheduleInfoEntity.AuditoriumId == auditoriumId
                            && od.OrderInfoEntity.OrderStatus == OrderStatusEnum.Booked);
    }

    public async Task<bool> HasAnyBookingForAuditoriumSeatsAsync(Guid auditoriumId)
    {
        return await _dbContext.Set<OrderDetailsInfo>()
            .AnyAsync(od => od.SeatsInfoEntity.AuditoriumId == auditoriumId);
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
}
