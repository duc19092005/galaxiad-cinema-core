using Shared.Exceptions;
using Shared.Localization;
using BusinessLayer.Dtos;
using BusinessLayer.Dtos.FacilitiesManager.Cinemas;
using BusinessLayer.Interfaces.IBehaviors;
using DataAccess;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace BusinessLayer.UseCases.FacilitiesManager.Cinemas;

public class FacilitiesManagerReadCinemaUseCase : IReadBehavior<ResFacilitiesManagerCinema>
{
    private readonly CinemaDbContext _dbContext;
    
    private readonly ILogger<FacilitiesManagerReadCinemaUseCase> _logger;

    public FacilitiesManagerReadCinemaUseCase(CinemaDbContext dbContext , ILogger<FacilitiesManagerReadCinemaUseCase> logger)
    {
        this._dbContext = dbContext;
        this._logger = logger;
    }
    
    public async Task<BaseResponse<List<ResFacilitiesManagerCinema>>> GetAll()
    {
        try
        {
            var getResults = await _dbContext.CinemaInfoEntity.Select(x => new ResFacilitiesManagerCinema()
            {
                CinemaId = x.CinemaId,
                CinemaLocation = x.CinemaLocation,
                CinemaDescription = x.CinemaDescription,
                CinemaName = x.CinemaName,
                CinemaHotlineNumber = x.CinemaHotLineNumber,
                TotalRooms = x.AuditoriumInfoEntities.Count
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
            var cinemaData = await _dbContext.CinemaInfoEntity
                .Where(x => x.CinemaId == id)
                .Select(x => new ResFacilitiesManagerCinema
                {
                    CinemaId = x.CinemaId,
                    CinemaName = x.CinemaName,
                    CinemaDescription = x.CinemaDescription,
                    CinemaLocation = x.CinemaLocation,
                    CinemaHotlineNumber = x.CinemaHotLineNumber,
                    TotalRooms = x.AuditoriumInfoEntities.Count 
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

