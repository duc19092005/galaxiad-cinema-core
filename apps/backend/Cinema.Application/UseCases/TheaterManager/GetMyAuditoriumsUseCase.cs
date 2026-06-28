using Cinema.Application.Dtos;
using Cinema.Application.Dtos.TheaterManager;
using Cinema.Application.Interfaces;
using Cinema.Application.Interfaces.Facilities;
using Cinema.Domain.Localization;
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
            _logger.LogInformation("Auditorium selection data was not available for user {UserId}.", userId);
            return new BaseResponse<TheaterManagerAuditoriumSelectionDto>
            {
                IsSuccess = false,
                Message = cinemaId.HasValue
                    ? Messages.Auditorium.NotFoundOrNoPermission
                    : Messages.Auditorium.NoManagedCinemaAssigned
            };
        }

        return new BaseResponse<TheaterManagerAuditoriumSelectionDto>
        {
            IsSuccess = true,
            Data = result,
            Message = Messages.Auditorium.GetSelectionDataSuccess
        };
    }
}
