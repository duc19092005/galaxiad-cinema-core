using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Cinema.Application.Dtos;
using Cinema.Application.Dtos.Booking;
using Cinema.Application.Interfaces.Booking;
using Cinema.Domain.Localization;

namespace Cinema.Application.UseCases.Booking;

public class GetCitiesUseCase
{
    private readonly IBookingCatalogRepository _repository;

    public GetCitiesUseCase(IBookingCatalogRepository repository)
    {
        _repository = repository;
    }

    public async Task<BaseResponse<List<ResPublicCityListDto>>> ExecuteAsync()
    {
        var cities = await _repository.GetCitiesAsync();
        // Since the DB query returns string list of cities, count is calculated per city
        // We can query again or do it in-memory. Wait, how was it done originally?
        // Originally it was: GroupBy(x => x.CinemaCity).Select(g => new ResPublicCityListDto { CityName = g.Key, CinemaCount = g.Count() })
        // Keep the repository returning raw city names and map them here for the public DTO shape.
        // No, wait, we can also query the active cinemas and calculate it in-memory which is extremely simple.
        var cinemas = await _repository.GetActiveCinemasAsync();
        var list = cinemas.GroupBy(c => c.CinemaCity)
            .Select(g => new ResPublicCityListDto
            {
                CityName = g.Key,
                CinemaCount = g.Count()
            }).ToList();

        return new BaseResponse<List<ResPublicCityListDto>>
        {
            IsSuccess = true,
            Data = list,
            Message = Messages.Booking.GetCitiesSuccess
        };
    }
}
