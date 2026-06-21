using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Cinema.Application.Dtos;
using Cinema.Application.Dtos.Booking;
using Cinema.Application.Interfaces.Booking;

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
        var list = cinemas.Select(c => new ResPublicSimpleCinemaDto
        {
            CinemaId = c.CinemaId,
            CinemaName = c.CinemaName,
            CinemaCity = c.CinemaCity
        }).ToList();

        return new BaseResponse<List<ResPublicSimpleCinemaDto>>
        {
            IsSuccess = true,
            Data = list,
            Message = "Lấy danh sách rạp thành công"
        };
    }
}
