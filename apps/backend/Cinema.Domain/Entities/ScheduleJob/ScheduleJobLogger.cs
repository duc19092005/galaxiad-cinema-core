using System.ComponentModel.DataAnnotations;
using Cinema.Domain.Enums;

namespace Cinema.Domain.Entities.ScheduleJob;

public class ScheduleJobLogger
{
    [Key]
    public string JobId { get; set; } = string.Empty;

    public Guid TargetId { get; set; }
    
    public DateTime StartedTime { get; set; }
    
    public DateTime FinishedTime { get; set; }
    
    public string? FailedReason { get; set; } = string.Empty;
    
    public SchedulesJobStatusEnums SchedulesJobStatus { get; set; }
    
    public SchedulesJobCategoryEnums JobCategory { get; set; }
    
    public ScheduleJobStatusType ScheduleJobStatusType { get; set; }
}




