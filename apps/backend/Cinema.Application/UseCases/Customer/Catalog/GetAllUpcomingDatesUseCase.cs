using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Cinema.Application.Dtos;
using Cinema.Application.Interfaces.Catalog;
using Cinema.Domain.Utils;

namespace Cinema.Application.UseCases.Customer.Catalog;

public class GetAllUpcomingDatesUseCase
{
    private readonly IPublicCatalogRepository _repository;

    public GetAllUpcomingDatesUseCase(IPublicCatalogRepository repository)
    {
        _repository = repository;
    }

    public async Task<BaseResponse<List<string>>> ExecuteAsync(string? city, Guid? cinemaId)
    {
        var scheduleUtcTimes = await _repository.GetAllUpcomingUtcTimesAsync(city, cinemaId);

        var findSchedulesDates = scheduleUtcTimes
            .Select(utc => DateTimeHelper.ToVietnamTime(utc).Date)
            .Distinct()
            .OrderBy(d => d)
            .Select(d => d.ToString("yyyy-MM-dd"))
            .Take(14)
            .ToList();

        return new BaseResponse<List<string>>
        {
            Data = findSchedulesDates,
            IsSuccess = true,
            Message = "Thành công"
        };
    }
}
