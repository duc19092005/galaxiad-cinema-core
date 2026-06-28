using System;
using System.Threading.Tasks;
using Cinema.Application.Dtos;
using Cinema.Application.Dtos.Public.Responses;
using Cinema.Application.Interfaces.Catalog;
using Cinema.Domain.Localization;

namespace Cinema.Application.UseCases.Customer.Catalog;

public class GetAuditoriumDetailsUseCase
{
    private readonly IPublicCatalogRepository _repository;

    public GetAuditoriumDetailsUseCase(IPublicCatalogRepository repository)
    {
        _repository = repository;
    }

    public async Task<BaseResponse<GetAuditoriumInfosRes>> ExecuteAsync(Guid scheduleId)
    {
        var details = await _repository.GetAuditoriumDetailsAsync(scheduleId);

        if (details == null)
        {
            return new BaseResponse<GetAuditoriumInfosRes>
            {
                IsSuccess = false,
                Message = Messages.Catalog.AuditoriumNotFound
            };
        }

        return new BaseResponse<GetAuditoriumInfosRes>
        {
            Data = details,
            IsSuccess = true,
            Message = Messages.Catalog.GetAuditoriumDetailSuccess
        };
    }
}

