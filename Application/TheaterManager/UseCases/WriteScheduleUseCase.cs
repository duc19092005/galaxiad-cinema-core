using Application.Common;
using Application.TheaterManager.Ports;
using Microsoft.Extensions.Logging;
using Shared.Localization;
using Shared.Exceptions;

namespace Application.TheaterManager.UseCases;

/// <summary>
/// Use case xếp lịch chiếu (tạo/sửa/xoá). Giữ nguyên quy tắc nghiệp vụ:
/// kiểm tra quyền sở hữu phòng, phim hợp lệ/được uỷ quyền/đúng định dạng, không xếp quá khứ,
/// trong khung phát hành phim, có khoảng dọn dẹp 15 phút giữa 2 suất, và không trùng lịch.
/// Lên lịch job nền qua IBackgroundJobScheduler sau khi commit.
/// </summary>
public class WriteScheduleUseCase
{
    private const int CleanupGapMinutes = 15;

    private readonly ISchedulingRepository _repository;
    private readonly IBackgroundJobScheduler _jobScheduler;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IClock _clock;
    private readonly ILogger<WriteScheduleUseCase> _logger;

    public WriteScheduleUseCase(
        ISchedulingRepository repository,
        IBackgroundJobScheduler jobScheduler,
        IUnitOfWork unitOfWork,
        IClock clock,
        ILogger<WriteScheduleUseCase> logger)
    {
        _repository = repository;
        _jobScheduler = jobScheduler;
        _unitOfWork = unitOfWork;
        _clock = clock;
        _logger = logger;
    }

