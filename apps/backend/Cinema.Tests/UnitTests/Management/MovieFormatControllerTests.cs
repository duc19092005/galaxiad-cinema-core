using Moq;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Cinema.Api.Controllers.Management.Facilities;
using Cinema.Application.Dtos;
using Cinema.Application.Dtos.Facilities;
using Cinema.Application.UseCases.Facilities;

namespace Cinema.Tests.UnitTests.Management;

public class MovieFormatControllerTests
{
    private readonly Mock<GetAllMovieFormatsUseCase> _getAllUseCase;
    private readonly Mock<CreateMovieFormatUseCase> _createUseCase;
    private readonly Mock<UpdateMovieFormatUseCase> _updateUseCase;
    private readonly Mock<DeleteMovieFormatUseCase> _deleteUseCase;
    private readonly MovieFormatControllerController _controller;

    public MovieFormatControllerTests()
    {
        _getAllUseCase = new Mock<GetAllMovieFormatsUseCase>();
        _createUseCase = new Mock<CreateMovieFormatUseCase>();
        _updateUseCase = new Mock<UpdateMovieFormatUseCase>();
        _deleteUseCase = new Mock<DeleteMovieFormatUseCase>();
        _controller = new MovieFormatControllerController(
            _getAllUseCase.Object,
            _createUseCase.Object,
            _updateUseCase.Object,
            _deleteUseCase.Object);
    }

    [Fact]
    public async Task GetAllMovieFormats_ReturnsList()
    {
        var response = new BaseResponse<object>
        {
            IsSuccess = true,
            Data = new[]
            {
                new { FormatId = "f1", FormatName = "IMAX" },
                new { FormatId = "f2", FormatName = "3D" },
                new { FormatId = "f3", FormatName = "2D" }
            }
        };

        _getAllUseCase.Setup(x => x.ExecuteAsync())
            .ReturnsAsync(response);

        var result = await _controller.GetAllMovieFormats();

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task CreateMovieFormat_ValidData_ReturnsOk()
    {
        var request = new ReqCreateMovieFormatDto { FormatName = "4DX" };
        var response = new BaseResponse<object>
        {
            IsSuccess = true,
            Data = new { FormatId = Guid.NewGuid() }
        };

        _createUseCase.Setup(x => x.ExecuteAsync(It.IsAny<ReqCreateMovieFormatDto>()))
            .ReturnsAsync(response);

        var result = await _controller.CreateMovieFormat(request);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task UpdateMovieFormat_ValidData_ReturnsOk()
    {
        var formatId = Guid.NewGuid();
        var request = new ReqUpdateMovieFormatDto { FormatName = "IMAX 3D" };
        var response = new BaseResponse<object>
        {
            IsSuccess = true,
            Message = "Format updated"
        };

        _updateUseCase.Setup(x => x.ExecuteAsync(formatId, It.IsAny<ReqUpdateMovieFormatDto>()))
            .ReturnsAsync(response);

        var result = await _controller.UpdateMovieFormat(formatId, request);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task DeleteMovieFormat_ValidId_ReturnsOk()
    {
        var formatId = Guid.NewGuid();
        var response = new BaseResponse<object>
        {
            IsSuccess = true,
            Message = "Format deleted"
        };

        _deleteUseCase.Setup(x => x.ExecuteAsync(formatId))
            .ReturnsAsync(response);

        var result = await _controller.DeleteMovieFormat(formatId);

        result.Should().BeOfType<OkObjectResult>();
    }
}
