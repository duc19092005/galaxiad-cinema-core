using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Cinema.Application.Dtos;
using Cinema.Application.Dtos.Booking;
using Cinema.Application.Interfaces.Booking;
using Cinema.Domain.Exceptions;
using Cinema.Domain.Localization;

namespace Cinema.Application.UseCases.Booking;

public class GetSeatMapUseCase
{
    private readonly IBookingRepository _repository;

    public GetSeatMapUseCase(IBookingRepository repository)
    {
        _repository = repository;
    }

    public async Task<BaseResponse<ResPublicSeatMapDto>> ExecuteAsync(Guid scheduleId)
    {
        var schedule = await _repository.GetScheduleForSeatMapAsync(scheduleId);
        if (schedule == null)
        {
            throw new NotFoundException(Messages.Booking.ScheduleNotFound);
        }

        var occupiedSeatIds = await _repository.GetOccupiedSeatIdsAsync(scheduleId);
        var occupiedSet = new HashSet<Guid>(occupiedSeatIds);

        var seatMap = new ResPublicSeatMapDto
        {
            ScheduleId = schedule.MovieScheduleInfoId,
            AuditoriumNumber = schedule.AuditoriumInfoEntities?.AuditoriumNumber ?? string.Empty,
            MovieName = schedule.MovieInfoEntity?.MovieName ?? string.Empty,
            FormatName = schedule.MovieFormatInfoEntity?.MovieFormatName ?? string.Empty,
            StartTime = schedule.StartTime,
            Seats = schedule.AuditoriumInfoEntities!.SeatsInfoEntity.Select(s => new SeatDto
            {
                SeatId = s.SeatId,
                SeatNumber = s.SeatNumber,
                ColIndex = s.ColIndex,
                RowIndex = s.RowIndex,
                IsOccupied = occupiedSet.Contains(s.SeatId)
            }).OrderBy(s => s.RowIndex).ThenBy(s => s.ColIndex).ToList()
        };

        return new BaseResponse<ResPublicSeatMapDto>
        {
            IsSuccess = true,
            Data = seatMap,
            Message = Messages.Booking.GetSeatMapSuccess
        };
    }
}
