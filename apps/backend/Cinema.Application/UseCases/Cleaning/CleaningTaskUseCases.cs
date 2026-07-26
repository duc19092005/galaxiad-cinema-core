using Cinema.Application.Dtos;
using Cinema.Application.Dtos.Cleaning;
using Cinema.Application.Exceptions;
using Cinema.Application.Interfaces.Cleaning;
using Cinema.Domain.Enums;
using Cinema.Domain.Interfaces.Persistence;
using Cinema.Domain.Localization;

namespace Cinema.Application.UseCases.Cleaning;

public static class CleaningTaskMapper
{
    public static ResCleaningTaskDto MapToDto(Domain.Entities.Cleaning.CleaningTaskEntity task)
    {
        return new ResCleaningTaskDto
        {
            CleaningTaskId = task.CleaningTaskId,
            CinemaId = task.CinemaId,
            AuditoriumId = task.AuditoriumId,
            AuditoriumNumber = task.AuditoriumInfoEntities?.AuditoriumNumber ?? string.Empty,
            MovieScheduleId = task.MovieScheduleId,
            AssignedStaffId = task.AssignedStaffId,
            AssignedStaffName = task.AssignedStaff?.UserInfoEntity?.UserName,
            Status = task.Status,
            TaskType = task.TaskType,
            Priority = task.Priority,
            ScheduledAt = task.ScheduledAt,
            DueAt = task.DueAt,
            StartedAt = task.StartedAt,
            CompletedAt = task.CompletedAt,
            VerifiedAt = task.VerifiedAt,
            Note = task.Note,
            ProofImageUrl = task.ProofImageUrl
        };
    }
}

/// <summary>Bảng công việc quét dọn của quản lý rạp, nhóm theo phòng chiếu.</summary>
public class GetCleaningBoardUseCase
{
    private readonly ICleaningRepository _cleaningRepository;

    public GetCleaningBoardUseCase(ICleaningRepository cleaningRepository)
    {
        _cleaningRepository = cleaningRepository;
    }

    public async Task<BaseResponse<List<ResCleaningBoardCellDto>>> ExecuteAsync(Guid cinemaId, DateTime? date, CleaningTaskStatus? status)
    {
        var tasks = await _cleaningRepository.GetTasksByCinemaAsync(cinemaId, date, status);

        var grouped = tasks
            .GroupBy(t => new { t.AuditoriumId, AuditoriumNumber = t.AuditoriumInfoEntities?.AuditoriumNumber ?? string.Empty })
            .Select(g => new ResCleaningBoardCellDto
            {
                AuditoriumId = g.Key.AuditoriumId,
                AuditoriumNumber = g.Key.AuditoriumNumber,
                Tasks = g.Select(CleaningTaskMapper.MapToDto).ToList()
            })
            .OrderBy(c => c.AuditoriumNumber)
            .ToList();

        return new BaseResponse<List<ResCleaningBoardCellDto>> { IsSuccess = true, Message = "OK", Data = grouped };
    }
}

/// <summary>Danh sách nhiệm vụ quét dọn của chính nhân viên đăng nhập.</summary>
public class GetMyCleaningTasksUseCase
{
    private readonly ICleaningRepository _cleaningRepository;

    public GetMyCleaningTasksUseCase(ICleaningRepository cleaningRepository)
    {
        _cleaningRepository = cleaningRepository;
    }

    public async Task<BaseResponse<List<ResCleaningTaskDto>>> ExecuteAsync(Guid staffId, DateTime? date)
    {
        var tasks = await _cleaningRepository.GetTasksByStaffAsync(staffId, date);
        return new BaseResponse<List<ResCleaningTaskDto>>
        {
            IsSuccess = true,
            Message = "OK",
            Data = tasks.Select(CleaningTaskMapper.MapToDto).ToList()
        };
    }
}

public class AssignCleaningTaskUseCase
{
    private readonly ICleaningRepository _cleaningRepository;
    private readonly IUnitOfWork _unitOfWork;

    public AssignCleaningTaskUseCase(ICleaningRepository cleaningRepository, IUnitOfWork unitOfWork)
    {
        _cleaningRepository = cleaningRepository;
        _unitOfWork = unitOfWork;
    }

    public async Task<BaseResponse<ResCleaningTaskDto>> ExecuteAsync(Guid taskId, ReqAssignCleaningTaskDto request)
    {
        var task = await _cleaningRepository.GetTaskByIdAsync(taskId)
            ?? throw new AppException(Messages.Cleaning.TaskNotFound, 404, "CLN01");

        if (task.Status != CleaningTaskStatus.Pending && task.AssignedStaffId.HasValue && task.AssignedStaffId != request.StaffId)
        {
            throw new AppException(Messages.Cleaning.TaskAlreadyAssigned, 409, "CLN02");
        }

        if (!await _cleaningRepository.IsActiveJanitorAtCinemaAsync(request.StaffId, task.CinemaId))
        {
            throw new AppException("Chỉ có nhân viên quét dọn đang hoạt động tại rạp này mới được nhận nhiệm vụ.", 400, "CLN06");
        }

        task.AssignedStaffId = request.StaffId;
        task.Status = CleaningTaskStatus.Assigned;

        _cleaningRepository.UpdateTask(task);
        await _unitOfWork.SaveChangesAsync();

        return new BaseResponse<ResCleaningTaskDto>
        {
            IsSuccess = true,
            Message = Messages.Cleaning.TaskAssigned,
            Data = CleaningTaskMapper.MapToDto(task)
        };
    }
}

