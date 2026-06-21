using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Cinema.Application.Dtos;
using Cinema.Application.Dtos.Booking;
using Cinema.Application.Interfaces.Booking;

using Cinema.Domain.Localization;

namespace Cinema.Application.UseCases.Booking;

public class GetNearestCinemasUseCase
{
    private readonly IBookingCatalogRepository _repository;

    public GetNearestCinemasUseCase(IBookingCatalogRepository repository)
    {
        _repository = repository;
    }

    public async Task<BaseResponse<List<ResPublicNearestCinemaDto>>> ExecuteAsync(double userLat, double userLon)
    {
        var cinemas = await _repository.GetNearestCinemasAsync();

        var list = cinemas.Select(c =>
        {
            var distance = (c.Latitude.HasValue && c.Longitude.HasValue)
                ? CalculateDistanceInKm(userLat, userLon, c.Latitude.Value, c.Longitude.Value)
                : 9999.0;

            return new ResPublicNearestCinemaDto
            {
                CinemaId = c.CinemaId,
                CinemaName = c.CinemaName,
                CinemaLocation = c.CinemaLocation,
                Latitude = c.Latitude,
                Longitude = c.Longitude,
                DistanceInKm = Math.Round(distance, 2)
            };
        })
        .OrderBy(c => c.DistanceInKm)
        .ToList();

        return new BaseResponse<List<ResPublicNearestCinemaDto>>
        {
            IsSuccess = true,
            Data = list,
            Message = Messages.Catalog.GetNearestCinemasSuccess
        };
    }

    private static double CalculateDistanceInKm(double lat1, double lon1, double lat2, double lon2)
    {
        var dLat = ToRadians(lat2 - lat1);
        var dLon = ToRadians(lon2 - lon1);

        var a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2) +
                Math.Cos(ToRadians(lat1)) * Math.Cos(ToRadians(lat2)) *
                Math.Sin(dLon / 2) * Math.Sin(dLon / 2);

        var c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));
        return 6371 * c; // Earth's radius in km
    }

    private static double ToRadians(double angle)
    {
        return Math.PI * angle / 180.0;
    }
}

