using Moq;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Cinema.Api.Controllers.Customer.Booking;
using Cinema.Application.Dtos;
using Cinema.Application.Dtos.Public;
using Cinema.Application.UseCases.Public;
using Microsoft.AspNetCore.Http;

namespace Cinema.Tests.UnitTests.Public;

public class PublicMovieControllerTests
{
    private readonly Mock<GetNowShowingMoviesUseCase> _nowShowingUseCase;
    private readonly Mock<GetComingSoonMoviesUseCase> _comingSoonUseCase;
    private readonly Mock<GetCitiesUseCase> _citiesUseCase;
    private readonly Mock<GetGenresUseCase> _genresUseCase;
    private readonly Mock<GetActiveCinemasUseCase> _activeCinemasUseCase;
    private readonly Mock<GetNearestCinemasUseCase> _nearestCinemasUseCase;
    private readonly Mock<GetActiveMoviesUseCase> _activeMoviesUseCase;
    private readonly Mock<SearchSchedulesUseCase> _searchSchedulesUseCase;
    private readonly Mock<GetMovieDetailUseCase> _movieDetailUseCase;
    private readonly Mock<GetSimilarMoviesUseCase> _similarMoviesUseCase;
    private readonly Mock<GetShowtimesUseCase> _showtimesUseCase;
    private readonly Mock<GetSeatLayoutUseCase> _seatLayoutUseCase;
    private readonly Mock<GetPricingUseCase> _pricingUseCase;
    private readonly Mock<ILogger<PublicMovieController>> _logger;
    private readonly PublicMovieController _controller;

