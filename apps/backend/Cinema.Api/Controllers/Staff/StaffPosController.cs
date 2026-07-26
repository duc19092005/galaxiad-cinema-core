using Cinema.Application.Dtos.Concessions;
using Cinema.Application.UseCases.Concessions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Cinema.Api.Controllers.Staff;

/// <summary>Bán đồ ăn thức uống tại quầy POS, dành cho nhân viên bán vé/thu ngân.</summary>
[ApiController]
[Authorize]
[Route("api/Staff/Pos")]
[Route("api/v1/Staff/Pos")]
[Tags("Staff - POS Concessions")]
[ApiExplorerSettings(GroupName = "v1-user")]
public class StaffPosController : ControllerBase
{
    private readonly GetConcessionMenuUseCase _getConcessionMenuUseCase;
    private readonly CheckConcessionStockUseCase _checkConcessionStockUseCase;
    private readonly SellConcessionPosUseCase _sellConcessionPosUseCase;

    public StaffPosController(
        GetConcessionMenuUseCase getConcessionMenuUseCase,
        CheckConcessionStockUseCase checkConcessionStockUseCase,
        SellConcessionPosUseCase sellConcessionPosUseCase)
    {
        _getConcessionMenuUseCase = getConcessionMenuUseCase;
        _checkConcessionStockUseCase = checkConcessionStockUseCase;
        _sellConcessionPosUseCase = sellConcessionPosUseCase;
    }

    private Guid GetCurrentUserId()
    {
        var sid = User.FindFirstValue(ClaimTypes.Sid);
        if (string.IsNullOrEmpty(sid) || !Guid.TryParse(sid, out var userId))
            throw new UnauthorizedAccessException("Cannot determine user identity.");
        return userId;
    }

    [HttpGet("{cinemaId:guid}/menu")]
    public async Task<IActionResult> GetMenu(Guid cinemaId)
        => Ok(await _getConcessionMenuUseCase.ExecuteAsync(cinemaId, onlineOnly: false));

    [HttpPost("stock-check")]
    public async Task<IActionResult> CheckStock([FromBody] ReqCheckConcessionStockDto dto)
        => Ok(await _checkConcessionStockUseCase.ExecuteAsync(dto));

    /// <summary>
    /// Bán tại quầy: nhân viên FE phải đảm bảo đơn có kèm ít nhất một vé/dịch vụ khác,
    /// backend không tự kiểm tra ràng buộc "không bán F&amp;B đơn độc" ở endpoint này vì đây
    /// là API nội bộ dùng bởi luồng bán hàng tổng hợp tại quầy (đã gộp vé + bắp nước trong 1 request ở tầng trên).
    /// </summary>
    [HttpPost("sell")]
    public async Task<IActionResult> Sell([FromBody] ReqSellConcessionPosDto dto)
    {
        dto.StaffId = GetCurrentUserId();
        return Ok(await _sellConcessionPosUseCase.ExecuteAsync(dto));
    }
}
