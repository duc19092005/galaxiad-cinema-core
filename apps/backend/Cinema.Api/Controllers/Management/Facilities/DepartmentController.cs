using System;
using System.Threading.Tasks;
using Cinema.Application.Dtos.FacilitiesManager.Cinemas.Requests;
using Cinema.Application.UseCases.FacilitiesManager.Cinemas;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Cinema.Api.Controllers.Management.Facilities;

[ApiController]
[Route("api/facilities/departments")]
[Tags("Facilities Manager - Departments")]
[ApiExplorerSettings(GroupName = "v1-facilities-manager")]
public class DepartmentController : ControllerBase
{
    private readonly GetDepartmentsUseCase _getDepartmentsUseCase;
    private readonly CreateDepartmentUseCase _createDepartmentUseCase;
    private readonly UpdateDepartmentUseCase _updateDepartmentUseCase;
    private readonly DeleteDepartmentUseCase _deleteDepartmentUseCase;

    public DepartmentController(
        GetDepartmentsUseCase getDepartmentsUseCase,
        CreateDepartmentUseCase createDepartmentUseCase,
        UpdateDepartmentUseCase updateDepartmentUseCase,
        DeleteDepartmentUseCase deleteDepartmentUseCase)
    {
        _getDepartmentsUseCase = getDepartmentsUseCase;
        _createDepartmentUseCase = createDepartmentUseCase;
        _updateDepartmentUseCase = updateDepartmentUseCase;
        _deleteDepartmentUseCase = deleteDepartmentUseCase;
    }

    /// <summary>Lấy danh sách phòng ban thu ngân của một rạp</summary>
    [HttpGet]
    [Authorize(Roles = "FacilitiesManager,TheaterManager,Admin")]
    public async Task<IActionResult> GetDepartments([FromQuery] Guid cinemaId)
    {
        var results = await _getDepartmentsUseCase.ExecuteAsync(cinemaId);
        return Ok(results);
    }

    /// <summary>Tạo phòng ban mới + tự động tạo tài khoản quầy</summary>
    [HttpPost]
    [Authorize(Roles = "FacilitiesManager,Admin")]
    public async Task<IActionResult> CreateDepartment([FromBody] CreateDepartmentReqDto request)
    {
        var results = await _createDepartmentUseCase.ExecuteAsync(request);
        return Ok(results);
    }

    /// <summary>Cập nhật thông tin phòng ban</summary>
    [HttpPut("{id}")]
    [Authorize(Roles = "FacilitiesManager,Admin")]
    public async Task<IActionResult> UpdateDepartment(Guid id, [FromBody] UpdateDepartmentReqDto request)
    {
        var results = await _updateDepartmentUseCase.ExecuteAsync(id, request);
        return Ok(results);
    }

    /// <summary>Vô hiệu hoá phòng ban</summary>
    [HttpDelete("{id}")]
    [Authorize(Roles = "FacilitiesManager,Admin")]
    public async Task<IActionResult> DeleteDepartment(Guid id)
    {
        var results = await _deleteDepartmentUseCase.ExecuteAsync(id);
        return Ok(results);
    }
}
