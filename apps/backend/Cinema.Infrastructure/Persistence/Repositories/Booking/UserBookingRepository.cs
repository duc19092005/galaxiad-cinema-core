using Cinema.Application.Interfaces.Booking;
using Cinema.Application.Dtos.Booking;
using Cinema.Domain.Entities.UserInfos;
using Microsoft.EntityFrameworkCore;

namespace Cinema.Infrastructure.Persistence.Repositories.Booking;

public class UserBookingRepository : IUserBookingRepository
{
    private readonly CinemaDbContext _dbContext;

    public UserBookingRepository(CinemaDbContext dbContext)
    {
        _dbContext = dbContext;
    }



    public async Task<List<ResUserBookingHistoryDto>> GetUserBookingHistoryDtosAsync(Guid userId, string userEmail, DateTime nowUtc)
    {
        var normalizedEmail = userEmail.Trim();

        return await _dbContext.Set<OrderInfoEntity>()
            .Where(o => o.UserId == userId
                        || (!string.IsNullOrEmpty(normalizedEmail) && o.CustomerEmail == normalizedEmail))
            .OrderByDescending(o => o.OrderDate)
            .AsNoTracking()
            .Select(o => new ResUserBookingHistoryDto
            {
                OrderId = o.OrderId,
                MovieId = o.OrderDetailsInfo.Select(od => od.MovieScheduleInfoEntity.MovieId).FirstOrDefault(),
                OrderDate = o.OrderDate,
                TotalPrice = o.TotalPrice,
                OrderStatus = o.OrderStatus.ToString(),
                MovieName = o.OrderDetailsInfo
                    .Select(od => od.MovieScheduleInfoEntity.MovieInfoEntity!.MovieName)
                    .FirstOrDefault() ?? string.Empty,
                MovieImageUrl = o.OrderDetailsInfo
                    .Select(od => od.MovieScheduleInfoEntity.MovieInfoEntity!.MovieImageUrl)
                    .FirstOrDefault() ?? string.Empty,
                CinemaName = o.OrderDetailsInfo
                    .Select(od => od.MovieScheduleInfoEntity.AuditoriumInfoEntities!.CinemaInfoEntity.CinemaName)
                    .FirstOrDefault() ?? string.Empty,
                AuditoriumNumber = o.OrderDetailsInfo
                    .Select(od => od.MovieScheduleInfoEntity.AuditoriumInfoEntities!.AuditoriumNumber)
                    .FirstOrDefault() ?? string.Empty,
                StartTime = o.OrderDetailsInfo
                    .Select(od => od.MovieScheduleInfoEntity.StartTime)
                    .FirstOrDefault(),
                Seats = o.OrderDetailsInfo
                    .Select(od => od.SeatsInfoEntity.SeatNumber)
                    .ToList(),
                IsMovieAired = o.OrderDetailsInfo.Any(od => od.MovieScheduleInfoEntity.StartTime <= nowUtc),
                MovieAiringStatus = o.OrderDetailsInfo
                    .Select(od =>
                        nowUtc < od.MovieScheduleInfoEntity.StartTime ? "Upcoming" :
                        (nowUtc >= od.MovieScheduleInfoEntity.StartTime && nowUtc <= od.MovieScheduleInfoEntity.EndedTime) ? "Airing" : "Finished")
                    .FirstOrDefault() ?? string.Empty
            })
            .ToListAsync();
    }

    public async Task<UserInfoEntity?> GetUserAccountInfoAsync(Guid userId)
    {
        return await _dbContext.Set<UserInfoEntity>()
            .Include(u => u.CustomerProfileEntity!)
            .FirstOrDefaultAsync(u => u.UserId == userId);
    }

    public async Task<ResChatbotBookingStatusDto?> GetOrderByBookingCodeAsync(string bookingCode)
    {
        return await _dbContext.Set<OrderInfoEntity>()
            .AsNoTracking()
            .Where(o => o.BookingCode == bookingCode)
            .Select(o => new ResChatbotBookingStatusDto
            {
                UserId = o.UserId,
                BookingCode = o.BookingCode,
                OrderStatus = o.OrderStatus.ToString(),
                OrderDate = o.OrderDate,
                TotalPrice = o.TotalPrice,
                FinalAmount = o.FinalAmount,
                MovieName = o.OrderDetailsInfo.Select(d => d.MovieScheduleInfoEntity.MovieInfoEntity!.MovieName).FirstOrDefault() ?? "",
                CinemaName = o.OrderDetailsInfo.Select(d => d.MovieScheduleInfoEntity.AuditoriumInfoEntities!.CinemaInfoEntity.CinemaName).FirstOrDefault() ?? "",
                StartTime = o.OrderDetailsInfo.Select(d => d.MovieScheduleInfoEntity.StartTime).FirstOrDefault(),
                Seats = o.OrderDetailsInfo.Select(d => d.SeatsInfoEntity.SeatNumber).ToList()
            })
            .FirstOrDefaultAsync();
    }
}
