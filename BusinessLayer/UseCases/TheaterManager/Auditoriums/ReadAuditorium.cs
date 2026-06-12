using BusinessLayer.Dtos;
using BusinessLayer.Dtos.TheaterManager.Auditoriums.Responses;
using BusinessLayer.Interfaces.TheaterManager;
using BusinessLayer.Services.IdentityAccess;
using BusinessLayer.Entities.CinemaInfos;
using Microsoft.EntityFrameworkCore;
using Shared.Interfaces.Persistence;
using Shared.Localization;

namespace BusinessLayer.UseCases.TheaterManager.Auditoriums;

public class ReadAuditorium : ITheaterManagerReadAuditorium
{
    private readonly IUnitOfWork _unitOfWork;
    
    private readonly IUserContextService userContextservice;

    public ReadAuditorium(IUnitOfWork unitOfWork , IUserContextService userContextservice)
    {
        _unitOfWork = unitOfWork;
        this.userContextservice = userContextservice;
    }

    public async Task<BaseResponse<TheaterManagerAuditoriumRes>> GetAuditoriumByCurrentManager()
    {
        Guid userId = GetUserId();
        // Checking Cinemas
        var isAdmin = userContextservice.IsInRole("Admin");

        var getCinemaByUserIdQuery = _unitOfWork.Repository<CinemaInfoEntity>().Query().AsNoTracking()
                .Include(x => x.AuditoriumInfoEntities)
                .Include(x => x.TheaterManager)
                .Include(x => x.FacilitiesManager)
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
            _unitOfWork.Repository<AuditoriumInfoEntities>().Query().AsNoTracking()
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
            TheaterManagerName = getCinemaByUserId.TheaterManager != null 
                ? getCinemaByUserId.TheaterManager.UserName : "Chưa có",
            FacilitiesManagerName = getCinemaByUserId.FacilitiesManager != null 
                ? getCinemaByUserId.FacilitiesManager.UserName : "Chưa có"
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
