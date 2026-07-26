using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Cinema.Application.Dtos;
using Cinema.Application.Dtos.Booking;
using Cinema.Application.Interfaces.Booking;
using Cinema.Application.Exceptions;
using Cinema.Domain.Localization;

namespace Cinema.Application.UseCases.Booking.BookingFlow;

public class GetSeatMapUseCase
{
    private readonly ISeatMapRepository _repository;

    public GetSeatMapUseCase(ISeatMapRepository repository)
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
            ScheduleId = schedule.ScheduleId,
            CinemaId = schedule.CinemaId,
            AuditoriumNumber = schedule.AuditoriumNumber,
            MovieName = schedule.MovieName,
            MovieRequiredAgeSymbol = schedule.MovieRequiredAgeSymbol,
            FormatName = schedule.FormatName,
            StartTime = schedule.StartTime,
            CenterRowStart = schedule.CenterRowStart,
            CenterRowEnd = schedule.CenterRowEnd,
            CenterColStart = schedule.CenterColStart,
            CenterColEnd = schedule.CenterColEnd,
            Seats = schedule.Seats.Select(s => new SeatDto
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
