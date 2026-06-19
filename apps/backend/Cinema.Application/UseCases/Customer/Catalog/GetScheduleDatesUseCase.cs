using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Cinema.Application.Dtos;
using Cinema.Application.Interfaces.Catalog;
using Cinema.Domain.Utils;

namespace Cinema.Application.UseCases.Customer.Catalog;

public class GetScheduleDatesUseCase
{
    private readonly IPublicCatalogRepository _repository;

    public GetScheduleDatesUseCase(IPublicCatalogRepository repository)
    {
        _repository = repository;
    }

    public async Task<BaseResponse<List<string>>> ExecuteAsync(Guid movieId, string? city)
    {
        var scheduleUtcTimes = await _repository.GetScheduleUtcTimesAsync(movieId, city);

        var findSchedulesDates = scheduleUtcTimes
            .Select(utc => DateTimeHelper.ToVietnamTime(utc).Date)
            .Distinct()
            .OrderBy(d => d)
            .Select(d => d.ToString("yyyy-MM-dd"))
            .ToList();

        return new BaseResponse<List<string>>
        {
            Data = findSchedulesDates,
            IsSuccess = true,
            Message = "Thành công"
        };
    }
}
