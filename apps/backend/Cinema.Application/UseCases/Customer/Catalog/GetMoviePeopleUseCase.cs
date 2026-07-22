using Cinema.Application.Dtos;
using Cinema.Application.Dtos.MovieManager.Responses;
using Cinema.Application.Interfaces.Catalog;

namespace Cinema.Application.UseCases.Customer.Catalog;

public class GetMoviePeopleUseCase
{
    private readonly IPublicCatalogRepository _repository;

    public GetMoviePeopleUseCase(IPublicCatalogRepository repository)
    {
        _repository = repository;
    }

    public async Task<BaseResponse<ResMoviePeopleDto>> ExecuteAsync()
    {
        var (directors, actors) = await _repository.GetMoviePeopleAsync();
        return new BaseResponse<ResMoviePeopleDto>
        {
            IsSuccess = true,
            Message = "OK",
            Data = new ResMoviePeopleDto
            {
                Directors = directors,
                Actors = actors
            }
        };
    }
}
