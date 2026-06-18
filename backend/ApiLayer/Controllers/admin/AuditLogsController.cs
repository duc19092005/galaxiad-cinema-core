using BusinessLayer.Services.Admin.Audit;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ApiLayer.Controllers.admin;

[ApiController]
[Authorize(Roles = "Admin,FacilitiesManager,TheaterManager,MovieManager")]
[Route("api/v1/admin/audit-logs")]
[Tags("Admin - Audit Logs")]
[ApiExplorerSettings(GroupName = "v1-admin")]
public class AuditLogsController : ControllerBase
{
    private readonly AuditLogService _auditLogService;

    public AuditLogsController(AuditLogService auditLogService)
    {
        _auditLogService = auditLogService;
    }

    [HttpGet("recent")]
    public async Task<IActionResult> GetRecent([FromQuery] int take = 30)
    {
        var result = await _auditLogService.GetRecentAsync(take);
        return Ok(result);
    }
}
