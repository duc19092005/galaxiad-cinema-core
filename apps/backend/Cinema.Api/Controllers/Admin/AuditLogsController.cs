using Cinema.Application.UseCases.Admin.Audit;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Cinema.Api.Controllers.Admin;

[ApiController]
[Authorize(Roles = "Admin,FacilitiesManager,TheaterManager,MovieManager")]
[Route("api/v1/admin/audit-logs")]
[Tags("Admin - Audit Logs")]
[ApiExplorerSettings(GroupName = "v1-admin")]
public class AuditLogsController : ControllerBase
{
    private readonly GetRecentAuditLogsUseCase _getRecentAuditLogsUseCase;

    public AuditLogsController(GetRecentAuditLogsUseCase getRecentAuditLogsUseCase)
    {
        _getRecentAuditLogsUseCase = getRecentAuditLogsUseCase;
    }

    [HttpGet("recent")]
    public async Task<IActionResult> GetRecent([FromQuery] int take = 30)
    {
        var result = await _getRecentAuditLogsUseCase.ExecuteAsync(take);
        return Ok(result);
    }
}
