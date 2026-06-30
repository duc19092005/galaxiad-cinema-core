using System;
using System.Threading.Tasks;
using Cinema.Application.Dtos.Vouchers;
using Cinema.Application.UseCases.Admin.Vouchers;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Cinema.Api.Controllers.Admin;

[ApiController]
[Authorize(Roles = "Admin")]
[Route("api/v1/admin/vouchers")]
[Tags("Admin - Voucher Store Management")]
[ApiExplorerSettings(GroupName = "v1-admin")]
public class AdminVoucherController : ControllerBase
{
    private readonly CreateVoucherUseCase _createVoucherUseCase;
    private readonly UpdateVoucherUseCase _updateVoucherUseCase;
    private readonly DeleteVoucherUseCase _deleteVoucherUseCase;
    private readonly GetAllVouchersUseCase _getAllVouchersUseCase;
    private readonly GetVoucherByIdUseCase _getVoucherByIdUseCase;

    public AdminVoucherController(
        CreateVoucherUseCase createVoucherUseCase,
        UpdateVoucherUseCase updateVoucherUseCase,
        DeleteVoucherUseCase deleteVoucherUseCase,
        GetAllVouchersUseCase getAllVouchersUseCase,
        GetVoucherByIdUseCase getVoucherByIdUseCase)
    {
        _createVoucherUseCase = createVoucherUseCase;
        _updateVoucherUseCase = updateVoucherUseCase;
        _deleteVoucherUseCase = deleteVoucherUseCase;
        _getAllVouchersUseCase = getAllVouchersUseCase;
        _getVoucherByIdUseCase = getVoucherByIdUseCase;
    }

    [HttpPost]
    public async Task<IActionResult> CreateVoucher([FromBody] CreateVoucherDto dto)
    {
        var result = await _createVoucherUseCase.ExecuteAsync(dto);
        return CreatedAtAction(nameof(GetVoucherById), new { id = result.VoucherId }, result);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateVoucher(Guid id, [FromBody] UpdateVoucherDto dto)
    {
        var result = await _updateVoucherUseCase.ExecuteAsync(id, dto);
        return Ok(result);
    }

    [HttpGet]
    public async Task<IActionResult> GetAllVouchers()
    {
        var result = await _getAllVouchersUseCase.ExecuteAsync();
        return Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetVoucherById(Guid id)
    {
        var result = await _getVoucherByIdUseCase.ExecuteAsync(id);
        return Ok(result);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteVoucher(Guid id)
    {
        await _deleteVoucherUseCase.ExecuteAsync(id);
        return NoContent();
    }
}
