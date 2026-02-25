using Shared.Exceptions;
using Shared.Localization;
using BusinessLayer.Dtos;
using BusinessLayer.Dtos.FacilitiesManager.Auditoriums;
using BusinessLayer.Interfaces.IBehaviors;
using BusinessLayer.Interfaces.ICinema;
using BusinessLayer.Services.IdentityAccess;
using DataAccess;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;


namespace BusinessLayer.UseCases.FacilitiesManager.Auditoriums;

public class FacilitiesManagerReadAuditoriumUseCase : IReadBehavior<GetResAuditoriumDto> , ICinemaBehavior<GetResAuditoriumDtoCinema>
{
    private readonly CinemaDbContext _dbContext;
    private readonly ILogger<FacilitiesManagerReadAuditoriumUseCase> _logger;
    private readonly IUserContextService _userContextService;

    public FacilitiesManagerReadAuditoriumUseCase(CinemaDbContext dbContext, ILogger<FacilitiesManagerReadAuditoriumUseCase> logger,
        IUserContextService userContextService)
    {
        this._logger = logger;
        this._dbContext = dbContext;
        this._userContextService = userContextService;
    }
    
    // Lấy những danh sách rạp mà do user đó tạo
    public async Task<BaseResponse<List<GetResAuditoriumDto>>> GetAll()
    {
        try
        {
            var userId = _userContextService.GetUserId();
            
            var getData = await _dbContext.AuditoriumInfoEntities
                .AsNoTracking()
                .Where(x => x.CreatedByUserId.Equals((userId)))
                .Select(x => new GetResAuditoriumDto()
                {
                    AuditoriumId = x.AuditoriumId,
                    AuditoriumNumber = x.AuditoriumNumber,
                    FormatInfos = x.AuditoriumFormatInfosList.Select(y => new BaseFormatInfo()
                    {
                        FormatId = y.MovieFormatInfoEntity.MovieFormatId,
                        FormatName = y.MovieFormatInfoEntity.MovieFormatName
                    }),
                    CinemaName = x.CinemaInfoEntity.CinemaName,
                    TotalSeats = x.SeatsInfoEntity.Count,
                    SeatsInfos = x.SeatsInfoEntity.Select(s => new ReqSeatsAuditoriumDto
                    {
                        SeatNumber = s.SeatNumber,
                        CoordX = s.CoordX,
                        CoordY = s.CoordY,
                        ColIndex = s.ColIndex,
                        RowIndex = s.RowIndex,
                    })
                }).ToListAsync();

            return new BaseResponse<List<GetResAuditoriumDto>>()
            {
                Data = getData,
                IsSuccess = true,
                Message = Messages.Auditorium.GetCompleted
            };
        }
        catch (AppException)
        {
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, ex.Message);
            throw CustomSystemException.SystemExceptionCaller();
        }
    }
    
    public async Task<BaseResponse<GetResAuditoriumDto>> GetById(Guid id)
    {
        try
        {

            var userId = GetUserId();

            var result = await _dbContext.AuditoriumInfoEntities
                .AsNoTracking()
                .Where(x => x.AuditoriumId == id && x.CreatedByUserId == userId)
                .Select(x => new GetResAuditoriumDto()
                {
                    AuditoriumId = x.AuditoriumId,
                    AuditoriumNumber = x.AuditoriumNumber,
                    FormatInfos = x.AuditoriumFormatInfosList.Select(y => new BaseFormatInfo()
                    {
                        FormatId = y.MovieFormatInfoEntity.MovieFormatId,
                        FormatName = y.MovieFormatInfoEntity.MovieFormatName
                    }),
                    CinemaName = x.CinemaInfoEntity.CinemaName,
                    TotalSeats = x.SeatsInfoEntity.Count,
                    SeatsInfos = x.SeatsInfoEntity.Select(s => new ReqSeatsAuditoriumDto()
                    {
                        SeatNumber = s.SeatNumber,
                        CoordX = s.CoordX,
                        CoordY = s.CoordY,
                        ColIndex = s.ColIndex,
                        RowIndex = s.RowIndex,
                    })
                })
                .FirstOrDefaultAsync();

            if (result == null)
            {
                throw new AppException(Messages.Auditorium.CannotFind, 404, "NOTFOUND01");
            }

            return new BaseResponse<GetResAuditoriumDto>()
            {
                Data = result,
                IsSuccess = true,
                Message = Messages.Auditorium.GetCompleted
            };
        }
        catch (AppException)
        {
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogError("Error Details" + ex.Message);
            throw CustomSystemException.SystemExceptionCaller();
        }
    }
    
    public async Task<BaseResponse<List<GetResAuditoriumDtoCinema>>> GetByCinemaId(Guid cinemaId)
    {
        try
        {
            var userId = GetUserId();
            
            var getData = await _dbContext.AuditoriumInfoEntities
                .AsNoTracking()
                .Where(x => x.CreatedByUserId.Equals(userId)
                            && x.CinemaId.Equals(cinemaId)).Select(x => new GetResAuditoriumDtoCinema()
                {
                    AuditoriumId = x.AuditoriumId,
                    AuditoriumNumber = x.AuditoriumNumber,
                    FormatInfos = x.AuditoriumFormatInfosList.Select(y => new BaseFormatInfo()
                    {
                        FormatId = y.MovieFormatInfoEntity.MovieFormatId,
                        FormatName = y.MovieFormatInfoEntity.MovieFormatName
                    }),
                    CinemaName = x.CinemaInfoEntity.CinemaName,
                    TotalSeats = x.SeatsInfoEntity.Count
                }).ToListAsync();

            return new BaseResponse<List<GetResAuditoriumDtoCinema>>()
            {
                Data = getData,
                IsSuccess = true,
                Message = Messages.Auditorium.GetCompleted
            };
        }
        catch (AppException)
        {
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex.Message);
            throw CustomSystemException.SystemExceptionCaller();
        }
    }
    
    public async Task<BaseResponse<List<GetResAuditoriumDtoCinema>>> GetByCinemaName(string name)
    {
        return null!;
    }
    
    public async Task<BaseResponse<List<GetResAuditoriumDto>>> GetByEntityName(string name)
    {
        return null!;
    }

    private Guid GetUserId()
    {
        return _userContextService.GetUserId();
    }
}