    public PublicMovieControllerTests()
    {
        _nowShowingUseCase = new Mock<GetNowShowingMoviesUseCase>();
        _comingSoonUseCase = new Mock<GetComingSoonMoviesUseCase>();
        _citiesUseCase = new Mock<GetCitiesUseCase>();
        _genresUseCase = new Mock<GetGenresUseCase>();
        _activeCinemasUseCase = new Mock<GetActiveCinemasUseCase>();
        _nearestCinemasUseCase = new Mock<GetNearestCinemasUseCase>();
        _activeMoviesUseCase = new Mock<GetActiveMoviesUseCase>();
        _searchSchedulesUseCase = new Mock<SearchSchedulesUseCase>();
        _movieDetailUseCase = new Mock<GetMovieDetailUseCase>();
        _similarMoviesUseCase = new Mock<GetSimilarMoviesUseCase>();
        _showtimesUseCase = new Mock<GetShowtimesUseCase>();
        _seatLayoutUseCase = new Mock<GetSeatLayoutUseCase>();
        _pricingUseCase = new Mock<GetPricingUseCase>();
        _logger = new Mock<ILogger<PublicMovieController>>();

        _controller = new PublicMovieController(
            _nowShowingUseCase.Object,
            _comingSoonUseCase.Object,
            _citiesUseCase.Object,
            _genresUseCase.Object,
            _activeCinemasUseCase.Object,
            _nearestCinemasUseCase.Object,
            _activeMoviesUseCase.Object,
            _searchSchedulesUseCase.Object,
            _movieDetailUseCase.Object,
            _similarMoviesUseCase.Object,
            _showtimesUseCase.Object,
            _seatLayoutUseCase.Object,
            _pricingUseCase.Object,
            _logger.Object);

        _controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext()
        };
    }

    [Fact]
    public async Task NowShowing_DefaultParams_ReturnsPaginatedMovies()
    {
        var response = new BaseResponse<object>
        {
            IsSuccess = true,
            Data = new
            {
                Items = new[] { new { MovieId = "1", Title = "Movie 1" } },
                TotalPages = 1,
                PageIndex = 0,
                PageSize = 10
            }
        };

        _nowShowingUseCase.Setup(x => x.ExecuteAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<int>(), It.IsAny<int>()))
            .ReturnsAsync(response);

        var result = await _controller.NowShowing(null, null, 0, 10);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task NowShowing_WithKeyword_FiltersResults()
    {
        var response = new BaseResponse<object>
        {
            IsSuccess = true,
            Data = new { Items = new[] { new { MovieId = "1", Title = "Avatar" } } }
        };

        _nowShowingUseCase.Setup(x => x.ExecuteAsync("Avatar", null, 0, 10))
            .ReturnsAsync(response);

        var result = await _controller.NowShowing("Avatar", null, 0, 10);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task GetCities_ReturnsCityList()
    {
        var response = new BaseResponse<List<string>>
        {
            IsSuccess = true,
            Data = new List<string> { "Ho Chi Minh", "Ha Noi" }
        };

        _citiesUseCase.Setup(x => x.ExecuteAsync())
            .ReturnsAsync(response);

        var result = await _controller.GetCities();

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task GetGenres_ReturnsGenreList()
    {
        var response = new BaseResponse<object>
        {
            IsSuccess = true,
            Data = new[] { new { GenreId = "1", GenreName = "Action" } }
        };

        _genresUseCase.Setup(x => x.ExecuteAsync())
            .ReturnsAsync(response);

        var result = await _controller.GetGenres();

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task GetActiveCinemas_ReturnsCinemaList()
    {
        var response = new BaseResponse<object>
        {
            IsSuccess = true,
            Data = new[] { new { CinemaId = "1", CinemaName = "Cinema 1" } }
        };

        _activeCinemasUseCase.Setup(x => x.ExecuteAsync())
            .ReturnsAsync(response);

        var result = await _controller.GetActiveCinemas();

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task GetNearestCinemas_ValidCoords_ReturnsSortedCinemas()
    {
        var response = new BaseResponse<object>
        {
            IsSuccess = true,
            Data = new[] { new { CinemaId = "1", Distance = 1.5 } }
        };

        _nearestCinemasUseCase.Setup(x => x.ExecuteAsync(10.7769, 106.7009))
            .ReturnsAsync(response);

        var result = await _controller.GetNearestCinemas(10.7769, 106.7009);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task GetMovieDetail_ValidId_ReturnsMovieInfo()
    {
        var movieId = Guid.NewGuid();
        var response = new BaseResponse<object>
        {
            IsSuccess = true,
            Data = new { MovieId = movieId, Title = "Test Movie", Duration = 120 }
        };

        _movieDetailUseCase.Setup(x => x.ExecuteAsync(movieId))
            .ReturnsAsync(response);

        var result = await _controller.GetMovieDetail(movieId);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task GetMovieDetail_InvalidId_ThrowsException()
    {
        var movieId = Guid.NewGuid();
        _movieDetailUseCase.Setup(x => x.ExecuteAsync(movieId))
            .ThrowsAsync(new Application.Exceptions.AppException("Movie not found", 404));

        await Assert.ThrowsAsync<Application.Exceptions.AppException>(
            () => _controller.GetMovieDetail(movieId));
    }

    [Fact]
    public async Task GetSeatLayout_ValidScheduleId_ReturnsSeatGrid()
    {
        var scheduleId = Guid.NewGuid();
        var response = new BaseResponse<object>
        {
            IsSuccess = true,
            Data = new
            {
                Rows = new[]
                {
                    new { RowLabel = "A", Seats = new[] { new { SeatId = "a1", Status = "available" } } }
                }
            }
        };

        _seatLayoutUseCase.Setup(x => x.ExecuteAsync(scheduleId))
            .ReturnsAsync(response);

        var result = await _controller.GetSeatLayout(scheduleId);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task GetPricing_ValidScheduleId_ReturnsPriceTiers()
    {
        var scheduleId = Guid.NewGuid();
        var response = new BaseResponse<object>
        {
            IsSuccess = true,
            Data = new[] { new { SegmentName = "Adult", Price = 90000 } }
        };

        _pricingUseCase.Setup(x => x.ExecuteAsync(scheduleId))
            .ReturnsAsync(response);

        var result = await _controller.GetPricing(scheduleId);

        result.Should().BeOfType<OkObjectResult>();
    }
}
