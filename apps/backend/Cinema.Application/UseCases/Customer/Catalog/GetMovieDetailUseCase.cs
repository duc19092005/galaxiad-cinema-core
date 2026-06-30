using System;
using System.Threading.Tasks;
using Cinema.Application.Dtos;
using Cinema.Application.Dtos.Public.Responses;
using Cinema.Application.Interfaces.Catalog;
using Cinema.Domain.Localization;

namespace Cinema.Application.UseCases.Customer.Catalog;

public class GetMovieDetailUseCase
{
    private readonly IPublicCatalogRepository _repository;

    public GetMovieDetailUseCase(IPublicCatalogRepository repository)
    {
        _repository = repository;
    }

    public async Task<BaseResponse<MovieDetailInfoRes>> ExecuteAsync(Guid movieId)
    {
        var detail = await _repository.GetMovieDetailAsync(movieId);
        return new BaseResponse<MovieDetailInfoRes>
        {
            Data = detail!,
            IsSuccess = true,
            Message = Messages.Catalog.GetMovieDetailSuccess
        };
    }
}

