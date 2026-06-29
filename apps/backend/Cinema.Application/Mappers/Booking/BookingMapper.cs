using System;
using System.Collections.Generic;
using System.Linq;
using Cinema.Application.Dtos.Booking;
using Cinema.Application.Dtos.Public.Responses;
using Cinema.Domain.Entities.CinemaInfos;
using Cinema.Domain.Entities.MovieInfos;
using Cinema.Domain.Entities.UserInfos;

namespace Cinema.Application.Mappers.Booking;

public static class BookingMapper
{
    public static ResPublicMovieListDto ToResPublicMovieListDto(MovieInfoEntity x)
    {
        return new ResPublicMovieListDto
        {
            MovieId = x.MovieId,
            MovieName = x.MovieName,
            MovieImageUrl = x.MovieImageUrl,
            MovieDescription = x.MovieDescription,
            MovieDuration = x.MovieDuration,
            StartedDate = x.ActiveAt,
            EndedDate = x.EndedDate,
            MovieRequiredAgeSymbol = x.MovieRequiredAgeEntity?.MovieRequiredAgeSymbol?.Trim() ?? "P",
            MovieGenres = x.MovieGenreMovieInfoEntity
                .Select(g => g.MovieGenreInfoEntity.MovieGenreName).ToList(),
            MovieFormats = x.MovieFormatMovieInfoEntity
                .Select(f => f.MovieFormatInfoEntity.MovieFormatName).ToList()
        };
    }

    public static ResPublicMovieDetailDto ToResPublicMovieDetailDto(MovieInfoEntity movie)
    {
        return new ResPublicMovieDetailDto
        {
            MovieId = movie.MovieId,
            MovieName = movie.MovieName,
            MovieImageUrl = movie.MovieImageUrl,
            MovieDescription = movie.MovieDescription,
            TrailerUrl = movie.TrailerUrl,
            Director = movie.Director,
            Actors = movie.Actors,
            MovieDuration = movie.MovieDuration,
            StartedDate = movie.ActiveAt,
            EndedDate = movie.EndedDate,
            MovieRequiredAgeSymbol = movie.MovieRequiredAgeEntity?.MovieRequiredAgeSymbol?.Trim() ?? "P",
            MovieGenres = movie.MovieGenreMovieInfoEntity
                .Select(g => g.MovieGenreInfoEntity.MovieGenreName).ToList(),
            MovieFormats = movie.MovieFormatMovieInfoEntity
                .Select(f => f.MovieFormatInfoEntity.MovieFormatName).ToList()
        };
    }

    public static ResPublicSimpleMovieDto ToResPublicSimpleMovieDto(MovieInfoEntity m)
    {
        return new ResPublicSimpleMovieDto
        {
            MovieId = m.MovieId,
            MovieName = m.MovieName
        };
    }

    public static ResPublicSimpleCinemaDto ToResPublicSimpleCinemaDto(CinemaInfoEntity c)
    {
        return new ResPublicSimpleCinemaDto
        {
            CinemaId = c.CinemaId,
            CinemaName = c.CinemaName,
            CinemaCity = c.CinemaCity
        };
    }

    public static ResPublicGenreDto ToResPublicGenreDto(MovieGenreInfoEntity x)
    {
        return new ResPublicGenreDto
        {
            GenreId = x.MovieGenreId,
            GenreName = x.MovieGenreName,
            Description = x.MovieGenreDescription
        };
    }

    public static ResPublicNearestCinemaDto ToResPublicNearestCinemaDto(CinemaInfoEntity cinema, double distance)
    {
        return new ResPublicNearestCinemaDto
        {
            CinemaId = cinema.CinemaId,
            CinemaName = cinema.CinemaName,
            CinemaLocation = cinema.CinemaLocation,
            Latitude = cinema.Latitude,
            Longitude = cinema.Longitude,
            DistanceInKm = Math.Round(distance, 2)
        };
    }

    public static ResUserBookingHistoryDto ToResUserBookingHistoryDto(OrderInfoEntity o, DateTime nowUtc)
    {
        return new ResUserBookingHistoryDto
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
        };
    }
}
