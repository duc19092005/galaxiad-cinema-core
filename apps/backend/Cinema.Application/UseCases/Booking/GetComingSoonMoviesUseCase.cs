using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Cinema.Application.Dtos;
using Cinema.Application.Dtos.Booking;
using Cinema.Application.Interfaces.Booking;
using Cinema.Domain.Localization;

namespace Cinema.Application.UseCases.Booking;

public class GetComingSoonMoviesUseCase
{
    private readonly IBookingCatalogRepository _repository;

    public GetComingSoonMoviesUseCase(IBookingCatalogRepository repository)
    {
        _repository = repository;
    }

    public async Task<BaseResponse<PagedResult<ResPublicMovieListDto>>> ExecuteAsync(string? keyword = null, int pageIndex = 1, int pageSize = 5)
    {
        var totalCount = await _repository.GetComingSoonMoviesCountAsync(keyword);
        var skip = (pageIndex - 1) * pageSize;
        var movies = await _repository.GetComingSoonMoviesPagedAsync(keyword, skip, pageSize);

        var list = movies.Select(x => new ResPublicMovieListDto
        {
            MovieId = x.MovieId,
            MovieName = x.MovieName,
            MovieImageUrl = x.MovieImageUrl,
            MovieDescription = x.MovieDescription,
            MovieDuration = x.MovieDuration,
            StartedDate = x.ActiveAt,
            EndedDate = x.EndedDate,
            MovieRequiredAgeSymbol = x.MovieRequiredAgeEntity.MovieRequiredAgeSymbol.Trim(),
            MovieGenres = x.MovieGenreMovieInfoEntity
                .Select(g => g.MovieGenreInfoEntity.MovieGenreName).ToList(),
            MovieFormats = x.MovieFormatMovieInfoEntity
                .Select(f => f.MovieFormatInfoEntity.MovieFormatName).ToList()
        }).ToList();

        return new BaseResponse<PagedResult<ResPublicMovieListDto>>
        {
            IsSuccess = true,
            Data = new PagedResult<ResPublicMovieListDto>(list, totalCount, pageIndex, pageSize),
            Message = Messages.Movie.GetListSuccess
        };
    }
}
