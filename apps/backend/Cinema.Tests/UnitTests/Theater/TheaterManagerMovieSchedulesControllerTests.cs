using Moq;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Cinema.Api.Controllers.Management.Theaters;
using Cinema.Application.Dtos;
using Cinema.Application.Dtos.TheaterManager;
using Cinema.Application.UseCases.TheaterManager;
using Cinema.Application.Exceptions;

namespace Cinema.Tests.UnitTests.Theater;

public class TheaterManagerMovieSchedulesControllerTests
{
    private readonly Mock<CreateMovieScheduleUseCase> _createShowtimeUseCase;
    private readonly Mock<GetCinemaShowtimesUseCase> _getShowtimesUseCase;
    private readonly Mock<DeleteMovieScheduleUseCase> _deleteShowtimeUseCase;
    private readonly Mock<ReadMovieSchedules> _checkConflictUseCase;
    private readonly TheaterManagerMovieSchedulesController _controller;

    public TheaterManagerMovieSchedulesControllerTests()
    {
        _createShowtimeUseCase = new Mock<CreateMovieScheduleUseCase>();
        _getShowtimesUseCase = new Mock<GetCinemaShowtimesUseCase>();
        _deleteShowtimeUseCase = new Mock<DeleteMovieScheduleUseCase>();
        _checkConflictUseCase = new Mock<ReadMovieSchedules>();
        _controller = new TheaterManagerMovieSchedulesController(
            _createShowtimeUseCase.Object,
            _getShowtimesUseCase.Object,
            _deleteShowtimeUseCase.Object,
            _checkConflictUseCase.Object);
    }

    [Fact]
    public async Task CreateShowtime_ValidData_ReturnsOk()
    {
        var request = new ReqCreateShowtimeDto
        {
            MovieId = Guid.NewGuid(),
            AuditoriumId = Guid.NewGuid(),
            StartTime = DateTime.UtcNow.AddDays(1).Date.AddHours(19),
            MovieFormatId = Guid.NewGuid()
        };

        var response = new BaseResponse<object>
        {
            IsSuccess = true,
            Data = new { ScheduleId = Guid.NewGuid() }
        };

        _createShowtimeUseCase.Setup(x => x.ExecuteAsync(It.IsAny<ReqCreateShowtimeDto>()))
            .ReturnsAsync(response);

        var result = await _controller.CreateShowtime(request);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task CreateShowtime_ConflictTime_ThrowsAppException()
    {
        var request = new ReqCreateShowtimeDto
        {
            MovieId = Guid.NewGuid(),
            AuditoriumId = Guid.NewGuid(),
            StartTime = DateTime.UtcNow.AddDays(1).Date.AddHours(19)
        };

        _createShowtimeUseCase.Setup(x => x.ExecuteAsync(It.IsAny<ReqCreateShowtimeDto>()))
            .ThrowsAsync(new AppException("Showtime conflicts with existing schedule", 409));

        await Assert.ThrowsAsync<AppException>(() => _controller.CreateShowtime(request));
    }

    [Fact]
    public async Task GetShowtimes_ValidParams_ReturnsList()
    {
        var cinemaId = Guid.NewGuid();
        var response = new BaseResponse<object>
        {
            IsSuccess = true,
            Data = new[]
            {
                new { ScheduleId = "s1", MovieTitle = "Movie 1", StartTime = DateTime.UtcNow },
                new { ScheduleId = "s2", MovieTitle = "Movie 2", StartTime = DateTime.UtcNow.AddHours(3) }
            }
        };

        _getShowtimesUseCase.Setup(x => x.ExecuteAsync(cinemaId, It.IsAny<DateTime>(), It.IsAny<DateTime>()))
            .ReturnsAsync(response);

        var result = await _controller.GetShowtimes(cinemaId, DateTime.UtcNow.Date, DateTime.UtcNow.Date.AddDays(7));

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task DeleteShowtime_ValidId_ReturnsOk()
    {
        var scheduleId = Guid.NewGuid();
        var response = new BaseResponse<object>
        {
            IsSuccess = true,
            Message = "Showtime deleted"
        };

        _deleteShowtimeUseCase.Setup(x => x.ExecuteAsync(scheduleId))
            .ReturnsAsync(response);

        var result = await _controller.DeleteShowtime(scheduleId);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task DeleteShowtime_NonExistentId_ThrowsAppException()
    {
        var scheduleId = Guid.NewGuid();
        _deleteShowtimeUseCase.Setup(x => x.ExecuteAsync(scheduleId))
            .ThrowsAsync(new AppException("Showtime not found", 404));

        await Assert.ThrowsAsync<AppException>(() => _controller.DeleteShowtime(scheduleId));
    }
}
