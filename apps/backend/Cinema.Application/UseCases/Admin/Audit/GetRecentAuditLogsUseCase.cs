using Cinema.Application.Dtos;
using Cinema.Application.Dtos.Admin.Responses;
using Cinema.Application.Interfaces;
using Cinema.Application.Interfaces.Admin;

namespace Cinema.Application.UseCases.Admin.Audit;

public class GetRecentAuditLogsUseCase
{
    private readonly IAdminRepository _adminRepository;
    private readonly IUserContextService _userContextService;

    public GetRecentAuditLogsUseCase(IAdminRepository adminRepository, IUserContextService userContextService)
    {
        _adminRepository = adminRepository;
        _userContextService = userContextService;
    }

    public async Task<BaseResponse<List<AuditLogDto>>> ExecuteAsync(int take = 30)
    {
        var userId = _userContextService.GetUserId();
        var isAdmin = _userContextService.IsInRole("Admin");
        var isFacilitiesManager = _userContextService.IsInRole("FacilitiesManager");
        var isTheaterManager = _userContextService.IsInRole("TheaterManager");
        var isMovieManager = _userContextService.IsInRole("MovieManager");

        List<Guid>? cinemaIds = null;
        Guid? movieManagerUserId = null;

        if (!isAdmin)
        {
            if (isFacilitiesManager || isTheaterManager)
            {
                cinemaIds = await _adminRepository.GetManagerCinemaIdsAsync(userId, isFacilitiesManager, isTheaterManager);
            }
            else if (isMovieManager)
            {
                movieManagerUserId = userId;
            }
            else
            {
                return new BaseResponse<List<AuditLogDto>>
                {
                    IsSuccess = true,
                    Message = "Get audit logs successfully.",
                    Data = new List<AuditLogDto>()
                };
            }
        }

        var logs = await _adminRepository.GetRecentAuditLogsAsync(take, cinemaIds, movieManagerUserId);

        return new BaseResponse<List<AuditLogDto>>
        {
            IsSuccess = true,
            Message = "Get audit logs successfully.",
            Data = logs
        };
    }
}
