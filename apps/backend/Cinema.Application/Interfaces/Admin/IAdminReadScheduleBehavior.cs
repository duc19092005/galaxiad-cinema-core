using Cinema.Application.Dtos;
using Cinema.Application.Dtos.Admin.Responses;

namespace Cinema.Application.Interfaces.Admin;

public interface IAdminReadScheduleBehavior
{
    Task<BaseResponse<List<ResponseScheduleJobGroupDto>>> ListScheduleJob();
}
