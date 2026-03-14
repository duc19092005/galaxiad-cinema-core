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
