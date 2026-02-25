using BusinessLayer.Dtos;
using BusinessLayer.Dtos.TheaterManager.MovieSchedules;
using BusinessLayer.Interfaces.IBehaviors;
using BusinessLayer.Services.IdentityAccess;
using DataAccess;
using DataAccess.Entities.MovieInfos;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Shared.Exceptions;
using Shared.Localization;

namespace BusinessLayer.UseCases.TheaterManager.MovieSchedules;

public class WriteMovieSchedulesUseCase : IWriteBehavior<TheaterManagerAddMovieSchedulesRequest,
    TheaterManagerEditMovieSchedulesRequest, string>
{
    private readonly CinemaDbContext _cinemaDbContext;
    
    private readonly ILogger<WriteMovieSchedulesUseCase> _logger;
    
    private readonly IUserContextService _userContextService;

    public WriteMovieSchedulesUseCase(CinemaDbContext cinemaDbContext , ILogger<WriteMovieSchedulesUseCase> logger ,
        IUserContextService userContextService)
    {
        _cinemaDbContext = cinemaDbContext;
        _logger = logger;
        _userContextService = userContextService;
    }
    public async Task<BaseResponse<string>> AddItem(TheaterManagerAddMovieSchedulesRequest request)
    {
        var getCurrentUserId = _userContextService.GetUserId();

        var isAuditoriumExist = await _cinemaDbContext.AuditoriumInfoEntities
            .AsNoTracking()
            .AnyAsync(x => x.AuditoriumId == request.AuditoriumId);
            
        if (!isAuditoriumExist)
        {
            throw new NotFoundException(Messages.Schedule.AuditoriumNotFound);
        }

        var transactions = await _cinemaDbContext.Database.BeginTransactionAsync();

        try
        {
            var reqMovieIds = request.Slots.Select(x => x.MovieId).Distinct().ToList();
            
            var validMovieDictionary = await _cinemaDbContext.MovieInfoEntity
                .AsNoTracking()
                .Where(m => reqMovieIds.Contains(m.MovieId) && m.IsActive && !m.IsDeleted)
                .ToDictionaryAsync(x => x.MovieId);

            var validMovieFormats = await _cinemaDbContext.MovieFormatMovieInfoEntity
                .AsNoTracking()
                .Where(y => reqMovieIds.Contains(y.MovieId))
                .GroupBy(x => x.MovieId)
                .ToDictionaryAsync(x => x.Key, y => y.Select(f => f.FormatId).ToList());

            var proposedSlots = new List<MovieScheduleInfoEntity>();

            foreach (var slot in request.Slots)
            {
                if (!validMovieDictionary.TryGetValue(slot.MovieId, out var movie))
                {
                    throw new BadRequestException(Messages.Movie.IdNotExistOrInactive(slot.MovieId), "E01");
                }

                if (!validMovieFormats.TryGetValue(slot.MovieId, out var movieFormat) || !movieFormat.Contains(slot.FormatId))
                {
                    throw new BadRequestException(Messages.MovieFormat.InvalidFormatForMovie(movie.MovieName), "E01");
                }

                if (slot.StartedDate < DateTime.Now)
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
                    ActiveAt = slot.StartedDate,
                    EndedTime = endTime,
                    CreatedByUserId = getCurrentUserId
                });
            }

            var sortedProposedSlots = proposedSlots.OrderBy(x => x.ActiveAt).ToList();
            
            for (int i = 0; i < sortedProposedSlots.Count - 1; i++)
            {
                if (sortedProposedSlots[i].EndedTime > sortedProposedSlots[i + 1].ActiveAt)
                {
                    throw new BadRequestException(Messages.Schedule.OverlappingSchedules, "E02");
                }
            }

            var minStartTime = sortedProposedSlots.First().ActiveAt;
            var maxEndTime = sortedProposedSlots.Last().EndedTime;

            var existingSchedules = await _cinemaDbContext.MovieScheduleInfoEntity
                .AsNoTracking()
                .Where(x => x.AuditoriumId == request.AuditoriumId 
                         && x.EndedTime > minStartTime 
                         && x.ActiveAt < maxEndTime)
                .ToListAsync();

            foreach (var newSlot in proposedSlots)
            {
                var hasConflict = existingSchedules.Any(existing => 
                    newSlot.ActiveAt < existing.EndedTime && existing.ActiveAt < newSlot.EndedTime);

                if (hasConflict)
                {
                    throw new BadRequestException(Messages.Schedule.TimeSlotConflict(newSlot.ActiveAt.ToString("HH:mm"), newSlot.EndedTime.ToString("HH:mm")), "E02");
                }
            }

            await _cinemaDbContext.MovieScheduleInfoEntity.AddRangeAsync(proposedSlots);
            await _cinemaDbContext.SaveChangesAsync();
            await transactions.CommitAsync();

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

    public async Task<BaseResponse<string>> UpdateItem(Guid itemId, TheaterManagerEditMovieSchedulesRequest request)
    {
        return new BaseResponse<string>()
        {
            Message = "Create Movie Schedule Completed",
            Data = null,
            IsSuccess = true
        };
    }

    public async Task<BaseResponse<string>> DeleteItem(Guid itemId)
    {
        return new BaseResponse<string>()
        {
            Message = "Create Movie Schedule Completed",
            Data = null,
            IsSuccess = true
        };
    }

}