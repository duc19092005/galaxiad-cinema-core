using Shared.Exceptions;
using Shared.Localization;
using BusinessLayer.Dtos;
using BusinessLayer.Dtos.FacilitiesManager.Cinemas.Responses;
using BusinessLayer.Interfaces.IBehaviors;
using BusinessLayer.Entities.CinemaInfos;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using BusinessLayer.Services.IdentityAccess;
using Microsoft.AspNetCore.Http;
using Shared.Interfaces.Persistence;

namespace BusinessLayer.UseCases.FacilitiesManager.Cinemas;

public class FacilitiesManagerReadCinemaUseCase : IReadBehavior<ResFacilitiesManagerCinema>
{
    private readonly IUnitOfWork _unitOfWork;
    
    private readonly IUserContextService _userContextService;
    private readonly ILogger<FacilitiesManagerReadCinemaUseCase> _logger;

    public FacilitiesManagerReadCinemaUseCase(IUnitOfWork unitOfWork , ILogger<FacilitiesManagerReadCinemaUseCase> logger, IUserContextService userContextService)
    {
        this._unitOfWork = unitOfWork;
        this._logger = logger;
        this._userContextService = userContextService;
    }
    
    public async Task<BaseResponse<List<ResFacilitiesManagerCinema>>> GetAll()
    {
        try
        {
            var userId = _userContextService.GetUserId();
            var isAdmin = _userContextService.IsInRole("Admin");

            var query = _unitOfWork.Repository<CinemaInfoEntity>().Query();
            if (!isAdmin)
            {
                // Check if user is FacilitiesManager or TheaterManager and filter accordingly
                var isFacilitiesManager = _userContextService.IsInRole("FacilitiesManager");
                var isTheaterManager = _userContextService.IsInRole("TheaterManager");

                query = query.Where(x => 
                    (isFacilitiesManager && x.FacilitiesManagerId == userId) ||
                    (isTheaterManager && x.TheaterManagerId == userId)
                );
            }

            var getResults = await query
                .Select(x => new ResFacilitiesManagerCinema()
            {
                CinemaId = x.CinemaId,
                CinemaLocation = x.CinemaLocation,
                CinemaDescription = x.CinemaDescription,
                CinemaName = x.CinemaName,
                CinemaHotlineNumber = x.CinemaHotLineNumber,
                TotalRooms = x.AuditoriumInfoEntities.Count,
                TheaterManagerName = x.TheaterManager != null ? x.TheaterManager.UserName ?? "Chưa có" : "Chưa có",
                FacilitiesManagerName = x.FacilitiesManager != null ? x.FacilitiesManager.UserName ?? "Chưa có" : "Chưa có"
            }).ToListAsync();

            return new BaseResponse<List<ResFacilitiesManagerCinema>>()
            {
                IsSuccess = true,
                Data = getResults,
                Message = Messages.Cinema.GetListSuccess
            };
        }
        catch (Exception e)
        {
            _logger.LogError(e.Message);
             throw CustomSystemException.SystemExceptionCaller();
        }
    }

    public async Task<BaseResponse<ResFacilitiesManagerCinema>> GetById(Guid id)
    {
        try
        {
            var userId = _userContextService.GetUserId();
            var isAdmin = _userContextService.IsInRole("Admin");

            var query = _unitOfWork.Repository<CinemaInfoEntity>().Query().Where(x => x.CinemaId == id);
            
            if (!isAdmin)
            {
                var isFacilitiesManager = _userContextService.IsInRole("FacilitiesManager");
                var isTheaterManager = _userContextService.IsInRole("TheaterManager");

                query = query.Where(x => 
                    (isFacilitiesManager && x.FacilitiesManagerId == userId) ||
                    (isTheaterManager && x.TheaterManagerId == userId)
                );
            }

            var cinemaData = await query
                .Select(x => new ResFacilitiesManagerCinema
                {
                    CinemaId = x.CinemaId,
                    CinemaName = x.CinemaName,
                    CinemaDescription = x.CinemaDescription,
                    CinemaLocation = x.CinemaLocation,
                    CinemaHotlineNumber = x.CinemaHotLineNumber,
                    TotalRooms = x.AuditoriumInfoEntities.Count,
                    TheaterManagerName = x.TheaterManager != null ? x.TheaterManager.UserName ?? "Chưa có" : "Chưa có",
                    FacilitiesManagerName = x.FacilitiesManager != null ? x.FacilitiesManager.UserName ?? "Chưa có" : "Chưa có"
                })
                .FirstOrDefaultAsync();

            if (cinemaData == null)
            {
                throw new AppException(Messages.Cinema.NotFound,
                    StatusCodes.Status404NotFound, "NotFound01");
            }

            return new BaseResponse<ResFacilitiesManagerCinema>()
            {
                IsSuccess = true,
                Data = cinemaData,
                Message = Messages.Cinema.GetInfoSuccess
            };
        }
        catch (Exception e)
        {
            _logger.LogError(e.Message);
            throw CustomSystemException.SystemExceptionCaller();
        }
    }

    public Task<BaseResponse<List<ResFacilitiesManagerCinema>>> GetByEntityName(string name)
    {
        return null!;
    }
}

