using BusinessLayer.Dtos;
using BusinessLayer.Dtos.Admin.Responses;
using DataAccess;
using Microsoft.EntityFrameworkCore;
using Shared.MappingEnums;

namespace BusinessLayer.UseCases.Admin;

public interface IAdminReadScheduleBehavior
{
    Task<BaseResponse<List<ResponseScheduleJobDto>>> ListScheduleJob();
}
public class AdminReadScheduleUseCase : IAdminReadScheduleBehavior
{
    private readonly CinemaDbContext _cinemaDbContext;

    public AdminReadScheduleUseCase(CinemaDbContext cinemaDbContext)
    {
        _cinemaDbContext = cinemaDbContext;
    }

    public async Task<BaseResponse<List<ResponseScheduleJobDto>>> ListScheduleJob()
    {
        var rawData = await _cinemaDbContext.BackGroundJobLoggerEntity
            .OrderByDescending(x => x.StartedTime)
            .ToListAsync();

        var listScheduleJobDto = rawData.Select(x => {
            var (category, status, type) = SchedulesJobMapping.MappingScheduleEnums(
                x.JobCategory, 
                x.SchedulesJobStatus, 
                x.ScheduleJobStatusType
            );

            return new ResponseScheduleJobDto()
            {
                JobId = x.JobId,
                TargetId = x.TargetId,
                JobStartedAt = DateTime.SpecifyKind(x.StartedTime, DateTimeKind.Utc),
                JobEndedAt = x.FinishedTime == DateTime.MinValue ? null : (DateTime?)DateTime.SpecifyKind(x.FinishedTime, DateTimeKind.Utc),
                FailedReason = x.FailedReason,
                ScheduleJobCategory = category,
                ScheduleJobStatus = status,
                ScheduleJobStatusType = type
            };
        }).ToList();

        return new BaseResponse<List<ResponseScheduleJobDto>> { Data = listScheduleJobDto, IsSuccess = true, Message = "" };
    }
}