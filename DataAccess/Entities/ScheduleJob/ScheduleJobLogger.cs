using System.ComponentModel.DataAnnotations;
using Shared.Enums;

namespace DataAccess.Entities.ScheduleJob;

public class ScheduleJobLogger
{
    [Key]
    public string JobId { get; set; } = string.Empty;

    public Guid TargetId { get; set; }
    
    public DateTime StartedTime { get; set; }
    
    public DateTime FinishedTime { get; set; }

    public SchedulesJobStatusEnums SchedulesJobStatus { get; set; }
    
    public SchedulesJobEnums JobCategory { get; set; }
    
    public ScheduleJobStatusType ScheduleJobStatus { get; set; }
}

public enum SchedulesJobStatusEnums
{
    Completed ,
    Failed ,
    Processing ,
    Pending
}

public enum ScheduleJobStatusType
{
    EndSchedule ,
    StartSchedule ,
}


