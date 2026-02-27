using BusinessLayer.Dtos;
using BusinessLayer.Dtos.Admin;
using BusinessLayer.UseCases.Admin;

namespace BusinessLayer.Services.Admin.ScheduleJobs;

public class AdminReadScheduleJobService
{
    private readonly IAdminReadScheduleBehavior _iAdminReadScheduleBehavior;

    public AdminReadScheduleJobService(IAdminReadScheduleBehavior iAdminReadScheduleBehavior)
    {
        _iAdminReadScheduleBehavior = iAdminReadScheduleBehavior;
    }

    public async Task<BaseResponse<List<ResponseScheduleJobDto>>> GetAllSchedulesJobs()
    {
        var results = await _iAdminReadScheduleBehavior.ListScheduleJob();
        return results;
    }
}