    public async Task<int> CreateAsync(
        CreateScheduleCommand command, Guid userId, bool isAdmin, CancellationToken cancellationToken = default)
    {
        var cinemaId = await _repository.GetOwnedAuditoriumCinemaIdAsync(
            command.AuditoriumId, userId, isAdmin, includeFacilitiesManager: false, cancellationToken);
        if (cinemaId == null)
        {
            throw new NotFoundException(Messages.Schedule.AuditoriumNotFound);
        }

        var reqMovieIds = command.Slots.Select(s => s.MovieId).Distinct().ToList();
        var movies = await _repository.GetActiveMoviesAsync(reqMovieIds, cancellationToken);
        var supportedFormats = await _repository.GetMovieSupportedFormatsAsync(reqMovieIds, cancellationToken);
        var allFormats = await _repository.GetAllFormatNamesAsync(cancellationToken);
        var authorizedMovies = await _repository.GetAuthorizedMovieIdsAsync(cinemaId.Value, reqMovieIds, cancellationToken);
        var existing = await _repository.GetAuditoriumSchedulesAsync(command.AuditoriumId, cancellationToken);

        var now = _clock.VietnamNow;
        var proposed = new List<NewSchedule>();

        foreach (var slot in command.Slots)
        {
            // Bỏ qua suất đã tồn tại trùng khít (movie + format + start).
            var alreadyExists = existing.Any(x =>
                x.MovieId == slot.MovieId && x.FormatId == slot.FormatId && x.StartTime == slot.StartedDate);
            if (alreadyExists) continue;

            var movie = ResolveMovie(movies, slot.MovieId);
            EnsureAuthorized(authorizedMovies, slot.MovieId, movie);
            EnsureFormatSupported(supportedFormats, allFormats, slot, movie.MovieName);
            EnsureWithinWindow(slot, movie, now);

            var endTime = slot.StartedDate.AddMinutes(movie.Duration);
            proposed.Add(new NewSchedule(
                Guid.NewGuid(), slot.MovieId, command.AuditoriumId, slot.FormatId,
                slot.StartedDate, endTime, userId, now >= slot.StartedDate && now < endTime));
        }

        if (proposed.Count == 0)
        {
            return 0;
        }

        EnsureNoInternalOverlap(proposed.Select(p => (p.StartTime, p.EndedTime)));
        EnsureNoConflictWithExisting(proposed.Select(p => (p.StartTime, p.EndedTime)), existing);

        await using var transaction = await _unitOfWork.BeginTransactionAsync(cancellationToken: cancellationToken);
        try
        {
            await _repository.AddSchedulesAsync(proposed, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync(cancellationToken);
            if (ex is AppException) throw;
            _logger.LogError(ex, "Error creating movie schedule");
            throw CustomSystemException.SystemExceptionCaller();
        }

        foreach (var slot in proposed)
        {
            await _jobScheduler.ScheduleStatusJobsAsync(
                BackgroundJobTarget.Schedule, slot.ScheduleId, slot.StartTime, slot.EndedTime, cancellationToken);
        }

        return proposed.Count;
    }

    public async Task UpdateAsync(
        UpdateScheduleCommand command, Guid userId, bool isAdmin, CancellationToken cancellationToken = default)
    {
        if (command.Slots == null || command.Slots.Count == 0)
        {
            throw new BadRequestException(Messages.Schedule.ScheduleListCannotBeEmpty, "E01");
        }

        // Suất đã có vé Completed thì không cho sửa.
        foreach (var slot in command.Slots)
        {
            if (await _repository.HasCompletedOrderAsync(slot.ScheduleId, cancellationToken))
            {
                throw new BadRequestException("Không thể sửa suất chiếu đã hoàn tất (đã soát vé).", "E01");
            }
        }

        var cinemaId = await _repository.GetOwnedAuditoriumCinemaIdAsync(
            command.AuditoriumId, userId, isAdmin, includeFacilitiesManager: true, cancellationToken);
        if (cinemaId == null)
        {
            throw new NotFoundException(Messages.Schedule.AuditoriumNotFound);
        }

        var updatingIds = command.Slots.Select(s => s.ScheduleId).ToList();
        var schedulesToUpdate = await _repository.GetSchedulesByIdsAsync(command.AuditoriumId, updatingIds, cancellationToken);
        if (schedulesToUpdate.Count != updatingIds.Distinct().Count())
        {
            throw new BadRequestException(Messages.Schedule.SchedulesIsNotFoundOrMovieIsInactivated, "E01");
        }

        if (await _repository.HasSuccessfulBookingAsync(updatingIds, cancellationToken))
        {
            throw new BadRequestException("Không thể sửa các suất chiếu đã có người đặt vé thành công.", "E03");
        }

        var movieIds = command.Slots.Select(s => s.MovieId).Distinct().ToList();
        var movies = await _repository.GetActiveMoviesAsync(movieIds, cancellationToken);
        var supportedFormats = await _repository.GetMovieSupportedFormatsAsync(movieIds, cancellationToken);
        var allFormats = await _repository.GetAllFormatNamesAsync(cancellationToken);
        var authorizedMovies = await _repository.GetAuthorizedMovieIdsAsync(cinemaId.Value, movieIds, cancellationToken);

        var now = _clock.VietnamNow;
        var proposed = new List<(DateTime Start, DateTime End)>();

        foreach (var slot in command.Slots)
        {
            var existingEntity = schedulesToUpdate.FirstOrDefault(x => x.ScheduleId == slot.ScheduleId);
            var isUnchanged = existingEntity != null
                && existingEntity.MovieId == slot.MovieId
                && existingEntity.FormatId == slot.FormatId
                && existingEntity.StartTime == slot.StartedDate;

            var movie = ResolveMovie(movies, slot.MovieId);
            if (!isUnchanged)
            {
                EnsureAuthorized(authorizedMovies, slot.MovieId, movie);
                EnsureFormatSupported(supportedFormats, allFormats, slot, movie.MovieName);
                EnsureWithinWindow(slot, movie, now);
            }

            proposed.Add((slot.StartedDate, slot.StartedDate.AddMinutes(movie.Duration)));
        }

        EnsureNoInternalOverlap(proposed);

        // Lấy các suất khác trong phòng (loại trừ những suất đang cập nhật) để kiểm tra trùng.
        var others = (await _repository.GetAuditoriumSchedulesAsync(command.AuditoriumId, cancellationToken))
            .Where(x => !updatingIds.Contains(x.ScheduleId))
            .ToList();
        EnsureNoConflictWithExisting(proposed, others);

        var updates = command.Slots.Select(slot =>
        {
            var movie = movies[slot.MovieId];
            return new ScheduleUpdate(
                slot.ScheduleId, slot.MovieId, slot.FormatId,
                slot.StartedDate, slot.StartedDate.AddMinutes(movie.Duration), userId);
        }).ToList();

        await using var transaction = await _unitOfWork.BeginTransactionAsync(cancellationToken: cancellationToken);
        try
        {
            await _repository.UpdateSchedulesAsync(command.AuditoriumId, updates, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync(cancellationToken);
            if (ex is AppException) throw;
            _logger.LogError(ex, "Error updating movie schedule");
            throw CustomSystemException.SystemExceptionCaller();
        }

        foreach (var update in updates)
        {
            await _jobScheduler.RescheduleStatusJobsAsync(
                BackgroundJobTarget.Schedule, update.ScheduleId, update.StartTime, update.EndedTime, cancellationToken);
        }
    }

    public async Task DeleteAsync(Guid scheduleId, Guid userId, CancellationToken cancellationToken = default)
    {
        var state = await _repository.GetScheduleStateAsync(scheduleId, cancellationToken);
        if (state == null)
        {
            throw new NotFoundException(Messages.Schedule.SchedulesIsNotFoundOrMovieIsInactivated);
        }
        if (state.IsDeleted)
        {
            throw new BadRequestException("Lịch chiếu này đã bị xóa.", "D01");
        }

        if (await _repository.HasSuccessfulBookingAsync(new[] { scheduleId }, cancellationToken))
        {
            throw new BadRequestException("Không thể xóa lịch chiếu đã có người đặt vé thành công.", "D03");
        }

        await _repository.SoftDeleteScheduleAsync(scheduleId, userId, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }

    private static SchedulingMovieInfo ResolveMovie(Dictionary<Guid, SchedulingMovieInfo> movies, Guid movieId)
    {
        if (!movies.TryGetValue(movieId, out var movie))
        {
            throw new BadRequestException(Messages.Movie.IdNotExistOrInactive(movieId), "E01");
        }
        return movie;
    }

    private static void EnsureAuthorized(List<Guid> authorizedMovies, Guid movieId, SchedulingMovieInfo movie)
    {
        if (!authorizedMovies.Contains(movieId))
        {
            throw new BadRequestException($"Phim '{movie.MovieName}' chưa được ủy quyền chiếu tại rạp này.", "E01");
        }
    }

    private static void EnsureFormatSupported(
        Dictionary<Guid, List<Guid>> supportedFormats, Dictionary<Guid, string> allFormats, SlotInput slot, string movieName)
    {
        if (!supportedFormats.TryGetValue(slot.MovieId, out var formats) || !formats.Contains(slot.FormatId))
        {
            var formatName = allFormats.TryGetValue(slot.FormatId, out var name) ? name : slot.FormatId.ToString();
            throw new BadRequestException(Messages.MovieFormat.InvalidFormatForMovie(movieName, formatName), "E01");
        }
    }

    private void EnsureWithinWindow(SlotInput slot, SchedulingMovieInfo movie, DateTime now)
    {
        if (slot.StartedDate < now)
        {
            throw new BadRequestException(Messages.Schedule.PastDateNotAllowed, "E01");
        }
        if (slot.StartedDate < movie.ActiveAt || slot.StartedDate.Date > movie.EndedDate.Date)
        {
            throw new BadRequestException(
                Messages.Schedule.MovieAvailability(
                    movie.MovieName, movie.ActiveAt.ToString("MM/dd/yyyy"), movie.EndedDate.ToString("MM/dd/yyyy")),
                "E01");
        }
    }

    private static void EnsureNoInternalOverlap(IEnumerable<(DateTime Start, DateTime End)> slots)
    {
        var sorted = slots.OrderBy(x => x.Start).ToList();
        for (var i = 0; i < sorted.Count - 1; i++)
        {
            if (sorted[i].End.AddMinutes(CleanupGapMinutes) > sorted[i + 1].Start)
            {
                throw new BadRequestException(
                    "Phải có khoảng trống 15 phút giữa 2 lịch chiếu để dọn dẹp phòng rạp.", "E02");
            }
        }
    }

    private static void EnsureNoConflictWithExisting(
        IEnumerable<(DateTime Start, DateTime End)> proposed, List<ExistingSchedule> existing)
    {
        foreach (var slot in proposed)
        {
            var hasConflict = existing.Any(e =>
                slot.Start < e.EndedTime.AddMinutes(CleanupGapMinutes) && e.StartTime < slot.End.AddMinutes(CleanupGapMinutes));
            if (hasConflict)
            {
                throw new BadRequestException(
                    "Bị trùng lịch với một suất chiếu khác (Chưa tính 15 phút dọn dẹp).", "E02");
            }
        }
    }
}
