using System;
using System.Threading.Tasks;
using BusinessLayer.Dtos.Vouchers;
using BusinessLayer.Services.Vouchers;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ApiLayer.Controllers.Admin;

[ApiController]
[Authorize(Roles = "Admin")]
[Route("api/v1/admin/vouchers")]
[Tags("Admin - Voucher Store Management")]
[ApiExplorerSettings(GroupName = "v1-admin")]
public class AdminVoucherController : ControllerBase
{
    private readonly VoucherService _voucherService;

    public AdminVoucherController(VoucherService voucherService)
    {
        _voucherService = voucherService;
    }

    [HttpPost]
    public async Task<IActionResult> CreateVoucher([FromBody] CreateVoucherDto dto)
    {
        var result = await _voucherService.CreateVoucherAsync(dto);
        return CreatedAtAction(nameof(GetVoucherById), new { id = result.VoucherId }, result);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateVoucher(Guid id, [FromBody] UpdateVoucherDto dto)
    {
        var result = await _voucherService.UpdateVoucherAsync(id, dto);
        return Ok(result);
    }

    [HttpGet]
    public async Task<IActionResult> GetAllVouchers()
    {
        var result = await _voucherService.GetAllVouchersAsync();
        return Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetVoucherById(Guid id)
    {
        var result = await _voucherService.GetVoucherByIdAsync(id);
        return Ok(result);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteVoucher(Guid id)
    {
        await _voucherService.DeleteVoucherAsync(id);
        return NoContent();
    }
}
