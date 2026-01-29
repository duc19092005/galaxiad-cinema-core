using System.Security.Claims;
using Shared.Exceptions;
using BusinessLayer.Dtos;
using BusinessLayer.Dtos.FacilitiesManager.Auditoriums;
using BusinessLayer.Interfaces.IBehaviors;
using BusinessLayer.Interfaces.ICinema;
using DataAccess;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Shared.Exceptions;
using Shared.Utils;

namespace BusinessLayer.UseCases.FacilitiesManager.Auditoriums;

public class FacilitiesManagerReadAuditoriumUseCase : IReadBehavior<GetResAuditoriumDto> , ICinemaBehavior<GetResAuditoriumDtoCinema>
{
    private readonly CinemaDbContext _dbContext;
    private readonly ILogger<FacilitiesManagerReadAuditoriumUseCase> _logger;
    private readonly IHttpContextAccessor  _httpContextAccessor;
    private readonly IUserContextService _userContextService;

    public FacilitiesManagerReadAuditoriumUseCase(CinemaDbContext dbContext, ILogger<FacilitiesManagerReadAuditoriumUseCase> logger,
        IHttpContextAccessor httpContextAccessor , IUserContextService userContextService)
    {
        this._logger = logger;
        this._dbContext = dbContext;
        this._httpContextAccessor = httpContextAccessor;
        this._userContextService = userContextService;
    }
    
    // Lấy những danh sách rạp mà do user đó tạo
    public async Task<BaseResponse<List<GetResAuditoriumDto>>> GetAll()
    {
        try
        {
            var UserId = _userContextService.GetUserId();
            
            var getData = await _dbContext.AuditoriumInfoEntities
                .AsNoTracking()
                .Where(x => x.CreatedByUserId.Equals((UserId)))
                .Select(x => new GetResAuditoriumDto()
                {
                    AuditoriumId = x.AuditoriumId,
                    AuditoriumNumber = x.AuditoriumNumber,
                    MovieFormatName = x.MovieFormatInfoEntity.MovieFormatName,
                    CinemaName = x.CinemaInfoEntity.CinemaName,
                    TotalSeats = x.SeatsInfoEntity.Count,
                    SeatsInfos = x.SeatsInfoEntity.Select(s => new ReqSeatsAuditoriumDto
                    {
                        SeatNumber = s.SeatNumber,
                        CoordX = s.CoordX,
                        CoordY = s.CoordY,
                        ColIndex = s.ColIndex,
                        RowIndex = s.RowIndex,
                    }).ToList()
                }).ToListAsync();

            return new BaseResponse<List<GetResAuditoriumDto>>()
            {
                Data = getData,
                IsSuccess = true,
                Message = "Get auditorium completed"
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
            var userIdClaim = _httpContextAccessor.HttpContext?.User.FindFirst(ClaimTypes.Sid)?.Value;
            if (string.IsNullOrEmpty(userIdClaim)) throw new AppException("Unauthorize", 401, "AUTH02");
            var UserId = Guid.Parse(userIdClaim);

            var result = await _dbContext.AuditoriumInfoEntities
                .AsNoTracking()
                .Where(x => x.AuditoriumId == id && x.CreatedByUserId == UserId)
                .Select(x => new GetResAuditoriumDto()
                {
                    AuditoriumId = x.AuditoriumId,
                    AuditoriumNumber = x.AuditoriumNumber,
                    MovieFormatName = x.MovieFormatInfoEntity.MovieFormatName,
                    CinemaName = x.CinemaInfoEntity.CinemaName,
                    TotalSeats = x.SeatsInfoEntity.Count,
                    SeatsInfos = x.SeatsInfoEntity.Select(s => new ReqSeatsAuditoriumDto()
                    {
                        SeatNumber = s.SeatNumber,
                        CoordX = s.CoordX,
                        CoordY = s.CoordY,
                        ColIndex = s.ColIndex,
                        RowIndex = s.RowIndex,
                    }).ToList()
                })
                .FirstOrDefaultAsync();

            if (result == null)
            {
                throw new AppException("Error : Can not find auditorium", 404, "NOTFOUND01");
            }

            return new BaseResponse<GetResAuditoriumDto>()
            {
                Data = result,
                IsSuccess = true,
                Message = "Get auditorium completed"
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
    
    public async Task<BaseResponse<List<GetResAuditoriumDtoCinema>>> GetByCinemaId(Guid CinemaId)
    {
        try
        {
            var UserId = _httpContextAccessor.HttpContext?.User.FindFirst(ClaimTypes.Sid)?.Value;
            
            var getData = await _dbContext.AuditoriumInfoEntities
                .AsNoTracking()
                .Where(x => x.CreatedByUserId.Equals(UserId)
                            && x.CinemaId.Equals(CinemaId)).Select(x => new GetResAuditoriumDtoCinema()
                {
                    AuditoriumId = x.AuditoriumId,
                    AuditoriumNumber = x.AuditoriumNumber,
                    MovieFormatName = x.MovieFormatInfoEntity.MovieFormatName,
                    CinemaName = x.CinemaInfoEntity.CinemaName,
                    TotalSeats = x.SeatsInfoEntity.Count
                }).ToListAsync();

            return new BaseResponse<List<GetResAuditoriumDtoCinema>>()
            {
                Data = getData,
                IsSuccess = true,
                Message = "Get auditorium completed"
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
}


