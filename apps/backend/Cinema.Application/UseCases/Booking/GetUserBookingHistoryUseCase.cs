using Cinema.Application.Dtos;
using Cinema.Application.Dtos.Booking;
using Cinema.Application.Interfaces.Booking;
using Cinema.Application.Interfaces;
using Cinema.Domain.Localization;

namespace Cinema.Application.UseCases.Booking;

public class GetUserBookingHistoryUseCase
{
    private readonly IUserBookingRepository _repo;
    private readonly IUserContextService _userContextService;

    public GetUserBookingHistoryUseCase(
        IUserBookingRepository repo,
        IUserContextService userContextService)
    {
        _repo = repo;
        _userContextService = userContextService;
    }

    public async Task<BaseResponse<List<ResUserBookingHistoryDto>>> ExecuteAsync()
    {
        var userId = _userContextService.GetUserId();
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

        return new BaseResponse<List<ResUserBookingHistoryDto>>
        {
            IsSuccess = true,
            Data = dtos,
            Message = Messages.Booking.GetHistorySuccess
        };
    }
}
