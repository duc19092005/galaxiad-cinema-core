using Cinema.Application.Dtos;
using Cinema.Application.Dtos.Shifts;
using Cinema.Application.Interfaces.Facilities;

namespace Cinema.Application.UseCases.TheaterManager.ShiftManagement;

public class GetShiftTemplatesUseCase
{
    private readonly IShiftManagerRepository _repository;

    public GetShiftTemplatesUseCase(IShiftManagerRepository repository)
    {
        _repository = repository;
    }

    public async Task<BaseResponse<List<ResShiftTemplateDto>>> ExecuteAsync(Guid cinemaId)
    {
        var templates = await _repository.GetShiftTemplatesAsync(cinemaId);
        return new BaseResponse<List<ResShiftTemplateDto>> { IsSuccess = true, Data = templates };
    }
}
