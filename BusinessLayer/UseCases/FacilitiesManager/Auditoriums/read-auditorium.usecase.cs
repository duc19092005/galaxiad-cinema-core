using System.Security.Claims;
using Backend.Shard.Exceptions;
using BusinessLayer.Dtos;
using BusinessLayer.Dtos.facilities_manager.Auditoriums;
using BusinessLayer.Interfaces.i_Behaviors;
using BusinessLayer.Interfaces.i_cinema;
using DataAccess;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace BusinessLayer.Use_cases.facilities_manager.Auditoriums;

public class facilitiesManagerReadAuditoriumUseCase : IReadBehavior<get_res_auditorium_dto> , ICinemaBehavior<GetResAuditoriumDtoCinema>
{
    private readonly cinemaDbContext _dbContext;
    private readonly ILogger<facilitiesManagerReadAuditoriumUseCase> _logger;
    private readonly IHttpContextAccessor  _httpContextAccessor;

    public facilitiesManagerReadAuditoriumUseCase(cinemaDbContext dbContext, ILogger<facilitiesManagerReadAuditoriumUseCase> logger,
        IHttpContextAccessor httpContextAccessor)
    {
        this._logger = logger;
        this._dbContext = dbContext;
        this._httpContextAccessor = httpContextAccessor;
    }
    
    // Lấy những danh sách rạp mà do user đó tạo
    public async Task<BaseResponse<List<get_res_auditorium_dto>>> GetAll()
    {
        try
        {
            var getData = await _dbContext.auditorium_info_entity
                .AsNoTracking()
                .Where(x => x.createdByUserId.Equals(Guid.Parse(_httpContextAccessor.HttpContext.User.FindFirst(ClaimTypes.Sid).Value)))
                .Select(x => new get_res_auditorium_dto()
                {
                    auditoriumId = x.auditoriumId,
                    auditoriumNumber = x.auditoriumNumber,
                    movieFormatName = x.movie_format_info_entity.movieFormatName,
                    cinemaName = x.cinema_info_entity.cinemaName,
                    totalSeats = x.seats_info_entity.Count,
                    seatsInfos = x.seats_info_entity.Select(x => new ReqSeatsAuditoriumDto
                    {
                        SeatNumber = x.seatNumber,
                        coordX = x.coordX,
                        CoordY = x.coordY,
                        ColIndex = x.colIndex,
                        RowIndex = x.rowIndex,
                    }).ToList()
                }).ToListAsync();

            return new BaseResponse<List<get_res_auditorium_dto>>()
            {
                Data = getData,
                IsSuccess = true,
                Message = "Get auditorium completed"
            };
        }
        catch (appException)
        {
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, ex.Message);
            throw systemException.SystemExceptionCaller();
        }
    }
    
    public async Task<BaseResponse<get_res_auditorium_dto>> GetById(Guid id)
    {
        try
        {
            var userIdClaim = _httpContextAccessor.HttpContext.User.FindFirst(ClaimTypes.Sid)?.Value;
            if (string.IsNullOrEmpty(userIdClaim)) throw new appException("Unauthorize", 403, "AUTH02");
            var userId = Guid.Parse(userIdClaim);

            var result = await _dbContext.auditorium_info_entity
                .AsNoTracking()
                .Where(x => x.auditoriumId == id && x.createdByUserId == userId)
                .Select(x => new get_res_auditorium_dto()
                {
                    auditoriumId = x.auditoriumId,
                    auditoriumNumber = x.auditoriumNumber,
                    movieFormatName = x.movie_format_info_entity.movieFormatName,
                    cinemaName = x.cinema_info_entity.cinemaName,
                    totalSeats = x.seats_info_entity.Count,
                    seatsInfos = x.seats_info_entity.Select(s => new ReqSeatsAuditoriumDto()
                    {
                        SeatNumber = s.seatNumber,
                        coordX = s.coordX,
                        CoordY = s.coordY,
                        ColIndex = s.colIndex,
                        RowIndex = s.rowIndex,
                    }).ToList()
                })
                .FirstOrDefaultAsync();

            if (result == null)
            {
                throw new appException("Error : Can not find auditorium", 404, "NOTFOUND01");
            }

            return new BaseResponse<get_res_auditorium_dto>()
            {
                Data = result,
                IsSuccess = true,
                Message = "Get auditorium completed"
            };
        }
        catch (appException)
        {
            throw;
        }
        catch (Exception ex)
        {
            throw systemException.SystemExceptionCaller();
        }
    }
    
    public async Task<BaseResponse<List<GetResAuditoriumDtoCinema>>> GetByCinemaId(Guid cinemaId)
    {
        try
        {
            var getData = await _dbContext.auditorium_info_entity
                .AsNoTracking()
                .Where(x => x.createdByUserId.Equals(Guid.Parse(_httpContextAccessor.HttpContext.User.FindFirst(ClaimTypes.Sid).Value))
                            && x.cinemaId.Equals(cinemaId)).Select(x => new GetResAuditoriumDtoCinema()
                {
                    auditoriumId = x.auditoriumId,
                    auditoriumNumber = x.auditoriumNumber,
                    movieFormatName = x.movie_format_info_entity.movieFormatName,
                    cinemaName = x.cinema_info_entity.cinemaName,
                    totalSeats = x.seats_info_entity.Count
                }).ToListAsync();

            return new BaseResponse<List<GetResAuditoriumDtoCinema>>()
            {
                Data = getData,
                IsSuccess = true,
                Message = "Get auditorium completed"
            };
        }
        catch (appException)
        {
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, ex.Message);
            throw systemException.SystemExceptionCaller();
        }
    }
    
    public async Task<BaseResponse<List<GetResAuditoriumDtoCinema>>> GetByCinemaName(string name)
    {
        return null!;
    }
    
    public async Task<BaseResponse<List<get_res_auditorium_dto>>> GetByEntityName(string name)
    {
        return null!;
    }
}