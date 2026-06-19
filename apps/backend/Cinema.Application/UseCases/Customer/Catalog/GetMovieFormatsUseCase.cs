using System.Collections.Generic;
using System.Threading.Tasks;
using Cinema.Application.Dtos;
using Cinema.Application.Dtos.Public.Responses;
using Cinema.Application.Interfaces.Catalog;
using Cinema.Domain.Localization;

namespace Cinema.Application.UseCases.Customer.Catalog;

public class GetMovieFormatsUseCase
{
    private readonly IPublicCatalogRepository _repository;

    public GetMovieFormatsUseCase(IPublicCatalogRepository repository)
    {
        _repository = repository;
    }

    public async Task<BaseResponse<List<BaseFormatInfo>>> ExecuteAsync()
    {
        var formats = await _repository.GetMovieFormatsAsync();
        return new BaseResponse<List<BaseFormatInfo>>
        {
            Data = formats,
            IsSuccess = true,
            Message = Messages.MovieFormat.GetDataSuccess
        };
    }
}
