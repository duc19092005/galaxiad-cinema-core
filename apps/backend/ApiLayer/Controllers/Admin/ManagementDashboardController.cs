using BusinessLayer.Services.Admin.Dashboard;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ApiLayer.Controllers.Admin;

[ApiController]
[Authorize(Roles = "Admin,FacilitiesManager,TheaterManager,MovieManager")]
[Route("api/v1/admin/dashboard")]
[Tags("Admin - Management Dashboard")]
[ApiExplorerSettings(GroupName = "v1-admin")]
public class ManagementDashboardController : ControllerBase
{
    private readonly ManagementDashboardService _dashboardService;

    public ManagementDashboardController(ManagementDashboardService dashboardService)
    {
        _dashboardService = dashboardService;
    }

    [HttpGet("management")]
    public async Task<IActionResult> GetManagementDashboard([FromQuery] Guid? cinemaId)
    {
        var result = await _dashboardService.GetDashboardAsync(cinemaId);
        return Ok(result);
    }
}
