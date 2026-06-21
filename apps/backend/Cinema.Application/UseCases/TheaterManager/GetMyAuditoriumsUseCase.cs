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
                    ? "Ráº¡p phim theo Id khÃ´ng tÃ¬m tháº¥y hoáº·c báº¡n khÃ´ng cÃ³ quyá»n quáº£n lÃ½."
                    : "TÃ i khoáº£n cá»§a báº¡n chÆ°a Ä‘Æ°á»£c chá»‰ Ä‘á»‹nh quáº£n lÃ½ ráº¡p phim nÃ o."
            };
        }

        return new BaseResponse<TheaterManagerAuditoriumSelectionDto>
        {
            IsSuccess = true,
            Data = result,
            Message = "Láº¥y dá»¯ liá»‡u phÃ²ng chiáº¿u thÃ nh cÃ´ng."
        };
    }
}

