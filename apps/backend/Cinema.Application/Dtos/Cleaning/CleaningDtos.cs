using System.ComponentModel.DataAnnotations;
using Cinema.Domain.Enums;

namespace Cinema.Application.Dtos.Cleaning;

public class ResCleaningTaskDto
{
    public Guid CleaningTaskId { get; set; }
    public Guid CinemaId { get; set; }
    public Guid AuditoriumId { get; set; }
    public string AuditoriumNumber { get; set; } = string.Empty;
    public Guid? MovieScheduleId { get; set; }
    public Guid? AssignedStaffId { get; set; }
    public string? AssignedStaffName { get; set; }
    public CleaningTaskStatus Status { get; set; }
    public CleaningTaskType TaskType { get; set; }
    public int Priority { get; set; }
    public DateTime ScheduledAt { get; set; }
    public DateTime? DueAt { get; set; }
    public DateTime? StartedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public DateTime? VerifiedAt { get; set; }
    public string? Note { get; set; }
    public string? ProofImageUrl { get; set; }
}

public class ReqAssignCleaningTaskDto
{
    [Required] public Guid StaffId { get; set; }
}

public class ReqCompleteCleaningTaskDto
{
    public string? Note { get; set; }
    public string? ProofImageUrl { get; set; }
}

public class ReqVerifyCleaningTaskDto
{
    public string? Note { get; set; }
}

public class ResCleaningBoardCellDto
{
    public Guid AuditoriumId { get; set; }
    public string AuditoriumNumber { get; set; } = string.Empty;
    public List<ResCleaningTaskDto> Tasks { get; set; } = [];
}
