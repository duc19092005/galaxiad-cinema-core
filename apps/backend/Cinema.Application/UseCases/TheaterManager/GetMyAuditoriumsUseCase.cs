using Cinema.Application.Dtos;
using Cinema.Application.Interfaces.Facilities;
using Cinema.Application.Interfaces;
using Cinema.Application.Dtos.TheaterManager;
using Microsoft.Extensions.Logging;

namespace Cinema.Application.UseCases.TheaterManager;

public class GetMyAuditoriumsUseCase
{
    private readonly ITheaterManagerDataRepository _repository;
    private readonly IUserContextService _userContextService;
    private readonly ILogger<GetMyAuditoriumsUseCase> _logger;

    public GetMyAuditoriumsUseCase(
        ITheaterManagerDataRepository repository,
        IUserContextService userContextService,
        ILogger<GetMyAuditoriumsUseCase> logger)
    {
        _repository = repository;
        _userContextService = userContextService;
        _logger = logger;
    }

    public async Task<BaseResponse<TheaterManagerAuditoriumSelectionDto>> ExecuteAsync(Guid? cinemaId)
    {
        var userId = _userContextService.GetUserId();
        var isAdmin = _userContextService.IsInRole("Admin");

        var result = await _repository.GetMyAuditoriumsAsync(cinemaId, userId, isAdmin);

        if (result == null)
        {
            return new BaseResponse<TheaterManagerAuditoriumSelectionDto>
            {
                IsSuccess = false,
                Message = cinemaId.HasValue
                    ? "Rạp phim theo Id không tìm thấy hoặc bạn không có quyền quản lý."
                    : "Tài khoản của bạn chưa được chỉ định quản lý rạp phim nào."
            };
        }

        return new BaseResponse<TheaterManagerAuditoriumSelectionDto>
        {
            IsSuccess = true,
            Data = result,
            Message = "Lấy dữ liệu phòng chiếu thành công."
        };
    }
}
