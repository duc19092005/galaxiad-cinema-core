namespace Application.Common;

/// <summary>
/// Loại đối tượng nền cần lên lịch đổi trạng thái (phim / suất chiếu).
/// </summary>
public enum BackgroundJobTarget
{
    Movie = 0,
    Schedule = 1
}

/// <summary>
/// Cổng lên lịch job nền (Hangfire) để tự động đổi trạng thái theo thời gian.
/// Tách Application khỏi Hangfire và khỏi cơ chế lập lịch cụ thể.
/// </summary>
public interface IBackgroundJobScheduler
{
    /// <summary>Đăng ký job bật/tắt trạng thái theo mốc start/end.</summary>
    Task ScheduleStatusJobsAsync(
        BackgroundJobTarget target, Guid targetId, DateTime start, DateTime end,
        CancellationToken cancellationToken = default);

    /// <summary>Lên lịch lại job (xoá cũ, tạo mới) dựa trên dữ liệu hiện tại trong DB.</summary>
    Task RescheduleStatusJobsAsync(
        BackgroundJobTarget target, Guid targetId, DateTime? start, DateTime? end,
        CancellationToken cancellationToken = default);
}
