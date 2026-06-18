using System.Text.Json.Serialization;

namespace BusinessLayer.Dtos.Admin.Responses;

public class ResponseScheduleJobDto
{
    public string JobId { get; set; } = string.Empty;
    
    public Guid TargetId { get; set; }
    
    public DateTime JobStartedAt { get; set; }
    
    public DateTime? JobEndedAt { get; set; }

    public string ScheduleJobCategory { get; set; } = string.Empty;
    
    public string ScheduleJobStatus { get; set; } = string.Empty;
    
    public string ScheduleJobStatusType { get; set; } = string.Empty;
    
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? FailedReason { get; set; }
}

/// <summary>
/// Grouped by TargetId - each target has a StartSchedule and EndSchedule job
/// </summary>
public class ResponseScheduleJobGroupDto
{
    public Guid TargetId { get; set; }
    
    public string JobCategory { get; set; } = string.Empty;
    
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public ResponseScheduleJobDto? StartScheduleJob { get; set; }
    
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public ResponseScheduleJobDto? EndScheduleJob { get; set; }
}
