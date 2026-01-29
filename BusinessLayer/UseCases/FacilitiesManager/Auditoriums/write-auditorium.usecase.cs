using System.Security.Claims;
using Backend.Shard.Exceptions;
using BussinessLayer.Dtos;
using BussinessLayer.Dtos.facilities_manager.Auditoriums;
using BussinessLayer.Interfaces.i_Behaviors;
using BussinessLayer.Validates;
using DataAccess;
using DataAccess.Entities.Cinema_Infos;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace BussinessLayer.Use_cases.facilities_manager.Auditoriums;

public class facilitiesManagerWriteAuditoriumUseCase : IWriteBehavior<add_req_auditorium_dto, edit_req_auditorium_dto , string>
{
    private readonly cinemaDbContext _dbContext;
    
    private readonly IHttpContextAccessor  _httpContextAccessor;
    
    private readonly ILogger<facilitiesManagerWriteAuditoriumUseCase> _logger;


    public facilitiesManagerWriteAuditoriumUseCase(cinemaDbContext _dbContext
    ,  IHttpContextAccessor httpContextAccessor , ILogger<facilitiesManagerWriteAuditoriumUseCase> _logger)
    {
        this._dbContext = _dbContext;
        this._httpContextAccessor = httpContextAccessor;
        this._logger = _logger;
    }
    public async Task<baseResponse<string>> AddItem(add_req_auditorium_dto request)
    {
        var transactions = await _dbContext.Database.BeginTransactionAsync();
        try
        {
            // Add auditorium
            if (Validates.auditoriumValidate.IsDuplicateAuditoriumNumber(_dbContext, null, request.AuditoriumNumber,
                    request.cinemaId))
            {
                throw new appException("Error : Auditorium already exists", 400, "D01");
            }
            // Add Auditorimum
            Guid generateAuditoriumId = Guid.NewGuid();

            var newAuditoriumInfo = new auditorium_info_entity()
            {
                auditoriumId = generateAuditoriumId,
                cinemaId = request.cinemaId,
                auditoriumNumber = request.AuditoriumNumber,
                movieFormatId = request.movieFormatId,
                createdAt = DateTime.Now,
                createdByUserId = Guid.Parse(_httpContextAccessor.HttpContext.User.FindFirst(
                    ClaimTypes.Sid)?.Value)
            };

            await _dbContext.auditorium_info_entity.AddAsync(newAuditoriumInfo);

            List<seats_info_entity> seatsInfoEntities = new List<seats_info_entity>();
            foreach (var items in request.add_req_seats_auditorium_dto)
            {
                seatsInfoEntities.Add(new seats_info_entity()
                {
                    seatId = Guid.NewGuid(),
                    seatNumber = items.seatNumber,
                    coordX = items.coordX,
                    coordY = items.coordY,
                    colIndex = items.colIndex,
                    rowIndex = items.rowIndex,
                    auditoriumId = generateAuditoriumId
                });
            }

            await _dbContext.seats_info_entity.AddRangeAsync(seatsInfoEntities);
            
            await _dbContext.SaveChangesAsync();
            
            await transactions.CommitAsync();

            return new baseResponse<string>()
            {
                isSuccess = true,
                message = "Add Auditorium completed"
            };
        }
        catch (appException e)
        {
            await transactions.RollbackAsync();
            throw;
        }
        catch (Exception e)
        {
            await transactions.RollbackAsync();
            _logger.LogError("Database Error : Error Detail {0}" , e.Message);
            throw systemException.SystemExceptionCaller();
        }
    }

    public async Task<baseResponse<string>> UpdateItem(Guid itemId, edit_req_auditorium_dto request)
    {
        var transactions = await _dbContext.Database.BeginTransactionAsync();
        try
        {
            // Check xem co duplicate ten phong khong
            var getUserId = Guid.Parse(_httpContextAccessor.HttpContext.User.FindFirst(
                ClaimTypes.Sid)?.Value);
            
            if (request.auditoriumNumber != null && auditoriumValidate.IsDuplicateAuditoriumNumber(_dbContext, itemId,
                    request.auditoriumNumber,
                    request.cinemaId))
            {
                throw new appException("Duplicate Auditorium Number", 400, "D01");
            }

            var findAuditorium = await _dbContext.auditorium_info_entity.FirstOrDefaultAsync
                (a => a.auditoriumId == itemId);
            
            if (findAuditorium == null)
            {
                throw new notFoundException("Auditorium Not Found");
            }
            
            findAuditorium.auditoriumNumber = request.auditoriumNumber ?? findAuditorium.auditoriumNumber;
            findAuditorium.movieFormatId = request.movieFormatId ?? findAuditorium.movieFormatId;
            findAuditorium.cinemaId = request.cinemaId ?? findAuditorium.cinemaId;
            findAuditorium.createdAt = DateTime.Now;
            findAuditorium.updatedAt = DateTime.Now;
            findAuditorium.updatedByUserId = getUserId;

            if (!(request.add_req_seats_auditorium_dto == null || request.add_req_seats_auditorium_dto.Count <= 0))
            {
                // Did Nothing
            }

            await _dbContext.seats_info_entity
                .Where(x => x.auditoriumId == itemId)
                .ExecuteDeleteAsync();

            var newSeatsInfos = request.add_req_seats_auditorium_dto.Select(item => new seats_info_entity()
            {
                seatId = Guid.NewGuid(),
                seatNumber = item.seatNumber,
                coordX = item.coordX,
                coordY = item.coordY,
                colIndex = item.colIndex,
                rowIndex = item.rowIndex,
                auditoriumId = itemId
            }).ToList();

            await _dbContext.seats_info_entity.AddRangeAsync(newSeatsInfos);
            await _dbContext.SaveChangesAsync();
            await  transactions.CommitAsync();

            return new baseResponse<string>()
            {
                isSuccess = true,
                message = "Update Auditorium completed",
                data = null
            };
        }
        catch (appException)
        {
            await transactions.RollbackAsync();
            throw;
        }
        catch (Exception e)
        {
            await transactions.RollbackAsync();
            throw systemException.SystemExceptionCaller();
        }
    }

    public Task<baseResponse<string>> DeleteItem(Guid itemId)
    {
        return null!;
    }
}