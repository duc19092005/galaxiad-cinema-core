using Cinema.Domain.Entities.Cleaning;
using Cinema.Domain.Entities.MovieInfos;
using Cinema.Domain.Enums;

namespace Cinema.Application.Interfaces.Cleaning;

public interface ICleaningRepository
{
    Task<CleaningTaskEntity?> GetTaskByIdAsync(Guid taskId);
    Task<List<CleaningTaskEntity>> GetTasksByCinemaAsync(Guid cinemaId, DateTime? date, CleaningTaskStatus? status);
    Task<List<CleaningTaskEntity>> GetTasksByStaffAsync(Guid staffId, DateTime? date);
    Task<List<CleaningTaskEntity>> GetTasksByAuditoriumAndScheduleAsync(Guid auditoriumId, Guid movieScheduleId);
    Task AddTaskAsync(CleaningTaskEntity task);
    Task AddTasksRangeAsync(IEnumerable<CleaningTaskEntity> tasks);
    void UpdateTask(CleaningTaskEntity task);
    Task<bool> HasApprovedShiftNowAsync(Guid staffId, DateTime atTime);
    Task<bool> IsActiveJanitorAtCinemaAsync(Guid staffId, Guid cinemaId);

    /// <summary>Lấy các suất chiếu kết thúc trong khoảng thời gian, dùng để sinh nhiệm vụ dọn PostShowtime.</summary>
    Task<List<MovieScheduleInfoEntity>> GetSchedulesEndingInRangeAsync(Guid cinemaId, DateTime fromDate, DateTime toDate);
}
