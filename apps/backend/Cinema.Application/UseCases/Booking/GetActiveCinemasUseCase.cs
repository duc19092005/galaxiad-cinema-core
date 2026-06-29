using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Cinema.Application.Dtos;
using Cinema.Application.Dtos.Booking;
using Cinema.Application.Interfaces.Booking;
using Cinema.Application.Mappers.Booking;
using Cinema.Domain.Localization;

namespace Cinema.Application.UseCases.Booking;

public class GetActiveCinemasUseCase
{
    private readonly IBookingCatalogRepository _repository;

    public GetActiveCinemasUseCase(IBookingCatalogRepository repository)
    {
        _repository = repository;
    }

    public async Task<BaseResponse<List<ResPublicSimpleCinemaDto>>> ExecuteAsync()
    {
        var cinemas = await _repository.GetActiveCinemasAsync();
        var list = cinemas.Select(BookingMapper.ToResPublicSimpleCinemaDto).ToList();

        return new BaseResponse<List<ResPublicSimpleCinemaDto>>
        {
            IsSuccess = true,
            Data = list,
            Message = Messages.Catalog.GetCinemasSuccess
        };
    }
}

