using Moq;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Cinema.Api.Controllers.Staff;
using Cinema.Application.Dtos;
using Cinema.Application.Dtos.Staff;
using Cinema.Application.UseCases.Staff;
using Cinema.Application.Exceptions;

namespace Cinema.Tests.UnitTests.Staff;

public class StaffShiftControllerTests
{
    private readonly Mock<RegisterShiftUseCase> _registerShiftUseCase;
    private readonly Mock<ClockInUseCase> _clockInUseCase;
    private readonly Mock<GetStaffShiftsUseCase> _getStaffShiftsUseCase;
    private readonly StaffShiftController _controller;

    public StaffShiftControllerTests()
    {
        _registerShiftUseCase = new Mock<RegisterShiftUseCase>();
        _clockInUseCase = new Mock<ClockInUseCase>();
        _getStaffShiftsUseCase = new Mock<GetStaffShiftsUseCase>();
        _controller = new StaffShiftController(
            _registerShiftUseCase.Object,
            _clockInUseCase.Object,
            _getStaffShiftsUseCase.Object);
    }

    [Fact]
    public async Task RegisterShift_ValidData_ReturnsOk()
    {
        var request = new ReqRegisterShiftDto
        {
            ShiftTemplateId = Guid.NewGuid(),
            RegistrationDate = DateTime.UtcNow.Date.AddDays(1)
        };

        var response = new BaseResponse<object>
        {
            IsSuccess = true,
            Message = "Shift registered"
        };

        _registerShiftUseCase.Setup(x => x.ExecuteAsync(It.IsAny<ReqRegisterShiftDto>()))
            .ReturnsAsync(response);

        var result = await _controller.RegisterShift(request);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RegisterShift_AlreadyRegistered_ThrowsAppException()
    {
        var request = new ReqRegisterShiftDto
        {
            ShiftTemplateId = Guid.NewGuid(),
            RegistrationDate = DateTime.UtcNow.Date.AddDays(1)
        };

        _registerShiftUseCase.Setup(x => x.ExecuteAsync(It.IsAny<ReqRegisterShiftDto>()))
            .ThrowsAsync(new AppException("Already registered for this shift", 400));

        await Assert.ThrowsAsync<AppException>(() => _controller.RegisterShift(request));
    }

    [Fact]
    public async Task ClockIn_WithFaceDescriptor_ReturnsOk()
    {
        var request = new ReqClockInDto
        {
            FaceDescriptor = new float[128],
            ShiftScheduleId = Guid.NewGuid()
        };

        var response = new BaseResponse<object>
        {
            IsSuccess = true,
            Message = "Clock-in successful"
        };

        _clockInUseCase.Setup(x => x.ExecuteAsync(It.IsAny<ReqClockInDto>()))
            .ReturnsAsync(response);

        var result = await _controller.ClockIn(request);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task ClockIn_FaceMismatch_ThrowsAppException()
    {
        var request = new ReqClockInDto
        {
            FaceDescriptor = new float[128],
            ShiftScheduleId = Guid.NewGuid()
        };

        _clockInUseCase.Setup(x => x.ExecuteAsync(It.IsAny<ReqClockInDto>()))
            .ThrowsAsync(new AppException("Face verification failed", 401));

        await Assert.ThrowsAsync<AppException>(() => _controller.ClockIn(request));
    }

    [Fact]
    public async Task GetMyShifts_ReturnsShiftList()
    {
        var response = new BaseResponse<object>
        {
            IsSuccess = true,
            Data = new[]
            {
                new { ShiftId = "s1", Date = DateTime.UtcNow, Status = "Registered" },
                new { ShiftId = "s2", Date = DateTime.UtcNow.AddDays(1), Status = "Approved" }
            }
        };

        _getStaffShiftsUseCase.Setup(x => x.ExecuteAsync())
            .ReturnsAsync(response);

        var result = await _controller.GetMyShifts();

        result.Should().BeOfType<OkObjectResult>();
    }
}
