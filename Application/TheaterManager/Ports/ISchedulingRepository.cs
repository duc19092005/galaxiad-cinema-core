namespace Application.TheaterManager.Ports;

/// <summary>Thông tin phim cần để xếp lịch (đang chiếu, chưa xoá).</summary>
public record SchedulingMovieInfo(
    Guid MovieId, string MovieName, int Duration, DateTime ActiveAt, DateTime EndedDate);

/// <summary>Suất chiếu đang tồn tại trong phòng (phục vụ kiểm tra trùng lịch).</summary>
public record ExistingSchedule(
    Guid ScheduleId, Guid MovieId, Guid FormatId, DateTime StartTime, DateTime EndedTime);

/// <summary>Suất chiếu mới cần thêm.</summary>
public record NewSchedule(
    Guid ScheduleId, Guid MovieId, Guid AuditoriumId, Guid FormatId,
    DateTime StartTime, DateTime EndedTime, Guid CreatedByUserId, bool IsActive);

/// <summary>Cập nhật một suất chiếu hiện có.</summary>
public record ScheduleUpdate(
    Guid ScheduleId, Guid MovieId, Guid FormatId, DateTime StartTime, DateTime EndedTime, Guid UpdatedByUserId);

/// <summary>Trạng thái suất chiếu phục vụ kiểm tra xoá.</summary>
public record ScheduleState(Guid ScheduleId, bool IsDeleted);

/// <summary>
/// Cổng truy cập dữ liệu cho luồng xếp lịch chiếu (TheaterManager). Infrastructure implement bằng EF Core.
/// </summary>
public interface ISchedulingRepository
{
    /// <summary>
    /// Trả về CinemaId nếu phòng tồn tại và thuộc quyền quản lý; null nếu không.
    /// includeFacilitiesManager = true để cho phép cả FacilitiesManager (luồng update).
    /// </summary>
    Task<Guid?> GetOwnedAuditoriumCinemaIdAsync(
        Guid auditoriumId, Guid userId, bool isAdmin, bool includeFacilitiesManager,
        CancellationToken cancellationToken = default);

    Task<Dictionary<Guid, SchedulingMovieInfo>> GetActiveMoviesAsync(
        IReadOnlyCollection<Guid> movieIds, CancellationToken cancellationToken = default);

    Task<Dictionary<Guid, List<Guid>>> GetMovieSupportedFormatsAsync(
        IReadOnlyCollection<Guid> movieIds, CancellationToken cancellationToken = default);

    Task<Dictionary<Guid, string>> GetAllFormatNamesAsync(CancellationToken cancellationToken = default);

    Task<List<Guid>> GetAuthorizedMovieIdsAsync(
        Guid cinemaId, IReadOnlyCollection<Guid> movieIds, CancellationToken cancellationToken = default);

    Task<List<ExistingSchedule>> GetAuditoriumSchedulesAsync(
        Guid auditoriumId, CancellationToken cancellationToken = default);

    Task<List<ExistingSchedule>> GetSchedulesByIdsAsync(
        Guid auditoriumId, IReadOnlyCollection<Guid> scheduleIds, CancellationToken cancellationToken = default);

    Task<bool> HasSuccessfulBookingAsync(
        IReadOnlyCollection<Guid> scheduleIds, CancellationToken cancellationToken = default);

    Task<bool> HasCompletedOrderAsync(Guid scheduleId, CancellationToken cancellationToken = default);

    Task<ScheduleState?> GetScheduleStateAsync(Guid scheduleId, CancellationToken cancellationToken = default);

    Task AddSchedulesAsync(IEnumerable<NewSchedule> schedules, CancellationToken cancellationToken = default);

    /// <summary>Áp các cập nhật suất chiếu (theo Id). Trả về false nếu thiếu suất nào đó.</summary>
    Task<bool> UpdateSchedulesAsync(
        Guid auditoriumId, IReadOnlyCollection<ScheduleUpdate> updates, CancellationToken cancellationToken = default);

    Task SoftDeleteScheduleAsync(Guid scheduleId, Guid deletedByUserId, CancellationToken cancellationToken = default);
}
