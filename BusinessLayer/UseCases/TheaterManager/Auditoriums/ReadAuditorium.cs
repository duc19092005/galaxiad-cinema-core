using BusinessLayer.Dtos;
using BusinessLayer.Dtos.TheaterManager.Auditoriums.Responses;
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
        var isAdmin = userContextservice.IsInRole("Admin");

        var getCinemaByUserIdQuery = _cinemaDbContext.CinemaInfoEntity.AsNoTracking()
                .Include(x => x.AuditoriumInfoEntities)
                .Include(x => x.TheaterManager).ThenInclude(u => u.UserProfileEntity)
                .Include(x => x.FacilitiesManager).ThenInclude(u => u.UserProfileEntity)
                .AsQueryable();

        if (!isAdmin)
        {
            getCinemaByUserIdQuery = getCinemaByUserIdQuery.Where(x => x.TheaterManagerId == userId);
        }

        var getCinemaByUserId = await getCinemaByUserIdQuery.FirstOrDefaultAsync();

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
            TotalAuditoriums = getCinemaByUserId.AuditoriumInfoEntities.Count,
            TheaterManagerName = getCinemaByUserId.TheaterManager != null && getCinemaByUserId.TheaterManager.UserProfileEntity != null 
                ? getCinemaByUserId.TheaterManager.UserProfileEntity.UserName : "Chưa có",
            FacilitiesManagerName = getCinemaByUserId.FacilitiesManager != null && getCinemaByUserId.FacilitiesManager.UserProfileEntity != null 
                ? getCinemaByUserId.FacilitiesManager.UserProfileEntity.UserName : "Chưa có"
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