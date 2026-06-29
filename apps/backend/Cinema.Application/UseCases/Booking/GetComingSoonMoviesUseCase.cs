using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Cinema.Application.Dtos;
using Cinema.Application.Dtos.Booking;
using Cinema.Application.Interfaces.Booking;
using Cinema.Application.Interfaces.IThirdPersonServices;
using Cinema.Application.Mappers.Booking;
using Cinema.Domain.Localization;

namespace Cinema.Application.UseCases.Booking;

public class GetComingSoonMoviesUseCase
{
    private readonly IBookingCatalogRepository _repository;
    private readonly IMovieCacheService _cacheService;

    public GetComingSoonMoviesUseCase(IBookingCatalogRepository repository, IMovieCacheService cacheService)
    {
        _repository = repository;
        _cacheService = cacheService;
    }

    public async Task<BaseResponse<PagedResult<ResPublicMovieListDto>>> ExecuteAsync(string? keyword = null, int pageIndex = 1, int pageSize = 5)
    {
        var cacheKey = $"movies:upcoming:keyword:{keyword ?? "none"}:page:{pageIndex}:size:{pageSize}";
        var cached = await _cacheService.GetAsync<BaseResponse<PagedResult<ResPublicMovieListDto>>>(cacheKey);
        if (cached != null)
        {
            return cached;
        }

        var totalCount = await _repository.GetComingSoonMoviesCountAsync(keyword);
        var skip = (pageIndex - 1) * pageSize;
        var movies = await _repository.GetComingSoonMoviesPagedAsync(keyword, skip, pageSize);

        var list = movies.Select(BookingMapper.ToResPublicMovieListDto).ToList();

        var response = new BaseResponse<PagedResult<ResPublicMovieListDto>>
        {
            IsSuccess = true,
            Data = new PagedResult<ResPublicMovieListDto>(list, totalCount, pageIndex, pageSize),
            Message = Messages.Movie.GetListSuccess
        };

        await _cacheService.SetAsync(cacheKey, response, TimeSpan.FromMinutes(30));
        return response;
    }
}
