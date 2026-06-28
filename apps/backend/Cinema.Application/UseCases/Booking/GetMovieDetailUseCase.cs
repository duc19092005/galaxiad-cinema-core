using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Cinema.Application.Dtos;
using Cinema.Application.Dtos.Booking;
using Cinema.Application.Interfaces.Booking;
using Cinema.Application.Interfaces.IThirdPersonServices;
using Cinema.Application.Exceptions;
using Cinema.Domain.Localization;

namespace Cinema.Application.UseCases.Booking;

public class GetMovieDetailUseCase
{
    private readonly IBookingCatalogRepository _repository;
    private readonly IMovieCacheService _cacheService;

    public GetMovieDetailUseCase(IBookingCatalogRepository repository, IMovieCacheService cacheService)
    {
        _repository = repository;
        _cacheService = cacheService;
    }

    public async Task<BaseResponse<ResPublicMovieDetailDto>> ExecuteAsync(Guid movieId)
    {
        var cacheKey = $"movie:detail:{movieId}";
        var cached = await _cacheService.GetAsync<BaseResponse<ResPublicMovieDetailDto>>(cacheKey);
        if (cached != null)
        {
            return cached;
        }

        var movie = await _repository.GetMovieDetailAsync(movieId);
        if (movie == null)
        {
            throw new NotFoundException(Messages.Movie.NotFoundById(movieId));
        }

        var dto = new ResPublicMovieDetailDto
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
            MovieRequiredAgeSymbol = movie.MovieRequiredAgeEntity.MovieRequiredAgeSymbol.Trim(),
            MovieGenres = movie.MovieGenreMovieInfoEntity
                .Select(g => g.MovieGenreInfoEntity.MovieGenreName).ToList(),
            MovieFormats = movie.MovieFormatMovieInfoEntity
                .Select(f => f.MovieFormatInfoEntity.MovieFormatName).ToList()
        };

        var response = new BaseResponse<ResPublicMovieDetailDto>
        {
            IsSuccess = true,
            Data = dto,
            Message = Messages.Movie.GetInfoSuccess
        };

        await _cacheService.SetAsync(cacheKey, response, TimeSpan.FromMinutes(30));
        return response;
    }
}
