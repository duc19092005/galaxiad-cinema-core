using Moq;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Cinema.Api.Controllers.Management.Facilities;
using Cinema.Application.Dtos;
using Cinema.Application.Dtos.FacilitiesManager;
using Cinema.Application.UseCases.FacilitiesManager;
using Cinema.Application.Exceptions;

namespace Cinema.Tests.UnitTests.Management;

public class CinemaControllerTests
{
    private readonly Mock<CreateCinemaUseCase> _createCinemaUseCase;
    private readonly Mock<UpdateCinemaUseCase> _updateCinemaUseCase;
    private readonly Mock<GetAllCinemasUseCase> _getAllCinemasUseCase;
    private readonly Mock<GetCinemaByIdUseCase> _getCinemaDetailUseCase;
    private readonly CinemaController _controller;

    public CinemaControllerTests()
    {
        _createCinemaUseCase = new Mock<CreateCinemaUseCase>();
        _updateCinemaUseCase = new Mock<UpdateCinemaUseCase>();
        _getAllCinemasUseCase = new Mock<GetAllCinemasUseCase>();
        _getCinemaDetailUseCase = new Mock<GetCinemaByIdUseCase>();
        _controller = new CinemaController(
            _createCinemaUseCase.Object,
            _updateCinemaUseCase.Object,
            _getAllCinemasUseCase.Object,
            _getCinemaDetailUseCase.Object);
    }

    [Fact]
    public async Task CreateCinema_ValidData_ReturnsOk()
    {
        var request = new ReqCreateCinemaDto
        {
            CinemaName = "New Cinema",
            Address = "123 Main St",
            City = "Ho Chi Minh",
            Latitude = 10.7769,
            Longitude = 106.7009
        };

        var response = new BaseResponse<object>
        {
            IsSuccess = true,
            Data = new { CinemaId = Guid.NewGuid() }
        };

        _createCinemaUseCase.Setup(x => x.ExecuteAsync(It.IsAny<ReqCreateCinemaDto>()))
            .ReturnsAsync(response);

        var result = await _controller.CreateCinema(request);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task UpdateCinema_ValidId_ReturnsOk()
    {
        var cinemaId = Guid.NewGuid();
        var request = new ReqUpdateCinemaDto { CinemaName = "Updated Name" };
        var response = new BaseResponse<object>
        {
            IsSuccess = true,
            Message = "Cinema updated"
        };

        _updateCinemaUseCase.Setup(x => x.ExecuteAsync(cinemaId, It.IsAny<ReqUpdateCinemaDto>()))
            .ReturnsAsync(response);

        var result = await _controller.UpdateCinema(cinemaId, request);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task GetAllCinemas_ReturnsList()
    {
        var response = new BaseResponse<object>
        {
            IsSuccess = true,
            Data = new[]
            {
                new { CinemaId = "c1", CinemaName = "Cinema 1" },
                new { CinemaId = "c2", CinemaName = "Cinema 2" }
            }
        };

        _getAllCinemasUseCase.Setup(x => x.ExecuteAsync())
            .ReturnsAsync(response);

        var result = await _controller.GetAllCinemas();

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task GetCinemaDetail_ValidId_ReturnsDetail()
    {
        var cinemaId = Guid.NewGuid();
        var response = new BaseResponse<object>
        {
            IsSuccess = true,
            Data = new { CinemaId = cinemaId, CinemaName = "Test Cinema", City = "HCM" }
        };

        _getCinemaDetailUseCase.Setup(x => x.ExecuteAsync(cinemaId))
            .ReturnsAsync(response);

        var result = await _controller.GetCinemaDetail(cinemaId);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task GetCinemaDetail_InvalidId_ThrowsAppException()
    {
        var cinemaId = Guid.NewGuid();
        _getCinemaDetailUseCase.Setup(x => x.ExecuteAsync(cinemaId))
            .ThrowsAsync(new AppException("Cinema not found", 404));

        await Assert.ThrowsAsync<AppException>(() => _controller.GetCinemaDetail(cinemaId));
    }
}
