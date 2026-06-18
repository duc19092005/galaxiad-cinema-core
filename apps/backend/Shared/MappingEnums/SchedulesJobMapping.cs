using Shared.Enums;


namespace Shared.MappingEnums;

public static class SchedulesJobMapping
{
    public static readonly Dictionary<SchedulesJobCategoryEnums, string> ScheduleCategoryMapping =
        new Dictionary<SchedulesJobCategoryEnums, string>
        {
            { SchedulesJobCategoryEnums.Movies, "Movies" },
            { SchedulesJobCategoryEnums.Schedules, "Showtimes" }, // Renamed for clarity
        };

    public static readonly Dictionary<SchedulesJobStatusEnums, string> SchedulesJobsMapping =
        new Dictionary<SchedulesJobStatusEnums, string>()
        {
            { SchedulesJobStatusEnums.Pending, "Pending" },
            { SchedulesJobStatusEnums.Completed, "Completed" },
            { SchedulesJobStatusEnums.Failed, "Failed" },
            { SchedulesJobStatusEnums.Processing, "Processing" },
        };

    public static readonly Dictionary<ScheduleJobStatusType, string> ScheduleJobStatusTypeMapping =
        new Dictionary<ScheduleJobStatusType, string>
        {
            { ScheduleJobStatusType.StartSchedule, "StartSchedule" },
            { ScheduleJobStatusType.EndSchedule, "EndSchedule" },
        };

    public static (string scheduleJobCategory, string scheduleJobStatus, string scheduleJobStatusType) 
        MappingScheduleEnums(SchedulesJobCategoryEnums scheduleCategory , SchedulesJobStatusEnums schedulesJobStatusEnums ,ScheduleJobStatusType scheduleJobStatusType)
    {

        ScheduleCategoryMapping.TryGetValue(scheduleCategory, out string? scheduleCategoryVal);

        SchedulesJobsMapping.TryGetValue(schedulesJobStatusEnums, out string? schedulesJobStatusVal);

        ScheduleJobStatusTypeMapping.TryGetValue(scheduleJobStatusType, out string? scheduleJobStatusVal);
        
        return (scheduleCategoryVal!, schedulesJobStatusVal!, scheduleJobStatusVal!);
    }
}

