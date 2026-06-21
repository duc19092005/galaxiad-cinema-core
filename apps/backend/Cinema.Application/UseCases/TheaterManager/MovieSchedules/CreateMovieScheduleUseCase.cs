using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using Cinema.Application.Dtos;
using Cinema.Application.Dtos.TheaterManager.MovieSchedules.Requests;
using Cinema.Application.Interfaces;
using Cinema.Application.Interfaces.IThirdPersonServices;
using Cinema.Application.Interfaces.TheaterManager;
using Cinema.Domain.Entities.MovieInfos;
using Cinema.Domain.Enums;
using Cinema.Application.Exceptions;
using Cinema.Domain.Localization;
using Cinema.Domain.Utils;
using Cinema.Domain.Interfaces.Persistence;

namespace Cinema.Application.UseCases.TheaterManager.MovieSchedules;

public class CreateMovieScheduleUseCase
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMovieScheduleRepository _repository;
    private readonly ILogger<CreateMovieScheduleUseCase> _logger;
    private readonly IUserContextService _userContextService;
    private readonly IAuditLogService _auditLogService;
    private readonly IBackgroundJobScheduler _jobScheduler;

    public CreateMovieScheduleUseCase(
        IMovieScheduleRepository repository,
        ILogger<CreateMovieScheduleUseCase> logger,
        IUserContextService userContextService,
        IAuditLogService auditLogService,
        IBackgroundJobScheduler jobScheduler,
        IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
        _repository = repository;
        _logger = logger;
        _userContextService = userContextService;
        _auditLogService = auditLogService;
        _jobScheduler = jobScheduler;
    }

    public async Task<BaseResponse<string>> ExecuteAsync(TheaterManagerAddMovieSchedulesRequest request)
    {
        var getCurrentUserId = _userContextService.GetUserId();
        var isAdmin = _userContextService.IsInRole("Admin");

        var isAuditoriumExist = await _repository.IsAuditoriumExistForManagerAsync(request.AuditoriumId, getCurrentUserId, isAdmin);
            
        if (!isAuditoriumExist)
        {
            throw new NotFoundException(Messages.Schedule.AuditoriumNotFound);
        }

        var cinemaId = await _repository.GetCinemaIdByAuditoriumAsync(request.AuditoriumId);

        await using var transactions = await _unitOfWork.BeginTransactionAsync();

        try
        {
            NormalizeSlotTimes(request.Slots);
            var reqMovieIds = request.Slots.Select(x => x.MovieId).Distinct().ToList();
            
            var validMovieDictionary = await _repository.GetMoviesByIdsAsync(reqMovieIds);

            var validMovieFormats = (await _repository.GetMovieFormatRelationsAsync(reqMovieIds))
                .GroupBy(x => x.MovieId)
                .ToDictionary(x => x.Key, y => y.Select(f => f.FormatId).ToList());

            var allFormats = (await _repository.GetAllMovieFormatsAsync())
                .ToDictionary(x => x.MovieFormatId, x => x.MovieFormatName);

            // Kiểm tra phim đã được ủy quyền tại rạp chưa
            var authorizedMovies = await _repository.GetAuthorizedMovieIdsAsync(reqMovieIds, cinemaId);

            var proposedSlots = new List<MovieScheduleInfoEntity>();

            // Fetch existing schedules to skip duplicates
            var existingMatchSchedules = await _repository.GetExistingSchedulesForAuditoriumAsync(request.AuditoriumId, DateTime.MinValue, DateTime.MaxValue);

            foreach (var slot in request.Slots)
            {
                // check for exact match to skip
                var isAlreadyExist = existingMatchSchedules.Any(x => 
                    x.MovieId == slot.MovieId && 
                    x.MovieFormatId == slot.FormatId && 
                    x.StartTime == slot.StartedDate);
                
                if (isAlreadyExist) continue;

                if (!validMovieDictionary.TryGetValue(slot.MovieId, out var movie))
                {
                    throw new BadRequestException(Messages.Movie.IdNotExistOrInactive(slot.MovieId), "E01");
                }

                if (!authorizedMovies.Contains(slot.MovieId))
                {
                    throw new BadRequestException($"Phim '{movie.MovieName}' chưa được ủy quyền chiếu tại rạp này.", "E01");
                }

                if (!validMovieFormats.TryGetValue(slot.MovieId, out var movieFormat) || !movieFormat.Contains(slot.FormatId))
                {
                    var formatName = allFormats.TryGetValue(slot.FormatId, out var name) ? name : slot.FormatId.ToString();
                    throw new BadRequestException(Messages.MovieFormat.InvalidFormatForMovie(movie.MovieName, formatName), "E01");
                }

                if (slot.StartedDate < DateTime.UtcNow)
                {
                    throw new BadRequestException(Messages.Schedule.PastDateNotAllowed, "E01");
                }

                if (slot.StartedDate < movie.ActiveAt || slot.StartedDate.Date > movie.EndedDate.Date)
                {
                    throw new BadRequestException(Messages.Schedule.MovieAvailability(movie.MovieName, movie.ActiveAt.ToString("MM/dd/yyyy"), movie.EndedDate.ToString("MM/dd/yyyy")), "E01");
                }

                var endTime = slot.StartedDate.AddMinutes(movie.MovieDuration);

                proposedSlots.Add(new MovieScheduleInfoEntity
                {
                    MovieScheduleInfoId = Guid.NewGuid(),
                    MovieId = slot.MovieId,
                    AuditoriumId = request.AuditoriumId,
                    MovieFormatId = slot.FormatId,
                    StartTime = DateTimeHelper.NormalizeIncoming(slot.StartedDate),
                    EndedTime = DateTimeHelper.NormalizeIncoming(endTime),
                    ActiveAt = DateTimeHelper.NormalizeIncoming(slot.StartedDate),
                    CreatedByUserId = getCurrentUserId,
                    IsActive = DateTime.UtcNow >= DateTimeHelper.NormalizeIncoming(slot.StartedDate) && DateTime.UtcNow < DateTimeHelper.NormalizeIncoming(endTime),
                });
            }

            if (!proposedSlots.Any())
            {
                return new BaseResponse<string>()
                {
                    Message = "No new schedules to add.",
                    Data = null,
                    IsSuccess = true
                };
            }

            var sortedProposedSlots = proposedSlots.OrderBy(x => x.ActiveAt).ToList();
            
            for (int i = 0; i < sortedProposedSlots.Count - 1; i++)
            {
                if (sortedProposedSlots[i].EndedTime.AddMinutes(15) > sortedProposedSlots[i + 1].ActiveAt)
                {
                    throw new BadRequestException("Phải có khoảng trống 15 phút giữa 2 lịch chiếu để dọn dẹp phòng rạp.", "E02");
                }
            }

            var minStartTime = sortedProposedSlots.First().ActiveAt;
            var maxEndTime = sortedProposedSlots.Last().EndedTime.AddMinutes(15);

            var existingSchedules = await _repository.GetExistingSchedulesForAuditoriumAsync(request.AuditoriumId, minStartTime, maxEndTime);

            foreach (var newSlot in proposedSlots)
            {
                var hasConflict = existingSchedules.Any(existing => 
                    newSlot.ActiveAt < existing.EndedTime.AddMinutes(15) && existing.ActiveAt < newSlot.EndedTime.AddMinutes(15));

                if (hasConflict)
                {
                    throw new BadRequestException("Bị trùng lịch với một suất chiếu khác (Chưa tính 15 phút dọn dẹp).", "E02");
                }
            }

            await _repository.AddSchedulesAsync(proposedSlots);
            await _auditLogService.WriteAsync(
                "Create",
                "MovieSchedule",
                request.AuditoriumId,
                $"Auditorium {request.AuditoriumId}",
                $"Created {proposedSlots.Count} movie schedule(s).",
                cinemaId);
            await _unitOfWork.SaveChangesAsync();
            await transactions.CommitAsync();

            foreach (var slot in proposedSlots)
            {
                _jobScheduler.Enqueue<IScheduleJobsService>(s => s.AddJobIntoBackground(SchedulesJobCategoryEnums.Schedules, slot.MovieScheduleInfoId, slot.ActiveAt, slot.EndedTime));
            }

            return new BaseResponse<string>()
            {
                Message = Messages.Schedule.CreateCompleted,
                Data = null,
                IsSuccess = true
            };
        }
        catch (Exception ex)
        {
            await transactions.RollbackAsync();
            
            if (ex is AppException) throw;

            _logger.LogError(ex, "Error creating movie schedule");
            throw CustomSystemException.SystemExceptionCaller();
        }
    }

    private static void NormalizeSlotTimes(IEnumerable<SchedulesInfos>? slots)
    {
        if (slots == null)
        {
            return;
        }

        foreach (var slot in slots)
        {
            slot.StartedDate = DateTimeHelper.NormalizeIncoming(slot.StartedDate);
        }
    }
}
