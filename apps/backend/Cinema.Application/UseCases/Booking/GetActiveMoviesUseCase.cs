using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Cinema.Application.Dtos;
using Cinema.Application.Dtos.Booking;
using Cinema.Application.Interfaces.Booking;

using Cinema.Domain.Localization;

namespace Cinema.Application.UseCases.Booking;

public class GetActiveMoviesUseCase
{
    private readonly IBookingCatalogRepository _repository;

    public GetActiveMoviesUseCase(IBookingCatalogRepository repository)
    {
        _repository = repository;
    }

    public async Task<BaseResponse<List<ResPublicSimpleMovieDto>>> ExecuteAsync()
    {
        var now = DateTime.UtcNow;
        var movies = await _repository.GetActiveMoviesAsync(now);
        var list = movies.Select(m => new ResPublicSimpleMovieDto
        {
            MovieId = m.MovieId,
            MovieName = m.MovieName
        }).ToList();

        return new BaseResponse<List<ResPublicSimpleMovieDto>>
        {
            IsSuccess = true,
            Data = list,
            Message = Messages.Catalog.GetMoviesSuccess
        };
    }
}

