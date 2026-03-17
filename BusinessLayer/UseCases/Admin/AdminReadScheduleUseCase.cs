using BusinessLayer.Dtos;
using BusinessLayer.Dtos.Admin.Responses;
using DataAccess;
using Microsoft.EntityFrameworkCore;
using Shared.Enums;
using Shared.MappingEnums;

namespace BusinessLayer.UseCases.Admin;

public interface IAdminReadScheduleBehavior
{
    Task<BaseResponse<List<ResponseScheduleJobGroupDto>>> ListScheduleJob();
}
public class AdminReadScheduleUseCase : IAdminReadScheduleBehavior
{
    private readonly CinemaDbContext _cinemaDbContext;

    public AdminReadScheduleUseCase(CinemaDbContext cinemaDbContext)
    {
        _cinemaDbContext = cinemaDbContext;
    }

    public async Task<BaseResponse<List<ResponseScheduleJobGroupDto>>> ListScheduleJob()
    {
        var rawData = await _cinemaDbContext.BackGroundJobLoggerEntity
            .OrderByDescending(x => x.StartedTime)
            .ToListAsync();

        // Group by TargetId
        var grouped = rawData
            .GroupBy(x => x.TargetId)
            .Select(group =>
            {
                var startJob = group.FirstOrDefault(x => x.ScheduleJobStatusType == ScheduleJobStatusType.StartSchedule);
                var endJob = group.FirstOrDefault(x => x.ScheduleJobStatusType == ScheduleJobStatusType.EndSchedule);
                var firstItem = group.First();
                
                var (category, _, _) = SchedulesJobMapping.MappingScheduleEnums(
                    firstItem.JobCategory,
                    firstItem.SchedulesJobStatus,
                    firstItem.ScheduleJobStatusType
                );

                return new ResponseScheduleJobGroupDto
                {
                    TargetId = group.Key,
                    JobCategory = category,
                    StartScheduleJob = startJob != null ? MapToDto(startJob) : null,
                    EndScheduleJob = endJob != null ? MapToDto(endJob) : null
                };
            })
            .ToList();

        return new BaseResponse<List<ResponseScheduleJobGroupDto>> 
        { 
            Data = grouped, 
            IsSuccess = true, 
            Message = "Lấy danh sách schedule jobs thành công" 
        };
    }

    private static ResponseScheduleJobDto MapToDto(DataAccess.Entities.ScheduleJob.ScheduleJobLogger x)
    {
        var (category, status, type) = SchedulesJobMapping.MappingScheduleEnums(
            x.JobCategory,
            x.SchedulesJobStatus,
            x.ScheduleJobStatusType
        );

        return new ResponseScheduleJobDto
        {
            JobId = x.JobId,
            TargetId = x.TargetId,
            JobStartedAt = x.StartedTime,
            JobEndedAt = x.FinishedTime == DateTime.MinValue ? null : x.FinishedTime,
            FailedReason = x.FailedReason,
            ScheduleJobCategory = category,
            ScheduleJobStatus = status,
            ScheduleJobStatusType = type
        };
    }
}