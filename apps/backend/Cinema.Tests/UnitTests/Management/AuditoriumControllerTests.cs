using Moq;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Cinema.Api.Controllers.Management.Facilities;
using Cinema.Application.Dtos;
using Cinema.Application.Dtos.FacilitiesManager;
using Cinema.Application.UseCases.FacilitiesManager;
using Cinema.Application.Exceptions;

namespace Cinema.Tests.UnitTests.Management;

public class AuditoriumControllerTests
{
    private readonly Mock<CreateAuditoriumUseCase> _createAuditoriumUseCase;
    private readonly Mock<GetAuditoriumsByCinemaIdUseCase> _getAuditoriumsUseCase;
    private readonly Mock<UpdateAuditoriumUseCase> _updateAuditoriumUseCase;
    private readonly Mock<DeleteAuditoriumUseCase> _deleteAuditoriumUseCase;
    private readonly AuditoriumController _controller;

    public AuditoriumControllerTests()
    {
        _createAuditoriumUseCase = new Mock<CreateAuditoriumUseCase>();
        _getAuditoriumsUseCase = new Mock<GetAuditoriumsByCinemaIdUseCase>();
        _updateAuditoriumUseCase = new Mock<UpdateAuditoriumUseCase>();
        _deleteAuditoriumUseCase = new Mock<DeleteAuditoriumUseCase>();
        _controller = new AuditoriumController(
            _createAuditoriumUseCase.Object,
            _getAuditoriumsUseCase.Object,
            _updateAuditoriumUseCase.Object,
            _deleteAuditoriumUseCase.Object);
    }

    [Fact]
    public async Task CreateAuditorium_ValidData_ReturnsOk()
    {
        var cinemaId = Guid.NewGuid();
        var request = new ReqCreateAuditoriumDto
        {
            AuditoriumName = "Hall 1",
            SeatCapacity = 150
        };

        var response = new BaseResponse<object>
        {
            IsSuccess = true,
            Data = new { AuditoriumId = Guid.NewGuid() }
        };

        _createAuditoriumUseCase.Setup(x => x.ExecuteAsync(cinemaId, It.IsAny<ReqCreateAuditoriumDto>()))
            .ReturnsAsync(response);

        var result = await _controller.CreateAuditorium(cinemaId, request);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task CreateAuditorium_InvalidCinemaId_ThrowsAppException()
    {
        var cinemaId = Guid.NewGuid();
        var request = new ReqCreateAuditoriumDto { AuditoriumName = "Hall 1" };

        _createAuditoriumUseCase.Setup(x => x.ExecuteAsync(cinemaId, It.IsAny<ReqCreateAuditoriumDto>()))
            .ThrowsAsync(new AppException("Cinema not found", 404));

        await Assert.ThrowsAsync<AppException>(() => _controller.CreateAuditorium(cinemaId, request));
    }

    [Fact]
    public async Task GetAuditoriums_ValidCinemaId_ReturnsList()
    {
        var cinemaId = Guid.NewGuid();
        var response = new BaseResponse<object>
        {
            IsSuccess = true,
            Data = new[]
            {
                new { AuditoriumId = "a1", AuditoriumName = "Hall 1", SeatCapacity = 150 },
                new { AuditoriumId = "a2", AuditoriumName = "Hall 2", SeatCapacity = 200 }
            }
        };

        _getAuditoriumsUseCase.Setup(x => x.ExecuteAsync(cinemaId))
            .ReturnsAsync(response);

        var result = await _controller.GetAuditoriums(cinemaId);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task UpdateAuditorium_ValidData_ReturnsOk()
    {
        var auditoriumId = Guid.NewGuid();
        var request = new ReqUpdateAuditoriumDto { AuditoriumName = "Updated Hall" };
        var response = new BaseResponse<object>
        {
            IsSuccess = true,
            Message = "Auditorium updated"
        };

        _updateAuditoriumUseCase.Setup(x => x.ExecuteAsync(auditoriumId, It.IsAny<ReqUpdateAuditoriumDto>()))
            .ReturnsAsync(response);

        var result = await _controller.UpdateAuditorium(auditoriumId, request);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task DeleteAuditorium_ValidId_ReturnsOk()
    {
        var auditoriumId = Guid.NewGuid();
        var response = new BaseResponse<object>
        {
            IsSuccess = true,
            Message = "Auditorium deleted"
        };

        _deleteAuditoriumUseCase.Setup(x => x.ExecuteAsync(auditoriumId))
            .ReturnsAsync(response);

        var result = await _controller.DeleteAuditorium(auditoriumId);

        result.Should().BeOfType<OkObjectResult>();
    }
}
