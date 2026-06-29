using Cinema.Application.Dtos;
using Cinema.Application.Dtos.Booking;
using Cinema.Application.Interfaces.Booking;
using Cinema.Application.Interfaces.IThirdPersonServices;
using Cinema.Application.Interfaces;
using Cinema.Application.Mappers.Booking;
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
        var account = await _repo.GetUserAccountInfoAsync(userId);
        var userEmail = account?.UserEmail ?? string.Empty;
        var cacheKey = $"user:bookings:{userId}:{userEmail}";

        var cached = await _cacheService.GetAsync<BaseResponse<List<ResUserBookingHistoryDto>>>(cacheKey);
        if (cached != null)
        {
            return cached;
        }

        var nowUtc = DateTime.UtcNow;
        var orders = await _repo.GetUserBookingHistoryAsync(userId, userEmail);

        var dtos = orders.Select(o => BookingMapper.ToResUserBookingHistoryDto(o, nowUtc)).ToList();

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
