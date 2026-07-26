using Cinema.Application.Dtos;
using Cinema.Application.Interfaces.Cleaning;
using Cinema.Domain.Entities.Cleaning;
using Cinema.Domain.Enums;
using Cinema.Domain.Interfaces.Persistence;
using Cinema.Domain.Localization;

namespace Cinema.Application.UseCases.Cleaning;

/// <summary>
/// Tự động sinh nhiệm vụ quét dọn PostShowtime cho mọi suất chiếu kết thúc trong khoảng thời gian
/// yêu cầu, tại một rạp. Hạn hoàn thành (DueAt) được đặt bằng giờ bắt đầu của suất kế tiếp cùng
/// phòng chiếu, phản ánh ràng buộc thực tế phòng phải sạch trước khi suất sau vào. Nếu không còn
/// suất nào sau đó trong ngày, DueAt mặc định +30 phút sau khi suất kết thúc.
/// Idempotent: bỏ qua nếu suất chiếu đã có task (nhờ unique index trên MovieScheduleId).
/// </summary>
public class GenerateCleaningTasksForShowtimesUseCase
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICleaningRepository _cleaningRepository;

    public GenerateCleaningTasksForShowtimesUseCase(IUnitOfWork unitOfWork, ICleaningRepository cleaningRepository)
    {
        _unitOfWork = unitOfWork;
        _cleaningRepository = cleaningRepository;
    }

    public async Task<BaseResponse<int>> ExecuteAsync(Guid cinemaId, DateTime fromDate, DateTime toDate)
    {
        var schedules = await _cleaningRepository.GetSchedulesEndingInRangeAsync(cinemaId, fromDate, toDate);

        if (schedules.Count == 0)
        {
            return new BaseResponse<int> { IsSuccess = true, Message = Messages.Cleaning.TasksGenerated, Data = 0 };
        }

        var byAuditorium = schedules.GroupBy(s => s.AuditoriumId).ToDictionary(g => g.Key, g => g.OrderBy(s => s.StartTime).ToList());
        var newTasks = new List<CleaningTaskEntity>();

        var allCinemaTasks = await _cleaningRepository.GetTasksByCinemaAsync(cinemaId, null, null);
        var existingScheduleIds = allCinemaTasks
            .Where(t => t.MovieScheduleId.HasValue)
            .Select(t => t.MovieScheduleId!.Value)
            .ToHashSet();

        foreach (var (auditoriumId, auditoriumSchedules) in byAuditorium)
        {
            for (var i = 0; i < auditoriumSchedules.Count; i++)
            {
                var schedule = auditoriumSchedules[i];
                if (existingScheduleIds.Contains(schedule.MovieScheduleInfoId)) continue;

                var nextStart = i + 1 < auditoriumSchedules.Count
                    ? auditoriumSchedules[i + 1].StartTime
                    : schedule.EndedTime.AddMinutes(30);

                newTasks.Add(new CleaningTaskEntity
                {
                    CleaningTaskId = Guid.NewGuid(),
                    CinemaId = cinemaId,
                    AuditoriumId = auditoriumId,
                    MovieScheduleId = schedule.MovieScheduleInfoId,
                    Status = CleaningTaskStatus.Pending,
                    TaskType = CleaningTaskType.PostShowtime,
                    Priority = 1,
                    ScheduledAt = schedule.EndedTime,
                    DueAt = nextStart,
                    CreatedAt = DateTime.UtcNow
                });
            }
        }

        if (newTasks.Count > 0)
        {
            await _cleaningRepository.AddTasksRangeAsync(newTasks);
            await _unitOfWork.SaveChangesAsync();
        }

        return new BaseResponse<int> { IsSuccess = true, Message = Messages.Cleaning.TasksGenerated, Data = newTasks.Count };
    }
}
