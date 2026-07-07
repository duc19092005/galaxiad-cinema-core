using Moq;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Cinema.Api.Controllers.Management.Movies;
using Cinema.Application.Dtos;
using Cinema.Application.Dtos.MovieManager;
using Cinema.Application.UseCases.MovieManager.MovieInfos;
using Cinema.Application.Exceptions;

namespace Cinema.Tests.UnitTests.Management;

public class MovieControllerTests
{
    private readonly Mock<CreateMovieUseCase> _createMovieUseCase;
    private readonly Mock<UpdateMovieUseCase> _updateMovieUseCase;
    private readonly Mock<DeleteMovieUseCase> _deleteMovieUseCase;
    private readonly Mock<GetMovieInfosUseCase> _getAllMoviesUseCase;
    private readonly Mock<SetMovieActiveUseCase> _uploadImageUseCase;
    private readonly MovieController _controller;

    public MovieControllerTests()
    {
        _createMovieUseCase = new Mock<CreateMovieUseCase>();
        _updateMovieUseCase = new Mock<UpdateMovieUseCase>();
        _deleteMovieUseCase = new Mock<DeleteMovieUseCase>();
        _getAllMoviesUseCase = new Mock<GetMovieInfosUseCase>();
        _uploadImageUseCase = new Mock<SetMovieActiveUseCase>();
        _controller = new MovieController(
            _createMovieUseCase.Object,
            _updateMovieUseCase.Object,
            _deleteMovieUseCase.Object,
            _getAllMoviesUseCase.Object,
            _uploadImageUseCase.Object);
    }

    [Fact]
    public async Task CreateMovie_ValidData_ReturnsOk()
    {
        var request = new ReqCreateMovieDto
        {
            Title = "New Movie",
            Description = "A great movie",
            Duration = 120,
            ReleaseDate = DateTime.UtcNow.AddDays(30)
        };

        var response = new BaseResponse<object>
        {
            IsSuccess = true,
            Data = new { MovieId = Guid.NewGuid(), Title = "New Movie" }
        };

        _createMovieUseCase.Setup(x => x.ExecuteAsync(It.IsAny<ReqCreateMovieDto>()))
            .ReturnsAsync(response);

        var result = await _controller.CreateMovie(request);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task CreateMovie_MissingTitle_ThrowsAppException()
    {
        var request = new ReqCreateMovieDto { Title = "", Duration = 120 };

        _createMovieUseCase.Setup(x => x.ExecuteAsync(It.IsAny<ReqCreateMovieDto>()))
            .ThrowsAsync(new AppException("Title is required", 400));

        await Assert.ThrowsAsync<AppException>(() => _controller.CreateMovie(request));
    }

    [Fact]
    public async Task UpdateMovie_ValidId_ReturnsOk()
    {
        var movieId = Guid.NewGuid();
        var request = new ReqUpdateMovieDto { Title = "Updated Title" };
        var response = new BaseResponse<object>
        {
            IsSuccess = true,
            Message = "Movie updated"
        };

        _updateMovieUseCase.Setup(x => x.ExecuteAsync(movieId, It.IsAny<ReqUpdateMovieDto>()))
            .ReturnsAsync(response);

        var result = await _controller.UpdateMovie(movieId, request);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task DeleteMovie_ValidId_ReturnsOk()
    {
        var movieId = Guid.NewGuid();
        var response = new BaseResponse<object>
        {
            IsSuccess = true,
            Message = "Movie deleted"
        };

        _deleteMovieUseCase.Setup(x => x.ExecuteAsync(movieId))
            .ReturnsAsync(response);

        var result = await _controller.DeleteMovie(movieId);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task DeleteMovie_NonExistentId_ThrowsAppException()
    {
        var movieId = Guid.NewGuid();
        _deleteMovieUseCase.Setup(x => x.ExecuteAsync(movieId))
            .ThrowsAsync(new AppException("Movie not found", 404));

        await Assert.ThrowsAsync<AppException>(() => _controller.DeleteMovie(movieId));
    }

    [Fact]
    public async Task GetAllMovies_AdminView_ReturnsAllStatuses()
    {
        var response = new BaseResponse<object>
        {
            IsSuccess = true,
            Data = new
            {
                Items = new[]
                {
                    new { MovieId = "1", Title = "Active Movie", Status = "Active" },
                    new { MovieId = "2", Title = "Draft Movie", Status = "Draft" }
                }
            }
        };

        _getAllMoviesUseCase.Setup(x => x.ExecuteAsync(It.IsAny<int>(), It.IsAny<int>()))
            .ReturnsAsync(response);

        var result = await _controller.GetAllMovies(0, 10);

        result.Should().BeOfType<OkObjectResult>();
    }
}
