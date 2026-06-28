using Cinema.Application.Dtos;
using Cinema.Application.Dtos.Booking;
using Cinema.Application.Interfaces.Booking;
using Cinema.Application.Interfaces.IThirdPersonServices;
using Cinema.Application.Interfaces;
using Cinema.Domain.Localization;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Cinema.Application.UseCases.Booking;

public class GetUserBookingHistoryUseCase
{
    private readonly IUserBookingRepository _repo;
    private readonly IUserContextService _userContextService;
    private readonly IMovieCacheService _cacheService;

    public GetUserBookingHistoryUseCase(
        IUserBookingRepository repo,
        IUserContextService userContextService,
        IMovieCacheService cacheService)
    {
        _repo = repo;
        _userContextService = userContextService;
        _cacheService = cacheService;
    }

    public async Task<BaseResponse<List<ResUserBookingHistoryDto>>> ExecuteAsync()
    {
        var userId = _userContextService.GetUserId();
        var cacheKey = $"user:bookings:{userId}";

        var cached = await _cacheService.GetAsync<BaseResponse<List<ResUserBookingHistoryDto>>>(cacheKey);
        if (cached != null)
        {
            return cached;
        }

        var nowUtc = DateTime.UtcNow;
        var orders = await _repo.GetUserBookingHistoryAsync(userId);

        var dtos = orders.Select(o => new ResUserBookingHistoryDto
        {
            OrderId = o.OrderId,
            OrderDate = o.OrderDate,
            TotalPrice = o.TotalPrice,
            OrderStatus = o.OrderStatus.ToString(),
            MovieName = o.OrderDetailsInfo.Select(od => od.MovieScheduleInfoEntity.MovieInfoEntity!.MovieName).FirstOrDefault() ?? "",
            MovieImageUrl = o.OrderDetailsInfo.Select(od => od.MovieScheduleInfoEntity.MovieInfoEntity!.MovieImageUrl).FirstOrDefault() ?? "",
            CinemaName = o.OrderDetailsInfo.Select(od => od.MovieScheduleInfoEntity.AuditoriumInfoEntities!.CinemaInfoEntity.CinemaName).FirstOrDefault() ?? "",
            AuditoriumNumber = o.OrderDetailsInfo.Select(od => od.MovieScheduleInfoEntity.AuditoriumInfoEntities!.AuditoriumNumber).FirstOrDefault() ?? "",
            StartTime = o.OrderDetailsInfo.Select(od => od.MovieScheduleInfoEntity.StartTime).FirstOrDefault(),
            Seats = o.OrderDetailsInfo.Select(od => od.SeatsInfoEntity.SeatNumber).ToList(),
            IsMovieAired = o.OrderDetailsInfo.Any(od => od.MovieScheduleInfoEntity.StartTime <= nowUtc),
            MovieAiringStatus = o.OrderDetailsInfo.Select(od =>
                nowUtc < od.MovieScheduleInfoEntity.StartTime ? "Upcoming" :
                (nowUtc >= od.MovieScheduleInfoEntity.StartTime && nowUtc <= od.MovieScheduleInfoEntity.EndedTime) ? "Airing" : "Finished"
            ).FirstOrDefault() ?? ""
        }).ToList();

        var response = new BaseResponse<List<ResUserBookingHistoryDto>>
        {
            IsSuccess = true,
            Data = dtos,
            Message = Messages.Booking.GetHistorySuccess
        };

        await _cacheService.SetAsync(cacheKey, response, TimeSpan.FromMinutes(30));
        return response;
    }
}
