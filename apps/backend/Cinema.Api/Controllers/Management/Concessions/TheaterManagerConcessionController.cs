using System.Security.Claims;
using Cinema.Application.Dtos.Concessions;
using Cinema.Application.UseCases.Concessions;
using Cinema.Application.UseCases.Concessions.StockRequests;
using Cinema.Application.UseCases.Concessions.WasteReports;
using Cinema.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Cinema.Api.Controllers.Management.Concessions;

/// <summary>Xem danh mục, tồn kho, tạo yêu cầu nhập hàng và báo cáo hao hụt — dành cho Quản lý rạp (TheaterManager).</summary>
[ApiController]
[Authorize(Policy = "TheaterManager")]
[Route("api/TheaterManager/Concessions")]
[Route("api/v1/TheaterManager/Concessions")]
[Tags("Theater Manager - Concessions & Inventory")]
[ApiExplorerSettings(GroupName = "v1-theater-manager")]
public class TheaterManagerConcessionController : ControllerBase
{
    private readonly GetConcessionProductsUseCase _getConcessionProductsUseCase;
    private readonly GetInventoryStatusUseCase _getInventoryStatusUseCase;
    private readonly GetInventoryHistoryUseCase _getInventoryHistoryUseCase;
    private readonly CreateStockRequestUseCase _createStockRequestUseCase;
    private readonly GetStockRequestsUseCase _getStockRequestsUseCase;
    private readonly ReceiveStockRequestUseCase _receiveStockRequestUseCase;
    private readonly CreateWasteReportUseCase _createWasteReportUseCase;
    private readonly GetWasteReportsUseCase _getWasteReportsUseCase;

    public TheaterManagerConcessionController(
        GetConcessionProductsUseCase getConcessionProductsUseCase,
        GetInventoryStatusUseCase getInventoryStatusUseCase,
        GetInventoryHistoryUseCase getInventoryHistoryUseCase,
        CreateStockRequestUseCase createStockRequestUseCase,
        GetStockRequestsUseCase getStockRequestsUseCase,
        ReceiveStockRequestUseCase receiveStockRequestUseCase,
        CreateWasteReportUseCase createWasteReportUseCase,
        GetWasteReportsUseCase getWasteReportsUseCase)
    {
        _getConcessionProductsUseCase = getConcessionProductsUseCase;
        _getInventoryStatusUseCase = getInventoryStatusUseCase;
        _getInventoryHistoryUseCase = getInventoryHistoryUseCase;
        _createStockRequestUseCase = createStockRequestUseCase;
        _getStockRequestsUseCase = getStockRequestsUseCase;
        _receiveStockRequestUseCase = receiveStockRequestUseCase;
        _createWasteReportUseCase = createWasteReportUseCase;
        _getWasteReportsUseCase = getWasteReportsUseCase;
    }

    private Guid? GetCurrentUserId()
    {
        var sid = User.FindFirstValue(ClaimTypes.Sid);
        return Guid.TryParse(sid, out var userId) ? userId : null;
    }

    [HttpGet("{cinemaId:guid}/products")]
    public async Task<IActionResult> GetProducts(Guid cinemaId)
        => Ok(await _getConcessionProductsUseCase.ExecuteAsync(cinemaId));

    [HttpGet("{cinemaId:guid}/inventory")]
    public async Task<IActionResult> GetInventoryStatus(Guid cinemaId)
        => Ok(await _getInventoryStatusUseCase.ExecuteAsync(cinemaId));

    [HttpGet("{cinemaId:guid}/inventory/history")]
    public async Task<IActionResult> GetInventoryHistory(Guid cinemaId, [FromQuery] ReqInventoryHistoryFilterDto filter)
        => Ok(await _getInventoryHistoryUseCase.ExecuteAsync(cinemaId, filter));

    [HttpPost("stock-requests")]
    public async Task<IActionResult> CreateStockRequest([FromBody] ReqCreateStockRequestDto dto)
        => Ok(await _createStockRequestUseCase.ExecuteAsync(dto, GetCurrentUserId()));

    [HttpGet("{cinemaId:guid}/stock-requests")]
    public async Task<IActionResult> GetStockRequests(Guid cinemaId, [FromQuery] StockRequestStatus? status)
        => Ok(await _getStockRequestsUseCase.ExecuteAsync(cinemaId, status));

    [HttpPost("stock-requests/{id:guid}/receive")]
    public async Task<IActionResult> ReceiveStockRequest(Guid id, [FromBody] ReqReceiveStockRequestDto dto)
        => Ok(await _receiveStockRequestUseCase.ExecuteAsync(id, dto, GetCurrentUserId()));

    [HttpPost("waste-reports")]
    public async Task<IActionResult> CreateWasteReport([FromBody] ReqCreateWasteReportDto dto)
        => Ok(await _createWasteReportUseCase.ExecuteAsync(dto, GetCurrentUserId()));

    [HttpGet("{cinemaId:guid}/waste-reports")]
    public async Task<IActionResult> GetWasteReports(Guid cinemaId, [FromQuery] WasteReportStatus? status)
        => Ok(await _getWasteReportsUseCase.ExecuteAsync(cinemaId, status));
}
