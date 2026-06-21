using System;
using System.Threading.Tasks;
using Cinema.Application.Exceptions;
using Cinema.Domain.Localization;
using Cinema.Application.Dtos;
using Cinema.Application.Interfaces;
using Cinema.Application.Interfaces.Facilities;
using Microsoft.Extensions.Logging;
using Microsoft.AspNetCore.Http;
using Cinema.Domain.Interfaces.Persistence;

namespace Cinema.Application.UseCases.FacilitiesManager.Cinemas;

public class DeleteCinemaUseCase
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICinemaRepository _repository;
    private readonly ILogger<DeleteCinemaUseCase> _logger;
    private readonly IUserContextService _userContext;
    private readonly IAuditLogService _auditLogService;

    public DeleteCinemaUseCase(
        ICinemaRepository repository,
        ILogger<DeleteCinemaUseCase> logger,
        IUserContextService userContext,
        IAuditLogService auditLogService,
        IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
        _repository = repository;
        _logger = logger;
        _userContext = userContext;
        _auditLogService = auditLogService;
    }

    public async Task<BaseResponse<string>> ExecuteAsync(Guid itemId)
    {
        try
        {
            var userId = _userContext.GetUserId();
            var isAdmin = _userContext.IsInRole("Admin");
            var findCinema = await _repository.GetCinemaEntityByIdAsync(itemId, userId, isAdmin);

            if (findCinema == null)
            {
                throw new AppException(Messages.Cinema.NotFoundById(itemId),
                    StatusCodes.Status404NotFound, "C01");
            }

            findCinema.IsDeleted = true;
            findCinema.DeletedAt = DateTime.UtcNow;
            findCinema.DeletedByUserId = userId;

            var auditoriums = await _repository.GetActiveAuditoriumsByCinemaIdAsync(itemId);
            foreach (var aud in auditoriums)
            {
                aud.IsDeleted = true;
                aud.DeletedAt = DateTime.UtcNow;
                aud.DeletedByUserId = userId;

                var schedules = await _repository.GetActiveSchedulesByAuditoriumIdAsync(aud.AuditoriumId);
                foreach (var schedule in schedules)
                {
                    await _repository.CancelPendingOrdersForScheduleAsync(schedule.MovieScheduleInfoId);

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

            return new BaseResponse<string>
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
}
