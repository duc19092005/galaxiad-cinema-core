using Shared.Exceptions;
using Shared.Enums;
using Shared.Localization;
using Shared.Utils;
using BusinessLayer.Dtos;
using BusinessLayer.Dtos.FacilitiesManager.Cinemas.Requests;
using BusinessLayer.Interfaces.IBehaviors;
using BusinessLayer.Services.Admin.Audit;
using BusinessLayer.Services.IdentityAccess;
using BusinessLayer.Validators;
using Microsoft.Extensions.Logging;
using BusinessLayer.Entities.CinemaInfos;
using BusinessLayer.Entities.MovieInfos;
using BusinessLayer.Entities.UserInfos;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Shared.Interfaces.Persistence;

namespace BusinessLayer.UseCases.FacilitiesManager.Cinemas;

public class FacilitiesManagerWriteCinemaUseCase : IWriteBehavior<AddCinemaReqDto, EditCinemaReqDto, string>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ILogger<FacilitiesManagerWriteCinemaUseCase> _logger;
    private readonly IUserContextService _userContext;
    private readonly AuditLogService _auditLogService;

    public FacilitiesManagerWriteCinemaUseCase(IUnitOfWork unitOfWork,
        ILogger<FacilitiesManagerWriteCinemaUseCase> logger,
        IUserContextService userContext,
        AuditLogService auditLogService)
    {
        _unitOfWork = unitOfWork;
        this._logger = logger;
        _userContext = userContext;
        _auditLogService = auditLogService;
    }

    public async Task<BaseResponse<string>> AddItem(AddCinemaReqDto request)
    {
        Guid userId = GetUserId();
        
        var validationErrors = new List<string>();
        var cinemas = _unitOfWork.Repository<CinemaInfoEntity>().Query();

        if (CinemaValidate.ValidateCinemaName(null, request.CinemaName, cinemas))
        {
            validationErrors.Add(Messages.Cinema.AlreadyExistsName(request.CinemaName));
        }

        if (CinemaValidate.ValidateCinemaDescription(null, request.CinemaDescription, cinemas))
        {
            validationErrors.Add(Messages.Cinema.AlreadyExistsDescription(request.CinemaDescription));
        }

        if (CinemaValidate.ValidateCinemaLocation(null, request.CinemaLocation, cinemas))
        {
            validationErrors.Add(Messages.Cinema.AlreadyExistsLocation(request.CinemaLocation));
        }

        if (CinemaValidate.ValidateCinemaHotLineNumber(null, request.CinemaHotlineNumber, cinemas))
        {
            validationErrors.Add(Messages.Cinema.AlreadyExistsHotline(request.CinemaHotlineNumber));
        }

        if (validationErrors.Any())
        {
            throw new BadRequestException(validationErrors, "C01");
        }

        try
        {
            Guid cinemaId = Guid.NewGuid();
            var activeAt = DateTimeHelper.NormalizeIncoming(request.ActiveAt) ?? DateTime.UtcNow;
            var isAdmin = _userContext.IsInRole("Admin");
            var newCinemaInfoEntity = new CinemaInfoEntity()
            {
                CinemaId = cinemaId,
                CinemaName = request.CinemaName,
                CinemaDescription = request.CinemaDescription,
                CinemaLocation = request.CinemaLocation,
                CinemaCity = request.CinemaCity,
                CinemaHotLineNumber = request.CinemaHotlineNumber,
                Latitude = request.Latitude,
                Longitude = request.Longitude,
                CreatedAt = DateTime.UtcNow,
                CreatedByUserId = userId,
                // Admin creates → no auto-assign; FacilitiesManager/others → assign self
                FacilitiesManagerId = isAdmin ? null : userId,
                TheaterManagerId = isAdmin ? null : userId,
                ActiveAt = activeAt,
                IsActive = activeAt < DateTime.UtcNow
            };
            await _unitOfWork.Repository<CinemaInfoEntity>().AddAsync(newCinemaInfoEntity);
            await _auditLogService.WriteAsync(
                "Create",
                "Cinema",
                cinemaId,
                request.CinemaName,
                $"Created cinema {request.CinemaName}.",
                cinemaId);
            await _unitOfWork.SaveChangesAsync();

            return new BaseResponse<string>()
            {
                IsSuccess = true,
                Data = null,
                Message = Messages.Cinema.AddCompleted
            };
        }
        catch (AppException)
        {
            throw;
        }
        catch (Exception e)
        {
            _logger.LogError("There a Error with System : {0}", e.Message);
            throw new AppException(Messages.System.Error, StatusCodes.Status500InternalServerError, "S01");
        }
    }

    public async Task<BaseResponse<string>> UpdateItem(Guid itemId, EditCinemaReqDto request)
    {
        // Find the cinema Infos
        try
        {
            var userId = GetUserId();
            var isAdmin = _userContext.IsInRole("Admin");
            var cinemas = _unitOfWork.Repository<CinemaInfoEntity>().Query();
            var findCinema = await cinemas.FirstOrDefaultAsync(x =>
                x.CinemaId.Equals(itemId) &&
                (isAdmin || x.FacilitiesManagerId == userId || x.TheaterManagerId == userId));
            if (findCinema == null)
            {
                throw new AppException(Messages.Cinema.NotFoundById(itemId),
                    StatusCodes.Status404NotFound, "C01");
            }
            else
            {
                // Business Rule: Block edit if cinema has Booked bookings
                var hasBookedBookings = await HasBookedBookingForCinema(itemId);
                if (hasBookedBookings)
                {
                    throw new AppException(
                        Messages.Cinema.CannotEditActiveBookings,
                        StatusCodes.Status409Conflict,
                        "C02");
                }

                var validationErrors = new List<string>();

                bool checkExitsDescription = request.CinemaDescription != null &&
                                             CinemaValidate.ValidateCinemaDescription(findCinema.CinemaId,
                                                 request.CinemaDescription, cinemas);

                bool checkExitsCinemaName = request.CinemaName != null &&
                                            CinemaValidate.ValidateCinemaName(findCinema.CinemaId, request.CinemaName,
                                                cinemas);

                bool checkExitsHotlineNumber = request.CinemaHotlineNumber != null &&
                                               CinemaValidate.ValidateCinemaHotLineNumber(findCinema.CinemaId,
                                                   request.CinemaHotlineNumber, cinemas);

                bool checkExitsLocation = request.CinemaLocation != null &&
                                          CinemaValidate.ValidateCinemaLocation(findCinema.CinemaId,
                                              request.CinemaLocation, cinemas);

                if (checkExitsDescription)
                {
                    validationErrors.Add(Messages.Cinema.AlreadyExistsDescription(request.CinemaDescription!));
                }

                if (checkExitsCinemaName)
                {
                    validationErrors.Add(Messages.Cinema.AlreadyExistsName(request.CinemaName!));
                }

                if (checkExitsHotlineNumber)
                {
                    validationErrors.Add(Messages.Cinema.AlreadyExistsHotline(request.CinemaHotlineNumber!));
                }

                if (checkExitsLocation)
                {
                    validationErrors.Add(Messages.Cinema.AlreadyExistsLocation(request.CinemaLocation!));
                }

                if (validationErrors.Any())
                {
                    throw new BadRequestException(validationErrors, "C01");
                }

                findCinema.CinemaName = (!string.IsNullOrWhiteSpace(request.CinemaName)
                                         && !CinemaValidate.ValidateCinemaName(findCinema.CinemaId, request.CinemaName,
                                             cinemas))
                    ? request.CinemaName
                    : findCinema.CinemaName;

                findCinema.CinemaDescription = (!string.IsNullOrWhiteSpace(request.CinemaDescription)
                                                && !CinemaValidate.ValidateCinemaDescription(findCinema.CinemaId,
                                                    request.CinemaDescription, cinemas))
                    ? request.CinemaDescription
                    : findCinema.CinemaDescription;

                findCinema.CinemaHotLineNumber = (!string.IsNullOrWhiteSpace(request.CinemaHotlineNumber)
                                                  && !CinemaValidate.ValidateCinemaHotLineNumber(findCinema.CinemaId,
                                                      request.CinemaHotlineNumber, cinemas))
                    ? request.CinemaHotlineNumber
                    : findCinema.CinemaHotLineNumber;

                findCinema.CinemaLocation = (!string.IsNullOrWhiteSpace(request.CinemaLocation)
                                             && !CinemaValidate.ValidateCinemaLocation(findCinema.CinemaId,
                                                 request.CinemaLocation, cinemas))
                    ? request.CinemaLocation
                    : findCinema.CinemaLocation;

                findCinema.CinemaCity = (!string.IsNullOrWhiteSpace(request.CinemaCity))
                    ? request.CinemaCity
                    : findCinema.CinemaCity;

                if (request.Latitude.HasValue) findCinema.Latitude = request.Latitude.Value;
                if (request.Longitude.HasValue) findCinema.Longitude = request.Longitude.Value;

                findCinema.ActiveAt = DateTimeHelper.NormalizeIncoming(request.ActiveAt) ?? findCinema.ActiveAt;

                findCinema.UpdatedAt = DateTime.UtcNow;

                findCinema.IsActive = findCinema.ActiveAt < DateTime.UtcNow;

                findCinema.UpdatedByUserId = userId;

                await _auditLogService.WriteAsync(
                    "Update",
                    "Cinema",
                    findCinema.CinemaId,
                    findCinema.CinemaName,
                    $"Updated cinema {findCinema.CinemaName}.",
                    findCinema.CinemaId);

                await _unitOfWork.SaveChangesAsync();

                return new BaseResponse<string>()
                {
                    IsSuccess = true,
                    Data = null,
                    Message = Messages.Cinema.UpdateCompleted
                };
            }
        }
        catch (AppException)
        {
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex.Message);
            throw new AppException(Messages.System.Error, StatusCodes.Status500InternalServerError, "S01");
        }
    }

    public async Task<BaseResponse<string>> DeleteItem(Guid itemId)
    {
        try
        {
            var userId = GetUserId();
            var isAdmin = _userContext.IsInRole("Admin");
            var findCinema = await _unitOfWork.Repository<CinemaInfoEntity>().Query().FirstOrDefaultAsync(x =>
                x.CinemaId.Equals(itemId) &&
                (isAdmin || x.FacilitiesManagerId == userId || x.TheaterManagerId == userId));

            if (findCinema == null)
            {
                throw new AppException(Messages.Cinema.NotFoundById(itemId),
                    StatusCodes.Status404NotFound, "C01");
            }

            // Soft delete cinema
            findCinema.IsDeleted = true;
            findCinema.DeletedAt = DateTime.UtcNow;
            findCinema.DeletedByUserId = userId;

            // Soft delete all related auditoriums
            var auditoriums = await _unitOfWork.Repository<AuditoriumInfoEntities>().Query()
                .Where(a => a.CinemaId == itemId && !a.IsDeleted)
                .ToListAsync();

            foreach (var aud in auditoriums)
            {
                aud.IsDeleted = true;
                aud.DeletedAt = DateTime.UtcNow;
                aud.DeletedByUserId = userId;

                // Soft delete all related schedules
                var schedules = await _unitOfWork.Repository<MovieScheduleInfoEntity>().Query()
                    .Where(s => s.AuditoriumId == aud.AuditoriumId && !s.IsDeleted)
                    .ToListAsync();

                foreach (var schedule in schedules)
                {
                    // Cancel pending orders for this schedule
                    await CancelPendingOrdersForSchedule(schedule.MovieScheduleInfoId);

                    schedule.IsDeleted = true;
                    schedule.DeletedAt = DateTime.UtcNow;
                    schedule.DeletedByUserId = userId;
                }
            }

            await _auditLogService.WriteAsync(
                "Delete",
                "Cinema",
                itemId,
                findCinema.CinemaName,
                $"Soft deleted cinema {findCinema.CinemaName} with {auditoriums.Count} auditoriums.",
                itemId);

            await _unitOfWork.SaveChangesAsync();

            return new BaseResponse<string>()
            {
                IsSuccess = true,
                Data = null,
                Message = Messages.Cinema.DeleteCompleted
            };
        }
        catch (AppException)
        {
            throw;
        }
        catch (Exception e)
        {
            _logger.LogError("There a Error with System : {0}", e.Message);
            throw new AppException(Messages.System.Error, StatusCodes.Status500InternalServerError, "S01");
        }
    }

    private Guid GetUserId()
    {
        return _userContext.GetUserId();
    }

    private async Task<bool> HasBookedBookingForCinema(Guid cinemaId)
    {
        return await _unitOfWork.Repository<OrderDetailsInfo>().Query()
            .AnyAsync(od => od.MovieScheduleInfoEntity.AuditoriumInfoEntities != null
                            && od.MovieScheduleInfoEntity.AuditoriumInfoEntities.CinemaId == cinemaId
                            && od.OrderInfoEntity.OrderStatus == OrderStatusEnum.Booked
                            && !od.MovieScheduleInfoEntity.IsDeleted);
    }

    private async Task CancelPendingOrdersForSchedule(Guid scheduleId)
    {
        var pendingOrders = await _unitOfWork.Repository<OrderInfoEntity>().Query()
            .Where(o => o.OrderDetailsInfo.Any(od => od.MovieScheduleId == scheduleId)
                        && o.OrderStatus == OrderStatusEnum.Pending)
            .ToListAsync();

        foreach (var order in pendingOrders)
        {
            order.OrderStatus = OrderStatusEnum.Canceled;
        }
    }

}
