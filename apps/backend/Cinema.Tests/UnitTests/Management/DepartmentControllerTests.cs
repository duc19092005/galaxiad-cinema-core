using Moq;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Cinema.Api.Controllers.Management.Facilities;
using Cinema.Application.Dtos;
using Cinema.Application.Dtos.FacilitiesManager;
using Cinema.Application.UseCases.FacilitiesManager;
using Cinema.Application.Exceptions;

namespace Cinema.Tests.UnitTests.Management;

public class DepartmentControllerTests
{
    private readonly Mock<CreateDepartmentUseCase> _createUseCase;
    private readonly Mock<GetDepartmentsUseCase> _getUseCase;
    private readonly Mock<UpdateDepartmentUseCase> _updateUseCase;
    private readonly Mock<DeleteDepartmentUseCase> _deleteUseCase;
    private readonly DepartmentController _controller;

    public DepartmentControllerTests()
    {
        _createUseCase = new Mock<CreateDepartmentUseCase>();
        _getUseCase = new Mock<GetDepartmentsUseCase>();
        _updateUseCase = new Mock<UpdateDepartmentUseCase>();
        _deleteUseCase = new Mock<DeleteDepartmentUseCase>();
        _controller = new DepartmentController(
            _createUseCase.Object,
            _getUseCase.Object,
            _updateUseCase.Object,
            _deleteUseCase.Object);
    }

    [Fact]
    public async Task CreateDepartment_ValidData_ReturnsOk()
    {
        var request = new ReqCreateDepartmentDto { DepartmentName = "Box Office" };
        var response = new BaseResponse<object>
        {
            IsSuccess = true,
            Data = new { DepartmentId = Guid.NewGuid() }
        };

        _createUseCase.Setup(x => x.ExecuteAsync(It.IsAny<ReqCreateDepartmentDto>()))
            .ReturnsAsync(response);

        var result = await _controller.CreateDepartment(request);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task GetAllDepartments_ReturnsList()
    {
        var response = new BaseResponse<object>
        {
            IsSuccess = true,
            Data = new[]
            {
                new { DepartmentId = "d1", DepartmentName = "Box Office" },
                new { DepartmentId = "d2", DepartmentName = "Concessions" }
            }
        };

        _getUseCase.Setup(x => x.ExecuteAsync())
            .ReturnsAsync(response);

        var result = await _controller.GetAllDepartments();

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task UpdateDepartment_ValidData_ReturnsOk()
    {
        var deptId = Guid.NewGuid();
        var request = new ReqUpdateDepartmentDto { DepartmentName = "Updated Dept" };
        var response = new BaseResponse<object>
        {
            IsSuccess = true,
            Message = "Department updated"
        };

        _updateUseCase.Setup(x => x.ExecuteAsync(deptId, It.IsAny<ReqUpdateDepartmentDto>()))
            .ReturnsAsync(response);

        var result = await _controller.UpdateDepartment(deptId, request);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task DeleteDepartment_ValidId_ReturnsOk()
    {
        var deptId = Guid.NewGuid();
        var response = new BaseResponse<object>
        {
            IsSuccess = true,
            Message = "Department deleted"
        };

        _deleteUseCase.Setup(x => x.ExecuteAsync(deptId))
            .ReturnsAsync(response);

        var result = await _controller.DeleteDepartment(deptId);

        result.Should().BeOfType<OkObjectResult>();
    }
}
