using Shared.Exceptions;
using Shared.Localization;
using Shared.Validation;
using BusinessLayer.Dtos;
using BusinessLayer.Dtos.FacilitiesManager.Auditoriums.Requests;
using BusinessLayer.Interfaces.IBehaviors;
using BusinessLayer.Services.Admin.Audit;
using BusinessLayer.Services.IdentityAccess;
using BusinessLayer.Validators;
using DataAccess;
using DataAccess.Entities.CinemaInfos;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace BusinessLayer.UseCases.FacilitiesManager.Auditoriums;

public class FacilitiesManagerWriteAuditoriumUseCase : IWriteBehavior<AddReqAuditoriumDto, EditReqAuditoriumDto , string>
{
    private readonly CinemaDbContext _dbContext;
    
    private readonly ILogger<FacilitiesManagerWriteAuditoriumUseCase> _logger;

    private readonly IUserContextService _userContextService;
    private readonly AuditLogService _auditLogService;


    public FacilitiesManagerWriteAuditoriumUseCase(CinemaDbContext dbContext
    ,  ILogger<FacilitiesManagerWriteAuditoriumUseCase> logger ,
    IUserContextService userContextService,
    AuditLogService auditLogService)
    {
        this._dbContext = dbContext;
        this._logger = logger;
        this._userContextService = userContextService;
        _auditLogService = auditLogService;
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
                CreatedAt = DateTime.Now,
                CreatedByUserId = userId
            };

            var listsAuditoriumFormat = request.MovieFormatId.Select(x => new AuditoriumFormatInfos()
            {
                FormatId = x,
                AuditoriumId = generateAuditoriumId
            });

            await _dbContext.AuditoriumFormatInfosEntity.AddRangeAsync(listsAuditoriumFormat);

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
            await _auditLogService.WriteAsync(
                "Create",
                "Auditorium",
                generateAuditoriumId,
                request.AuditoriumNumber,
                $"Created auditorium {request.AuditoriumNumber}.",
                request.CinemaId);
            
            await _dbContext.SaveChangesAsync();
            
            await transactions.CommitAsync();

            return new BaseResponse<string>()
            {
                IsSuccess = true,
                Message = Messages.Auditorium.AddCompleted
            };
        }
        catch (Exception e)
        {
            await transactions.RollbackAsync();

            if (e is AppException)
            {
                throw;
            }
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
            
            // Business Rule: Block edit if auditorium has Booked bookings
            var hasBookedBookings = await _dbContext.HasBookedBookingForAuditorium(itemId);
            if (hasBookedBookings)
            {
                throw new AppException(
                    Messages.Auditorium.CannotEditActiveBookings,
                    409,
                    "D02");
            }

            // Business Rule: Block seat edit if any seats have been used
            if (request.AddReqSeatsAuditoriumDto != null && request.AddReqSeatsAuditoriumDto.Count > 0)
            {
                var hasAnyBookings = await _dbContext.HasAnyBookingForAuditoriumSeats(itemId);
                if (hasAnyBookings)
                {
                    throw new AppException(
                        Messages.Auditorium.CannotEditHasOrderHistory,
                        409,
                        "D03");
                }
            }

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
            
            if (request.FormatInfos.Any())
            {
                var formats = _dbContext.AuditoriumFormatInfosEntity.Where(x => x.AuditoriumId.Equals(itemId));
                _dbContext.AuditoriumFormatInfosEntity.RemoveRange(formats);
                var newLists = request.FormatInfos.Select(x => new AuditoriumFormatInfos
                {
                    AuditoriumId = itemId,
                    FormatId = x
                });
                await _dbContext.AuditoriumFormatInfosEntity.AddRangeAsync(newLists);
                await _dbContext.SaveChangesAsync();
            }
            
            findAuditorium.AuditoriumNumber = request.AuditoriumNumber ?? findAuditorium.AuditoriumNumber;
            findAuditorium.CinemaId = request.CinemaId ?? findAuditorium.CinemaId;
            findAuditorium.CreatedAt = DateTime.Now;
            findAuditorium.UpdatedAt = DateTime.Now;
            findAuditorium.UpdatedByUserId = getUserId;

            if (!(request.AddReqSeatsAuditoriumDto == null || request.AddReqSeatsAuditoriumDto.Count <= 0))
            {
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
            }

            await _auditLogService.WriteAsync(
                "Update",
                "Auditorium",
                itemId,
                findAuditorium.AuditoriumNumber,
                $"Updated auditorium {findAuditorium.AuditoriumNumber}.",
                findAuditorium.CinemaId);
            await _dbContext.SaveChangesAsync();
            await  transactions.CommitAsync();

            return new BaseResponse<string>()
            {
                IsSuccess = true,
                Message = Messages.Auditorium.UpdateCompleted,
                Data = null
            };
        }
        catch (Exception e)
        {
            await transactions.RollbackAsync();
            if (e is AppException)
            {
                throw;
            }
            throw CustomSystemException.SystemExceptionCaller();
        }
    }

    public async Task<BaseResponse<string>> DeleteItem(Guid itemId)
    {
        var transactions = await _dbContext.Database.BeginTransactionAsync();
        try
        {
            var userId = _userContextService.GetUserId();

            var findAuditorium = await _dbContext.AuditoriumInfoEntities
                .FirstOrDefaultAsync(a => a.AuditoriumId == itemId && !a.IsDeleted);

            if (findAuditorium == null)
            {
                throw new NotFoundException(Messages.Auditorium.NotFound);
            }

            // Business Rule: Block delete if auditorium has Booked bookings
            var hasBookedBookings = await _dbContext.HasBookedBookingForAuditorium(itemId);
            if (hasBookedBookings)
            {
                throw new AppException(
                    Messages.Auditorium.CannotEditActiveBookings,
                    409,
                    "D02");
            }

            // Soft delete auditorium
            findAuditorium.IsDeleted = true;
            findAuditorium.DeletedAt = DateTime.UtcNow;
            findAuditorium.DeletedByUserId = userId;

            // Soft delete related schedules and cancel pending orders
            var schedules = await _dbContext.MovieScheduleInfoEntity
                .Where(s => s.AuditoriumId == itemId && !s.IsDeleted)
                .ToListAsync();

            foreach (var schedule in schedules)
            {
                await _dbContext.CancelPendingOrdersForSchedule(schedule.ScheduleId);

                schedule.IsDeleted = true;
                schedule.DeletedAt = DateTime.UtcNow;
                schedule.DeletedByUserId = userId;
            }

            await _auditLogService.WriteAsync(
                "Delete",
                "Auditorium",
                itemId,
                findAuditorium.AuditoriumNumber,
                $"Soft deleted auditorium {findAuditorium.AuditoriumNumber} with {schedules.Count} schedules.",
                findAuditorium.CinemaId);

            await _dbContext.SaveChangesAsync();
            await transactions.CommitAsync();

            return new BaseResponse<string>()
            {
                IsSuccess = true,
                Message = Messages.Auditorium.DeleteCompleted,
                Data = null
            };
        }
        catch (Exception e)
        {
            await transactions.RollbackAsync();
            if (e is AppException)
            {
                throw;
            }
            throw CustomSystemException.SystemExceptionCaller();
        }
    }
}
