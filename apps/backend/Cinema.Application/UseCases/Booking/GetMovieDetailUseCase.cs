using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Cinema.Application.Dtos;
using Cinema.Application.Dtos.Booking;
using Cinema.Application.Interfaces.Booking;
using Cinema.Application.Interfaces.IThirdPersonServices;
using Cinema.Application.Mappers.Booking;
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

        var dto = BookingMapper.ToResPublicMovieDetailDto(movie);

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
