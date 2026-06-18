using BusinessLayer.Services.Admin.ScheduleJobs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ApiLayer.Controllers.Admin;

[ApiController]
[Authorize(Policy = "Admin")]
[Route("api/v1/[controller]")]
[ApiExplorerSettings(GroupName = "v1-admin")]
public class ScheduleJobsController : ControllerBase
{
    private readonly AdminReadScheduleJobService _readScheduleJobService;

    public ScheduleJobsController(AdminReadScheduleJobService readScheduleJobService)
    {
        _readScheduleJobService = readScheduleJobService;
    }

    [HttpGet]
    public async Task<IActionResult> Get()
    {
        var result = await _readScheduleJobService.GetAllSchedulesJobs();
        return Ok(result);
    }
}