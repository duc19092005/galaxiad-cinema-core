using System;
using System.Threading.Tasks;
using Cinema.Application.Dtos.Comments;
using Cinema.Application.UseCases.Customer.Engagement.Comments;
using Hangfire;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Cinema.Api.Controllers.Customer.Engagement;

[ApiController]
[Route("api/v1/comments")]
[Tags("Customer - Movie Comments")]
[ApiExplorerSettings(GroupName = "v1-user")]
public class MovieCommentsController : ControllerBase
{
    private readonly GetMovieCommentsUseCase _getMovieCommentsUseCase;
    private readonly GetTrendingMoviesUseCase _getTrendingMoviesUseCase;
    private readonly GetTopRatedMoviesUseCase _getTopRatedMoviesUseCase;
    private readonly TrackMovieViewUseCase _trackMovieViewUseCase;
    private readonly GetCommentEligibilityUseCase _getCommentEligibilityUseCase;
    private readonly CreateMovieCommentUseCase _createMovieCommentUseCase;
    private readonly CreateMovieReplyUseCase _createMovieReplyUseCase;
    private readonly DeleteOwnCommentUseCase _deleteOwnCommentUseCase;
    private readonly IBackgroundJobClient _backgroundJobClient;

    public MovieCommentsController(
        GetMovieCommentsUseCase getMovieCommentsUseCase,
        GetTrendingMoviesUseCase getTrendingMoviesUseCase,
        GetTopRatedMoviesUseCase getTopRatedMoviesUseCase,
        TrackMovieViewUseCase trackMovieViewUseCase,
        GetCommentEligibilityUseCase getCommentEligibilityUseCase,
        CreateMovieCommentUseCase createMovieCommentUseCase,
        CreateMovieReplyUseCase createMovieReplyUseCase,
        DeleteOwnCommentUseCase deleteOwnCommentUseCase,
        IBackgroundJobClient backgroundJobClient)
    {
        _getMovieCommentsUseCase = getMovieCommentsUseCase;
        _getTrendingMoviesUseCase = getTrendingMoviesUseCase;
        _getTopRatedMoviesUseCase = getTopRatedMoviesUseCase;
        _trackMovieViewUseCase = trackMovieViewUseCase;
        _getCommentEligibilityUseCase = getCommentEligibilityUseCase;
        _createMovieCommentUseCase = createMovieCommentUseCase;
        _createMovieReplyUseCase = createMovieReplyUseCase;
        _deleteOwnCommentUseCase = deleteOwnCommentUseCase;
        _backgroundJobClient = backgroundJobClient;
    }

    [HttpGet("movies/{movieId}")]
    public async Task<IActionResult> GetComments(Guid movieId)
    {
        var result = await _getMovieCommentsUseCase.ExecuteAsync(movieId);
        return Ok(result);
    }

    [HttpGet("movies/trending")]
    public async Task<IActionResult> GetTrendingMovies(
        [FromQuery] int days = 30,
        [FromQuery] int take = 10,
        [FromQuery] Guid? cinemaId = null,
        [FromQuery] string? city = null)
    {
        var result = await _getTrendingMoviesUseCase.ExecuteAsync(days, take, cinemaId, city);
        return Ok(result);
    }

    [HttpGet("movies/top-rated")]
    public async Task<IActionResult> GetTopRatedMovies(
        [FromQuery] int take = 5,
        [FromQuery] Guid? cinemaId = null)
    {
        var result = await _getTopRatedMoviesUseCase.ExecuteAsync(take, cinemaId);
        return Ok(result);
    }

    [HttpPost("movies/{movieId}/view")]
    public async Task<IActionResult> TrackMovieView(Guid movieId)
    {
        await _trackMovieViewUseCase.ExecuteAsync(movieId);
        return Ok(new { isSuccess = true, message = "Tracked." });
    }

    [HttpGet("movies/{movieId}/eligibility")]
    public async Task<IActionResult> GetEligibility(Guid movieId)
    {
        var result = await _getCommentEligibilityUseCase.ExecuteAsync(movieId);
        return Ok(result);
    }

    [Authorize]
    [HttpPost("movies/{movieId}")]
    public async Task<IActionResult> CreateComment(Guid movieId, [FromBody] ReqCreateMovieCommentDto request)
    {
        var result = await _createMovieCommentUseCase.ExecuteAsync(movieId, request);
        if (result.Data != null)
        {
            _backgroundJobClient.Enqueue<ModerateMovieCommentUseCase>(useCase => useCase.ExecuteAsync(result.Data.CommentId));
        }

        return Ok(result);
    }

    [Authorize]
    [HttpPost("{parentCommentId}/replies")]
    public async Task<IActionResult> CreateReply(Guid parentCommentId, [FromBody] ReqCreateMovieReplyDto request)
    {
        var result = await _createMovieReplyUseCase.ExecuteAsync(parentCommentId, request);
        if (result.Data != null)
        {
            _backgroundJobClient.Enqueue<ModerateMovieCommentUseCase>(useCase => useCase.ExecuteAsync(result.Data.CommentId));
        }

        return Ok(result);
    }

    [Authorize]
    [HttpDelete("{commentId}")]
    public async Task<IActionResult> DeleteComment(Guid commentId)
    {
        var result = await _deleteOwnCommentUseCase.ExecuteAsync(commentId);
        return Ok(result);
    }
}
