using Moq;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Cinema.Api.Controllers.Customer.Engagement;
using Cinema.Application.Dtos;
using Cinema.Application.UseCases.Customer.Engagement.Recommendation;

namespace Cinema.Tests.UnitTests.Engagement;

public class RecommendationControllerTests
{
    private readonly Mock<GetRecommendationsUseCase> _getRecommendationsUseCase;
    private readonly Mock<SaveSurveyUseCase> _submitSurveyUseCase;
    private readonly Mock<GetTrendingMoviesUseCase> _getTrendingUseCase;
    private readonly RecommendationController _controller;

    public RecommendationControllerTests()
    {
        _getRecommendationsUseCase = new Mock<GetRecommendationsUseCase>();
        _submitSurveyUseCase = new Mock<SaveSurveyUseCase>();
        _getTrendingUseCase = new Mock<GetTrendingMoviesUseCase>();
        _controller = new RecommendationController(
            _getRecommendationsUseCase.Object,
            _submitSurveyUseCase.Object,
            _getTrendingUseCase.Object);
    }

    [Fact]
    public async Task GetRecommendations_AuthenticatedUser_ReturnsPersonalizedList()
    {
        var response = new BaseResponse<object>
        {
            IsSuccess = true,
            Data = new[]
            {
                new { MovieId = "m1", Title = "Recommended Movie 1", Score = 0.95 },
                new { MovieId = "m2", Title = "Recommended Movie 2", Score = 0.87 }
            }
        };

        _getRecommendationsUseCase.Setup(x => x.ExecuteAsync(It.IsAny<Guid>()))
            .ReturnsAsync(response);

        var result = await _controller.GetRecommendations();

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task SubmitGenreSurvey_ValidPreferences_ReturnsOk()
    {
        var request = new ReqGenreSurveyDto
        {
            PreferredGenres = new List<string> { "Action", "Sci-Fi", "Thriller" }
        };

        var response = new BaseResponse<object>
        {
            IsSuccess = true,
            Message = "Survey submitted"
        };

        _submitSurveyUseCase.Setup(x => x.ExecuteAsync(It.IsAny<Guid>(), It.IsAny<ReqGenreSurveyDto>()))
            .ReturnsAsync(response);

        var result = await _controller.SubmitGenreSurvey(request);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task GetTrendingMovies_ReturnsList()
    {
        var response = new BaseResponse<object>
        {
            IsSuccess = true,
            Data = new[]
            {
                new { MovieId = "m1", Title = "Trending Movie 1", ViewCount = 1500 },
                new { MovieId = "m2", Title = "Trending Movie 2", ViewCount = 1200 }
            }
        };

        _getTrendingUseCase.Setup(x => x.ExecuteAsync())
            .ReturnsAsync(response);

        var result = await _controller.GetTrendingMovies();

        result.Should().BeOfType<OkObjectResult>();
    }
}
