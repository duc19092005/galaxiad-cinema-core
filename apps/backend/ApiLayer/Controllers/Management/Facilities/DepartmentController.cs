using BusinessLayer.Dtos;
using BusinessLayer.Dtos.FacilitiesManager.Cinemas.Requests;
using BusinessLayer.Services.FacilitiesManager.Cinemas;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ApiLayer.Controllers.Management.Facilities;

[ApiController]
[Route("api/facilities/departments")]
[Tags("Facilities Manager - Departments")]
[ApiExplorerSettings(GroupName = "v1-facilities-manager")]
public class DepartmentController : ControllerBase
{
    private readonly FacilitiesManageDepartmentService _departmentService;

    public DepartmentController(FacilitiesManageDepartmentService departmentService)
    {
        _departmentService = departmentService;
    }

    /// <summary>Lấy danh sách phòng ban thu ngân của một rạp</summary>
    [HttpGet]
    [Authorize(Roles = "FacilitiesManager,TheaterManager,Admin")]
    public async Task<IActionResult> GetDepartments([FromQuery] Guid cinemaId)
    {
        var results = await _departmentService.GetDepartmentsAsync(cinemaId);
        return Ok(results);
    }

    /// <summary>Tạo phòng ban mới + tự động tạo tài khoản quầy</summary>
    [HttpPost]
    [Authorize(Roles = "FacilitiesManager,Admin")]
    public async Task<IActionResult> CreateDepartment([FromBody] CreateDepartmentReqDto request)
    {
        var results = await _departmentService.CreateDepartmentAsync(request);
        return Ok(results);
    }

    /// <summary>Cập nhật thông tin phòng ban</summary>
    [HttpPut("{id}")]
    [Authorize(Roles = "FacilitiesManager,Admin")]
    public async Task<IActionResult> UpdateDepartment(Guid id, [FromBody] UpdateDepartmentReqDto request)
    {
        var results = await _departmentService.UpdateDepartmentAsync(id, request);
        return Ok(results);
    }

    /// <summary>Vô hiệu hoá phòng ban</summary>
    [HttpDelete("{id}")]
    [Authorize(Roles = "FacilitiesManager,Admin")]
    public async Task<IActionResult> DeleteDepartment(Guid id)
    {
        var results = await _departmentService.DeleteDepartmentAsync(id);
        return Ok(results);
    }
}