/// <summary>
/// Nhân viên quét mã (scan) để bắt đầu dọn. Yêu cầu đang trong ca Approved tại thời điểm quét
/// (giống ràng buộc của ClockInUseCase), để tránh nhân viên ngoài ca tự ý thao túng bảng công việc.
/// </summary>
public class StartCleaningTaskUseCase
{
    private readonly ICleaningRepository _cleaningRepository;
    private readonly IUnitOfWork _unitOfWork;

    public StartCleaningTaskUseCase(ICleaningRepository cleaningRepository, IUnitOfWork unitOfWork)
    {
        _cleaningRepository = cleaningRepository;
        _unitOfWork = unitOfWork;
    }

    public async Task<BaseResponse<ResCleaningTaskDto>> ExecuteAsync(Guid taskId, Guid staffId)
    {
        var task = await _cleaningRepository.GetTaskByIdAsync(taskId)
            ?? throw new AppException(Messages.Cleaning.TaskNotFound, 404, "CLN01");

        if (task.AssignedStaffId.HasValue && task.AssignedStaffId != staffId)
        {
            throw new AppException(Messages.Cleaning.TaskNotAssignedToYou, 403, "CLN03");
        }

        if (task.Status != CleaningTaskStatus.Pending && task.Status != CleaningTaskStatus.Assigned)
        {
            throw new AppException(Messages.Cleaning.InvalidStatusTransition, 400, "CLN04");
        }

        if (!await _cleaningRepository.HasApprovedShiftNowAsync(staffId, DateTime.UtcNow))
        {
            throw new AppException(Messages.Cleaning.StaffNotOnShift, 403, "CLN05");
        }

        task.AssignedStaffId = staffId;
        task.Status = CleaningTaskStatus.InProgress;
        task.StartedAt = DateTime.UtcNow;

        _cleaningRepository.UpdateTask(task);
        await _unitOfWork.SaveChangesAsync();

        return new BaseResponse<ResCleaningTaskDto>
        {
            IsSuccess = true,
            Message = Messages.Cleaning.TaskStarted,
            Data = CleaningTaskMapper.MapToDto(task)
        };
    }
}

public class CompleteCleaningTaskUseCase
{
    private readonly ICleaningRepository _cleaningRepository;
    private readonly IUnitOfWork _unitOfWork;

    public CompleteCleaningTaskUseCase(ICleaningRepository cleaningRepository, IUnitOfWork unitOfWork)
    {
        _cleaningRepository = cleaningRepository;
        _unitOfWork = unitOfWork;
    }

    public async Task<BaseResponse<ResCleaningTaskDto>> ExecuteAsync(Guid taskId, Guid staffId, ReqCompleteCleaningTaskDto request)
    {
        var task = await _cleaningRepository.GetTaskByIdAsync(taskId)
            ?? throw new AppException(Messages.Cleaning.TaskNotFound, 404, "CLN01");

        if (task.AssignedStaffId != staffId)
        {
            throw new AppException(Messages.Cleaning.TaskNotAssignedToYou, 403, "CLN03");
        }

        if (task.Status != CleaningTaskStatus.InProgress)
        {
            throw new AppException(Messages.Cleaning.InvalidStatusTransition, 400, "CLN04");
        }

        task.Status = CleaningTaskStatus.Completed;
        task.CompletedAt = DateTime.UtcNow;
        task.Note = request.Note ?? task.Note;
        task.ProofImageUrl = request.ProofImageUrl ?? task.ProofImageUrl;

        _cleaningRepository.UpdateTask(task);
        await _unitOfWork.SaveChangesAsync();

        return new BaseResponse<ResCleaningTaskDto>
        {
            IsSuccess = true,
            Message = Messages.Cleaning.TaskCompleted,
            Data = CleaningTaskMapper.MapToDto(task)
        };
    }
}

public class VerifyCleaningTaskUseCase
{
    private readonly ICleaningRepository _cleaningRepository;
    private readonly IUnitOfWork _unitOfWork;

    public VerifyCleaningTaskUseCase(ICleaningRepository cleaningRepository, IUnitOfWork unitOfWork)
    {
        _cleaningRepository = cleaningRepository;
        _unitOfWork = unitOfWork;
    }

    public async Task<BaseResponse<ResCleaningTaskDto>> ExecuteAsync(Guid taskId, Guid verifiedByUserId, ReqVerifyCleaningTaskDto request)
    {
        var task = await _cleaningRepository.GetTaskByIdAsync(taskId)
            ?? throw new AppException(Messages.Cleaning.TaskNotFound, 404, "CLN01");

        if (task.Status != CleaningTaskStatus.Completed)
        {
            throw new AppException(Messages.Cleaning.InvalidStatusTransition, 400, "CLN04");
        }

        task.Status = CleaningTaskStatus.Verified;
        task.VerifiedAt = DateTime.UtcNow;
        task.VerifiedByUserId = verifiedByUserId;
        if (!string.IsNullOrWhiteSpace(request.Note))
        {
            task.Note = $"{task.Note}\n[Verified] {request.Note}".Trim();
        }

        _cleaningRepository.UpdateTask(task);
        await _unitOfWork.SaveChangesAsync();

        return new BaseResponse<ResCleaningTaskDto>
        {
            IsSuccess = true,
            Message = Messages.Cleaning.TaskVerified,
            Data = CleaningTaskMapper.MapToDto(task)
        };
    }
}
