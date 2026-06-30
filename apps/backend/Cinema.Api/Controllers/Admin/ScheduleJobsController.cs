using Cinema.Application.UseCases.Admin;
using Cinema.Application.Interfaces.Admin;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Cinema.Api.Controllers.Admin;

[ApiController]
[Authorize(Policy = "Admin")]
[Route("api/v1/[controller]")]
[ApiExplorerSettings(GroupName = "v1-admin")]
public class ScheduleJobsController : ControllerBase
{
    private readonly IAdminReadScheduleBehavior _adminReadScheduleBehavior;

    public ScheduleJobsController(IAdminReadScheduleBehavior adminReadScheduleBehavior)
    {
        _adminReadScheduleBehavior = adminReadScheduleBehavior;
    }

    [HttpGet]
    public async Task<IActionResult> Get()
    {
        var result = await _adminReadScheduleBehavior.ListScheduleJob();
        return Ok(result);
    }
}