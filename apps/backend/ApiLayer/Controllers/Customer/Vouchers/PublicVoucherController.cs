using System;
using System.Security.Claims;
using System.Threading.Tasks;
using BusinessLayer.Services.Vouchers;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Shared.Exceptions;

namespace ApiLayer.Controllers.Customer.Vouchers;

[ApiController]
[Authorize]
[Route("api/v1/public/vouchers")]
[Tags("Public - Voucher Store & Wallet")]
[ApiExplorerSettings(GroupName = "v1-user")]
public class PublicVoucherController : ControllerBase
{
    private readonly VoucherService _voucherService;

    public PublicVoucherController(VoucherService voucherService)
    {
        _voucherService = voucherService;
    }

    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> GetActiveVouchers()
    {
        var result = await _voucherService.GetActiveVouchersAsync();
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

        var result = await _voucherService.RedeemVoucherAsync(userId, id);
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

        var result = await _voucherService.GetMyVouchersAsync(userId);
        return Ok(result);
    }
}
