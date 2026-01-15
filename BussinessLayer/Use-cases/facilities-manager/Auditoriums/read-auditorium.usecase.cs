using System.Security.Claims;
using Backend.Shard.Exceptions;
using BussinessLayer.Dtos;
using BussinessLayer.Dtos.Auditoriums.facilities_manager;
using BussinessLayer.Interfaces.facilities_manager.auditoriums;
using BussinessLayer.Interfaces.i_Behaviors;
using DataAccess;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace BussinessLayer.Use_cases.facilities_manager.Auditoriums;

public class read_auditorium_usecase : i_read_behavior<get_res_auditorium_dto> , i_auditorium
{
    private readonly dbContext _dbContext;
    private readonly ILogger<read_auditorium_usecase> _logger;
    private readonly IHttpContextAccessor  _httpContextAccessor;

    public read_auditorium_usecase(dbContext dbContext, ILogger<read_auditorium_usecase> logger,
        IHttpContextAccessor httpContextAccessor)
    {
        this._logger = logger;
        this._dbContext = dbContext;
        this._httpContextAccessor = httpContextAccessor;
    }
    
    // Lấy những danh sách rạp mà do user đó tạo
    public async Task<base_reponse<List<get_res_auditorium_dto>>> getAll()
    {
        try
        {
            var getData = await _dbContext.auditorium_info_entity
                .Where(x => x.createdByUserId.Equals(Guid.Parse(_httpContextAccessor.HttpContext.User.FindFirst(ClaimTypes.Sid).Value)))
                .Select(x => new get_res_auditorium_dto()
                {
                    auditoriumId = x.auditoriumId,
                    auditoriumNumber = x.auditoriumNumber,
                    movieFormatName = x.movie_format_info_entity.movieFormatName,
                    cinemaName = x.cinema_info_entity.cinemaName,
                    totalSeats = x.seats_info_entity.Count,
                    seatsInfos = x.seats_info_entity.Select(x => new req_seats_auditorium_dto
                    {
                        seatNumber = x.seatNumber,
                        coordX = x.coordX,
                        coordY = x.coordY,
                        colIndex = x.colIndex,
                        rowIndex = x.rowIndex,
                    }).ToList()
                }).ToListAsync();

            return new base_reponse<List<get_res_auditorium_dto>>()
            {
                data = getData,
                isSuccess = true,
                message = "Get auditorium completed"
            };
        }
        catch (app_exception)
        {
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, ex.Message);
            throw system_exception.system_exception_caller();
        }
    }

    public async Task<base_reponse<List<get_res_auditorium_dto>>> getByCinemaId(Guid cinemaId)
    {
        try
        {
            var getData = await _dbContext.auditorium_info_entity
                .Where(x => x.createdByUserId.Equals(Guid.Parse(_httpContextAccessor.HttpContext.User.FindFirst(ClaimTypes.Sid).Value))
                && x.cinemaId.Equals(cinemaId)).Select(x => new get_res_auditorium_dto()
                {
                    auditoriumId = x.auditoriumId,
                    auditoriumNumber = x.auditoriumNumber,
                    movieFormatName = x.movie_format_info_entity.movieFormatName,
                    cinemaName = x.cinema_info_entity.cinemaName,
                    totalSeats = x.seats_info_entity.Count,
                    seatsInfos = x.seats_info_entity.Select(x => new req_seats_auditorium_dto
                    {
                        seatNumber = x.seatNumber,
                        coordX = x.coordX,
                        coordY = x.coordY,
                        colIndex = x.colIndex,
                        rowIndex = x.rowIndex,
                    }).ToList()
                }).ToListAsync();

            return new base_reponse<List<get_res_auditorium_dto>>()
            {
                data = getData,
                isSuccess = true,
                message = "Get auditorium completed"
            };
        }
        catch (app_exception)
        {
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, ex.Message);
            throw system_exception.system_exception_caller();
        }
    }


    public async Task<base_reponse<get_res_auditorium_dto>> getById(Guid id)
    {
        try
        {
            var getRawData = await _dbContext.auditorium_info_entity
                .FirstOrDefaultAsync(x =>
                    x.createdByUserId.Equals(Guid.Parse(_httpContextAccessor.HttpContext.User.FindFirst(ClaimTypes.Sid)
                        .Value)));

            if (getRawData == null)
            {
                throw new app_exception("Error : Can not find auditorium with id: " + id , 404 , "NOTFOUND01");
            }
            else
            {
                var getResult = new get_res_auditorium_dto()
                {
                    auditoriumId = getRawData.auditoriumId,
                    auditoriumNumber = getRawData.auditoriumNumber,
                    movieFormatName = getRawData.movie_format_info_entity.movieFormatName,
                    cinemaName = getRawData.cinema_info_entity.cinemaName,
                    totalSeats = getRawData.seats_info_entity.Count,
                    seatsInfos = getRawData.seats_info_entity.Select(x => new req_seats_auditorium_dto()
                    {
                        seatNumber = x.seatNumber,
                        coordX = x.coordX,
                        coordY = x.coordY,
                        colIndex = x.colIndex,
                        rowIndex = x.rowIndex,
                    }).ToList()
                };
        

                return new base_reponse<get_res_auditorium_dto>()
                {
                    data = getResult,
                    isSuccess = true,
                    message = "Get auditorium completed"
                };   
            }
        }
        catch (app_exception)
        {
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, ex.Message);
            throw system_exception.system_exception_caller();
        }
    }

    public async Task<base_reponse<List<get_res_auditorium_dto>>> getByEntityName(string name)
    {
        return null!;
    }
}