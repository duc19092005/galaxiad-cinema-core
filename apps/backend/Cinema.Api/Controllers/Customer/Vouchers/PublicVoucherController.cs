using System;
using System.Security.Claims;
using System.Threading.Tasks;
using Cinema.Application.UseCases.Admin.Vouchers;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Cinema.Application.Exceptions;

namespace Cinema.Api.Controllers.Customer.Vouchers;

[ApiController]
[Authorize]
[Route("api/v1/public/vouchers")]
[Tags("Public - Voucher Store & Wallet")]
[ApiExplorerSettings(GroupName = "v1-user")]
public class PublicVoucherController : ControllerBase
{
    private readonly GetActiveVouchersUseCase _getActiveVouchersUseCase;
    private readonly RedeemVoucherUseCase _redeemVoucherUseCase;
    private readonly GetMyVouchersUseCase _getMyVouchersUseCase;

    public PublicVoucherController(
        GetActiveVouchersUseCase getActiveVouchersUseCase,
        RedeemVoucherUseCase redeemVoucherUseCase,
        GetMyVouchersUseCase getMyVouchersUseCase)
    {
        _getActiveVouchersUseCase = getActiveVouchersUseCase;
        _redeemVoucherUseCase = redeemVoucherUseCase;
        _getMyVouchersUseCase = getMyVouchersUseCase;
    }

    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> GetActiveVouchers()
    {
        var result = await _getActiveVouchersUseCase.ExecuteAsync();
        return Ok(result);
    }

    [HttpPost("{id}/redeem")]
    public async Task<IActionResult> RedeemVoucher(Guid id)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.Sid) ?? User.FindFirst(ClaimTypes.NameIdentifier);
        if (userIdClaim == null || !Guid.TryParse(userIdClaim.Value, out var userId))
        {
            throw new UnauthorizeException("Invalid or missing user identity in token.");
        }

        var result = await _redeemVoucherUseCase.ExecuteAsync(userId, id);
        return Ok(result);
    }

    [HttpGet("my-vouchers")]
    public async Task<IActionResult> GetMyVouchers()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.Sid) ?? User.FindFirst(ClaimTypes.NameIdentifier);
        if (userIdClaim == null || !Guid.TryParse(userIdClaim.Value, out var userId))
        {
            throw new UnauthorizeException("Invalid or missing user identity in token.");
        }

        var result = await _getMyVouchersUseCase.ExecuteAsync(userId);
        return Ok(result);
    }
}
