using System.Collections.Generic;
using System.Threading.Tasks;
using Cinema.Application.Dtos;
using Cinema.Application.Dtos.Public.Responses;
using Cinema.Application.Interfaces.Catalog;
using Cinema.Domain.Localization;

namespace Cinema.Application.UseCases.Customer.Catalog;

public class GetMovieRequiredAgeUseCase
{
    private readonly IPublicCatalogRepository _repository;

    public GetMovieRequiredAgeUseCase(IPublicCatalogRepository repository)
    {
        _repository = repository;
    }

    public async Task<BaseResponse<List<BaseRequiredAge>>> ExecuteAsync()
    {
        var ages = await _repository.GetMovieRequiredAgeAsync();
        return new BaseResponse<List<BaseRequiredAge>>
        {
            Data = ages,
            IsSuccess = true,
            Message = Messages.RequiredAge.GetRequiredAgeCompleted
        };
    }
}
