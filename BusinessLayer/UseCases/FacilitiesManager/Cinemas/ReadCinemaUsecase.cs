using Shared.Exceptions;
using Shared.Localization;
using BusinessLayer.Dtos;
using BusinessLayer.Dtos.FacilitiesManager.Cinemas.Responses;
using BusinessLayer.Interfaces.IBehaviors;
using DataAccess;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using BusinessLayer.Services.IdentityAccess;

namespace BusinessLayer.UseCases.FacilitiesManager.Cinemas;

public class FacilitiesManagerReadCinemaUseCase : IReadBehavior<ResFacilitiesManagerCinema>
{
    private readonly CinemaDbContext _dbContext;
    
    private readonly IUserContextService _userContextService;
    private readonly ILogger<FacilitiesManagerReadCinemaUseCase> _logger;

    public FacilitiesManagerReadCinemaUseCase(CinemaDbContext dbContext , ILogger<FacilitiesManagerReadCinemaUseCase> logger, IUserContextService userContextService)
    {
        this._dbContext = dbContext;
        this._logger = logger;
        this._userContextService = userContextService;
    }
    
    public async Task<BaseResponse<List<ResFacilitiesManagerCinema>>> GetAll()
    {
        try
        {
            var userId = _userContextService.GetUserId();
            var isAdmin = _userContextService.IsInRole("Admin");

            var query = _dbContext.CinemaInfoEntity.AsQueryable();
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
                TheaterManagerName = x.TheaterManager != null && x.TheaterManager.UserProfileEntity != null ? x.TheaterManager.UserProfileEntity.UserName : "Chưa có",
                FacilitiesManagerName = x.FacilitiesManager != null && x.FacilitiesManager.UserProfileEntity != null ? x.FacilitiesManager.UserProfileEntity.UserName : "Chưa có"
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

            var query = _dbContext.CinemaInfoEntity.Where(x => x.CinemaId == id);
            
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
                    TheaterManagerName = x.TheaterManager != null && x.TheaterManager.UserProfileEntity != null ? x.TheaterManager.UserProfileEntity.UserName : "Chưa có",
                    FacilitiesManagerName = x.FacilitiesManager != null && x.FacilitiesManager.UserProfileEntity != null ? x.FacilitiesManager.UserProfileEntity.UserName : "Chưa có"
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

