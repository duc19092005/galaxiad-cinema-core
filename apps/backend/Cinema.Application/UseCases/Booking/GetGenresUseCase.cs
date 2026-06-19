using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Cinema.Application.Dtos;
using Cinema.Application.Dtos.Booking;
using Cinema.Application.Interfaces.Booking;
using Cinema.Domain.Localization;

namespace Cinema.Application.UseCases.Booking;

public class GetGenresUseCase
{
    private readonly IBookingRepository _repository;

    public GetGenresUseCase(IBookingRepository repository)
    {
        _repository = repository;
    }

    public async Task<BaseResponse<List<ResPublicGenreDto>>> ExecuteAsync()
    {
        var genres = await _repository.GetGenresAsync();
        var list = genres.Select(x => new ResPublicGenreDto
        {
            GenreId = x.MovieGenreId,
            GenreName = x.MovieGenreName,
            Description = x.MovieGenreDescription
        }).ToList();

        return new BaseResponse<List<ResPublicGenreDto>>
        {
            IsSuccess = true,
            Data = list,
            Message = Messages.Movie.GetGenresSuccess
        };
    }
}
