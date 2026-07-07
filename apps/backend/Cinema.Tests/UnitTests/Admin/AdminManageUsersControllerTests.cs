using Moq;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Cinema.Api.Controllers.Admin;
using Cinema.Application.Dtos;
using Cinema.Application.Dtos.Admin.Requests;
using Cinema.Application.Dtos.Admin.Responses;
using Cinema.Application.UseCases.Admin;
using Cinema.Application.Exceptions;

namespace Cinema.Tests.UnitTests.Admin;

public class AdminManageUsersControllerTests
{
    private readonly Mock<GetAllUsersUseCase> _getAllUsersUseCase;
    private readonly Mock<GetUserRolesUseCase> _getUserDetailUseCase;
    private readonly Mock<CreateUserUseCase> _createStaffAccountUseCase;
    private readonly Mock<AssignRoleToUserUseCase> _updateUserRoleUseCase;
    private readonly Mock<GetAllUsersUseCase> _searchUsersUseCase;
    private readonly Mock<AssignCinemaToManagerUseCase> _assignCinemaToStaffUseCase;
    private readonly AdminManageUsersController _controller;

    public AdminManageUsersControllerTests()
    {
        _getAllUsersUseCase = new Mock<GetAllUsersUseCase>();
        _getUserDetailUseCase = new Mock<GetUserRolesUseCase>();
        _createStaffAccountUseCase = new Mock<CreateUserUseCase>();
        _updateUserRoleUseCase = new Mock<AssignRoleToUserUseCase>();
        _searchUsersUseCase = new Mock<GetAllUsersUseCase>();
        _assignCinemaToStaffUseCase = new Mock<AssignCinemaToManagerUseCase>();
        _controller = new AdminManageUsersController(
            _getAllUsersUseCase.Object,
            _getUserDetailUseCase.Object,
            _createStaffAccountUseCase.Object,
            _updateUserRoleUseCase.Object,
            _searchUsersUseCase.Object,
            _assignCinemaToStaffUseCase.Object);
    }

    [Fact]
    public async Task GetAllUsers_AdminRole_ReturnsUserList()
    {
        var response = new BaseResponse<object>
        {
            IsSuccess = true,
            Data = new
            {
                Items = new[]
                {
                    new { UserId = "u1", Username = "User 1", Roles = new[] { "Customer" } },
                    new { UserId = "u2", Username = "User 2", Roles = new[] { "Admin" } }
                },
                TotalPages = 1
            }
        };

        _getAllUsersUseCase.Setup(x => x.ExecuteAsync(It.IsAny<int>(), It.IsAny<int>()))
            .ReturnsAsync(response);

        var result = await _controller.GetAllUsers(0, 10);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task GetUserDetail_ValidId_ReturnsFullProfile()
    {
        var userId = Guid.NewGuid();
        var response = new BaseResponse<object>
        {
            IsSuccess = true,
            Data = new { UserId = userId, Username = "Test User", Email = "test@test.com" }
        };

        _getUserDetailUseCase.Setup(x => x.ExecuteAsync(userId))
            .ReturnsAsync(response);

        var result = await _controller.GetUserDetail(userId);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task GetUserDetail_InvalidId_ThrowsAppException()
    {
        var userId = Guid.NewGuid();
        _getUserDetailUseCase.Setup(x => x.ExecuteAsync(userId))
            .ThrowsAsync(new AppException("User not found", 404));

        await Assert.ThrowsAsync<AppException>(() => _controller.GetUserDetail(userId));
    }

    [Fact]
    public async Task CreateStaffAccount_ValidRequest_ReturnsOk()
    {
        var request = new ReqCreateStaffAccountDto
        {
            Email = "staff@cinema.com",
            FullName = "Staff Member",
            Role = "Cashier"
        };

        var response = new BaseResponse<object>
        {
            IsSuccess = true,
            Message = "Staff account created"
        };

        _createStaffAccountUseCase.Setup(x => x.ExecuteAsync(It.IsAny<ReqCreateStaffAccountDto>()))
            .ReturnsAsync(response);

        var result = await _controller.CreateStaffAccount(request);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task UpdateUserRole_ValidRequest_ReturnsOk()
    {
        var userId = Guid.NewGuid();
        var request = new ReqUpdateUserRoleDto { Roles = new List<string> { "Admin" } };

        var response = new BaseResponse<object>
        {
            IsSuccess = true,
            Message = "Role updated"
        };

        _updateUserRoleUseCase.Setup(x => x.ExecuteAsync(userId, It.IsAny<ReqUpdateUserRoleDto>()))
            .ReturnsAsync(response);

        var result = await _controller.UpdateUserRole(userId, request);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task SearchUsers_WithKeyword_ReturnsFilteredResults()
    {
        var response = new BaseResponse<object>
        {
            IsSuccess = true,
            Data = new { Items = new[] { new { Username = "John Doe" } } }
        };

        _searchUsersUseCase.Setup(x => x.ExecuteAsync("John", It.IsAny<int>(), It.IsAny<int>()))
            .ReturnsAsync(response);

        var result = await _controller.SearchUsers("John", 0, 10);

        result.Should().BeOfType<OkObjectResult>();
    }
}
