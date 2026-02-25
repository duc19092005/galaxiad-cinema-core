using BusinessLayer.Dtos;
using BusinessLayer.Dtos.TheaterManager.Auditoriums;
using BusinessLayer.Interfaces.TheaterManager;
using BusinessLayer.Services.IdentityAccess;
using DataAccess;
using Microsoft.EntityFrameworkCore;
using Shared.Localization;

namespace BusinessLayer.UseCases.TheaterManager.Auditoriums;

public class ReadAuditorium : ITheaterManagerReadAuditorium
{
    private readonly CinemaDbContext _cinemaDbContext;
    
    private readonly IUserContextService userContextservice;

    public ReadAuditorium(CinemaDbContext dbContext , IUserContextService userContextservice)
    {
        _cinemaDbContext = dbContext;
        this.userContextservice = userContextservice;
    }

    public async Task<BaseResponse<TheaterManagerAuditoriumRes>> GetAuditoriumByCurrentManager()
    {
        Guid userId = GetUserId();
        // Checking Cinemas
        var getCinemaByUserId =
            await _cinemaDbContext.CinemaInfoEntity.AsNoTracking().Include(x => x.AuditoriumInfoEntities).FirstOrDefaultAsync
            (x =>
                x.ManagerId.Equals(userId));

        if (getCinemaByUserId == null)
        {
            // Throw Error Here
        }

        var auditoriumLists =
            _cinemaDbContext.AuditoriumInfoEntities.AsNoTracking()
                .Where(x => x.CinemaId.Equals(getCinemaByUserId.CinemaId) && x.IsActive && !x.IsDeleted).Select(x 
                    => 
                    new TheaterManagerAuditoriumInfos
                    {
                        AuditoriumId = x.AuditoriumId,
                        AuditoriumNumber = x.AuditoriumNumber ,
                        TotalSeats = x.SeatsInfoEntity.Count ,
                        AuditoriumSupportedFormats = 
                            x.AuditoriumFormatInfosList.Select(y => y.MovieFormatInfoEntity.MovieFormatName)
                    });

        if (!auditoriumLists.Any())
        {
            // Throw Error Here
        }

        TheaterManagerAuditoriumRes res = new TheaterManagerAuditoriumRes()
        {
            CinemaName = getCinemaByUserId.CinemaName,
            CinemaHotLineNumber = getCinemaByUserId.CinemaHotLineNumber,
            CinemaLocation = getCinemaByUserId.CinemaLocation,
            TotalAuditoriums = getCinemaByUserId.AuditoriumInfoEntities.Count
        };
        
        // Config For base Response

        return new BaseResponse<TheaterManagerAuditoriumRes>
        {
            Message = Messages.Auditorium.GetCompleted,
            Data = res,
            IsSuccess = true
        };
    }
    
    private Guid GetUserId()
    {
        return userContextservice.GetUserId();
    }

}