using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Cinema.Application.Dtos;
using Cinema.Application.Dtos.Public.Responses;
using Cinema.Application.Interfaces.Catalog;

namespace Cinema.Application.UseCases.Customer.Catalog;

public class GetMoviesUseCase
{
    private readonly IPublicCatalogRepository _repository;

    public GetMoviesUseCase(IPublicCatalogRepository repository)
    {
        _repository = repository;
    }

    public async Task<BaseResponse<List<MovieInfoRes>>> ExecuteAsync(string? city, string? status, Guid? cinemaId)
    {
        var movies = await _repository.GetMoviesAsync(city, status, cinemaId);
        return new BaseResponse<List<MovieInfoRes>>
        {
            Data = movies,
            IsSuccess = true,
            Message = "ThÃ nh cÃ´ng"
        };
    }
}

