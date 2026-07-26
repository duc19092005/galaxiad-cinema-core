using System.Security.Claims;
using Cinema.Application.Dtos.Concessions;
using Cinema.Application.UseCases.Concessions.StockRequests;
using Cinema.Application.UseCases.Concessions.WasteReports;
using Cinema.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Cinema.Api.Controllers.Management.Concessions;

/// <summary>Xử lý yêu cầu nhập hàng và duyệt báo cáo hao hụt — dành cho Quản lý kho tổng (WarehouseManager).</summary>
[ApiController]
[Authorize(Policy = "WarehouseManager")]
[Route("api/WarehouseManager")]
[Route("api/v1/WarehouseManager")]
[Tags("Warehouse Manager - Supply Chain & Waste")]
[ApiExplorerSettings(GroupName = "v1-warehouse-manager")]
public class WarehouseManagerController : ControllerBase
{
    private readonly GetStockRequestsUseCase _getStockRequestsUseCase;
    private readonly ApproveStockRequestUseCase _approveStockRequestUseCase;
    private readonly RejectStockRequestUseCase _rejectStockRequestUseCase;
    private readonly ShipStockRequestUseCase _shipStockRequestUseCase;
    private readonly GetWasteReportsUseCase _getWasteReportsUseCase;
    private readonly ReviewWasteReportUseCase _reviewWasteReportUseCase;

    public WarehouseManagerController(
        GetStockRequestsUseCase getStockRequestsUseCase,
        ApproveStockRequestUseCase approveStockRequestUseCase,
        RejectStockRequestUseCase rejectStockRequestUseCase,
        ShipStockRequestUseCase shipStockRequestUseCase,
        GetWasteReportsUseCase getWasteReportsUseCase,
        ReviewWasteReportUseCase reviewWasteReportUseCase)
    {
        _getStockRequestsUseCase = getStockRequestsUseCase;
        _approveStockRequestUseCase = approveStockRequestUseCase;
        _rejectStockRequestUseCase = rejectStockRequestUseCase;
        _shipStockRequestUseCase = shipStockRequestUseCase;
        _getWasteReportsUseCase = getWasteReportsUseCase;
        _reviewWasteReportUseCase = reviewWasteReportUseCase;
    }

    private Guid? GetCurrentUserId()
    {
        var sid = User.FindFirstValue(ClaimTypes.Sid);
        return Guid.TryParse(sid, out var userId) ? userId : null;
    }

    [HttpGet("StockRequests")]
    public async Task<IActionResult> GetStockRequests([FromQuery] Guid? cinemaId, [FromQuery] StockRequestStatus? status)
        => Ok(await _getStockRequestsUseCase.ExecuteAsync(cinemaId, status));

    [HttpPost("StockRequests/{id:guid}/approve")]
    public async Task<IActionResult> ApproveStockRequest(Guid id, [FromBody] ReqApproveStockRequestDto dto)
        => Ok(await _approveStockRequestUseCase.ExecuteAsync(id, dto, GetCurrentUserId()));

    [HttpPost("StockRequests/{id:guid}/reject")]
    public async Task<IActionResult> RejectStockRequest(Guid id, [FromBody] ReqRejectStockRequestDto dto)
        => Ok(await _rejectStockRequestUseCase.ExecuteAsync(id, dto, GetCurrentUserId()));

    [HttpPost("StockRequests/{id:guid}/ship")]
    public async Task<IActionResult> ShipStockRequest(Guid id)
        => Ok(await _shipStockRequestUseCase.ExecuteAsync(id, GetCurrentUserId()));

    [HttpGet("WasteReports")]
    public async Task<IActionResult> GetWasteReports([FromQuery] Guid? cinemaId, [FromQuery] WasteReportStatus? status)
        => Ok(await _getWasteReportsUseCase.ExecuteAsync(cinemaId, status));

    [HttpPost("WasteReports/{id:guid}/review")]
    public async Task<IActionResult> ReviewWasteReport(Guid id, [FromBody] ReqReviewWasteReportDto dto)
        => Ok(await _reviewWasteReportUseCase.ExecuteAsync(id, dto, GetCurrentUserId()));
}
