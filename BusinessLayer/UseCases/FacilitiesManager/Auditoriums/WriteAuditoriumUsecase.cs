using Shared.Exceptions;
using Shared.Localization;
using BusinessLayer.Dtos;
using BusinessLayer.Dtos.FacilitiesManager.Auditoriums;
using BusinessLayer.Interfaces.IBehaviors;
using BusinessLayer.Services.IdentityAccess;
using BusinessLayer.Validators;
using DataAccess;
using DataAccess.Entities.CinemaInfos;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Shared.Utils;

namespace BusinessLayer.UseCases.FacilitiesManager.Auditoriums;

public class FacilitiesManagerWriteAuditoriumUseCase : IWriteBehavior<AddReqAuditoriumDto, EditReqAuditoriumDto , string>
{
    private readonly CinemaDbContext _dbContext;
    
    private readonly ILogger<FacilitiesManagerWriteAuditoriumUseCase> _logger;

    private readonly IUserContextService _userContextService;


    public FacilitiesManagerWriteAuditoriumUseCase(CinemaDbContext dbContext
    ,  ILogger<FacilitiesManagerWriteAuditoriumUseCase> logger ,
    IUserContextService userContextService)
    {
        this._dbContext = dbContext;
        this._logger = logger;
        this._userContextService = userContextService;
    }
    public async Task<BaseResponse<string>> AddItem(AddReqAuditoriumDto request)
    {
        var transactions = await _dbContext.Database.BeginTransactionAsync();
        try
        {
            // Add auditorium
            Guid userId = _userContextService.GetUserId();
            if (AuditoriumValidate.IsDuplicateAuditoriumNumber(_dbContext, null, request.AuditoriumNumber,
                    request.CinemaId))
            {
                throw new AppException(Messages.Auditorium.AlreadyExists, 400, "D01");
            }
            // Add Auditorimum
            Guid generateAuditoriumId = Guid.NewGuid();

            var newAuditoriumInfo = new AuditoriumInfoEntities()
            {
                AuditoriumId = generateAuditoriumId,
                CinemaId = request.CinemaId,
                AuditoriumNumber = request.AuditoriumNumber,
                MovieFormatId = request.MovieFormatId,
                CreatedAt = DateTime.Now,
                CreatedByUserId = userId
            };

            await _dbContext.AuditoriumInfoEntities.AddAsync(newAuditoriumInfo);

            List<SeatsInfoEntity> seatsInfoEntities = new List<SeatsInfoEntity>();
            foreach (var items in request.AddReqSeatsAuditoriumDto)
            {
                seatsInfoEntities.Add(new SeatsInfoEntity()
                {
                    SeatId = Guid.NewGuid(),
                    SeatNumber = items.SeatNumber,
                    CoordX = items.CoordX,
                    CoordY = items.CoordY,
                    ColIndex = items.ColIndex,
                    RowIndex = items.RowIndex,
                    AuditoriumId = generateAuditoriumId
                });
            }

            await _dbContext.SeatsInfoEntity.AddRangeAsync(seatsInfoEntities);
            
            await _dbContext.SaveChangesAsync();
            
            await transactions.CommitAsync();

            return new BaseResponse<string>()
            {
                IsSuccess = true,
                Message = Messages.Auditorium.AddCompleted
            };
        }
        catch (AppException e)
        {
            await transactions.RollbackAsync();
            throw;
        }
        catch (Exception e)
        {
            await transactions.RollbackAsync();
            _logger.LogError("Database Error : Error Detail {0}" , e.Message);
            throw CustomSystemException.SystemExceptionCaller();
        }
    }

    public async Task<BaseResponse<string>> UpdateItem(Guid itemId, EditReqAuditoriumDto request)
    {
        var transactions = await _dbContext.Database.BeginTransactionAsync();
        try
        {
            // Check xem co duplicate ten phong khong
            var getUserId = _userContextService.GetUserId();
            
            if (request.AuditoriumNumber != null && AuditoriumValidate.IsDuplicateAuditoriumNumber(_dbContext, itemId,
                    request.AuditoriumNumber,
                    request.CinemaId))
            {
                throw new AppException(Messages.Auditorium.DuplicateNumber, 400, "D01");
            }

            var findAuditorium = await _dbContext.AuditoriumInfoEntities.FirstOrDefaultAsync
                (a => a.AuditoriumId == itemId);
            
            if (findAuditorium == null)
            {
                throw new NotFoundException(Messages.Auditorium.NotFound);
            }
            
            findAuditorium.AuditoriumNumber = request.AuditoriumNumber ?? findAuditorium.AuditoriumNumber;
            findAuditorium.MovieFormatId = request.MovieFormatId ?? findAuditorium.MovieFormatId;
            findAuditorium.CinemaId = request.CinemaId ?? findAuditorium.CinemaId;
            findAuditorium.CreatedAt = DateTime.Now;
            findAuditorium.UpdatedAt = DateTime.Now;
            findAuditorium.UpdatedByUserId = getUserId;

            if (!(request.AddReqSeatsAuditoriumDto == null || request.AddReqSeatsAuditoriumDto.Count <= 0))
            {
                // Did Nothing
            }

            await _dbContext.SeatsInfoEntity
                .Where(x => x.AuditoriumId == itemId)
                .ExecuteDeleteAsync();

            var newSeatsInfos = request.AddReqSeatsAuditoriumDto?.Select(item => new SeatsInfoEntity()
            {
                SeatId = Guid.NewGuid(),
                SeatNumber = item.SeatNumber,
                CoordX = item.CoordX,
                CoordY = item.CoordY,
                ColIndex = item.ColIndex,
                RowIndex = item.RowIndex,
                AuditoriumId = itemId
            }).ToList();

            if (newSeatsInfos != null)
            {
                await _dbContext.SeatsInfoEntity.AddRangeAsync(newSeatsInfos);
            }
            await _dbContext.SaveChangesAsync();
            await  transactions.CommitAsync();

            return new BaseResponse<string>()
            {
                IsSuccess = true,
                Message = Messages.Auditorium.UpdateCompleted,
                Data = null
            };
        }
        catch (AppException)
        {
            await transactions.RollbackAsync();
            throw;
        }
        catch (Exception e)
        {
            await transactions.RollbackAsync();
            throw CustomSystemException.SystemExceptionCaller();
        }
    }

    public Task<BaseResponse<string>> DeleteItem(Guid itemId)
    {
        return null!;
    }
}

