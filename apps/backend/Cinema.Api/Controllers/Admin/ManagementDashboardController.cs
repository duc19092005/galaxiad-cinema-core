using Cinema.Application.UseCases.Admin.Dashboard;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Cinema.Api.Controllers.Admin;

[ApiController]
[Authorize(Roles = "Admin,FacilitiesManager,TheaterManager,MovieManager")]
[Route("api/v1/admin/dashboard")]
[Tags("Admin - Management Dashboard")]
[ApiExplorerSettings(GroupName = "v1-admin")]
public class ManagementDashboardController : ControllerBase
{
    private readonly GetManagementDashboardUseCase _getDashboardUseCase;

    public ManagementDashboardController(GetManagementDashboardUseCase getDashboardUseCase)
    {
        _getDashboardUseCase = getDashboardUseCase;
    }

    [HttpGet("management")]
    public async Task<IActionResult> GetManagementDashboard([FromQuery] Guid? cinemaId)
    {
        var result = await _getDashboardUseCase.ExecuteAsync(cinemaId);
        return Ok(result);
    }
}
