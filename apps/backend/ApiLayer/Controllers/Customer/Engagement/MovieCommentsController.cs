using BusinessLayer.Dtos.Comments;
using BusinessLayer.Services.Comments;
using Hangfire;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ApiLayer.Controllers.Customer.Engagement;

[ApiController]
[Route("api/v1/comments")]
[Tags("Customer - Movie Comments")]
[ApiExplorerSettings(GroupName = "v1-user")]
public class MovieCommentsController : ControllerBase
{
    private readonly MovieCommentService _movieCommentService;
    private readonly IBackgroundJobClient _backgroundJobClient;

    public MovieCommentsController(
        MovieCommentService movieCommentService,
        IBackgroundJobClient backgroundJobClient)
    {
        _movieCommentService = movieCommentService;
        _backgroundJobClient = backgroundJobClient;
    }

    [HttpGet("movies/{movieId}")]
    public async Task<IActionResult> GetComments(Guid movieId)
    {
        var result = await _movieCommentService.GetMovieComments(movieId);
        return Ok(result);
    }

    [HttpGet("movies/trending")]
    public async Task<IActionResult> GetTrendingMovies(
        [FromQuery] int days = 30,
        [FromQuery] int take = 10,
        [FromQuery] Guid? cinemaId = null,
        [FromQuery] string? city = null)
    {
        var result = await _movieCommentService.GetTrendingMovies(days, take, cinemaId, city);
        return Ok(result);
    }

    [HttpGet("movies/top-rated")]
    public async Task<IActionResult> GetTopRatedMovies(
        [FromQuery] int take = 5,
        [FromQuery] Guid? cinemaId = null)
    {
        var result = await _movieCommentService.GetTopRatedMovies(take, cinemaId);
        return Ok(result);
    }

    [HttpPost("movies/{movieId}/view")]
    public async Task<IActionResult> TrackMovieView(Guid movieId)
    {
        await _movieCommentService.TrackMovieView(movieId);
        return Ok(new { isSuccess = true, message = "Tracked." });
    }

    [HttpGet("movies/{movieId}/eligibility")]
    public async Task<IActionResult> GetEligibility(Guid movieId)
    {
        var result = await _movieCommentService.GetEligibility(movieId);
        return Ok(result);
    }

    [Authorize]
    [HttpPost("movies/{movieId}")]
    public async Task<IActionResult> CreateComment(Guid movieId, [FromBody] ReqCreateMovieCommentDto request)
    {
        var result = await _movieCommentService.CreateComment(movieId, request);
        if (result.Data != null)
        {
            _backgroundJobClient.Enqueue<MovieCommentService>(service => service.ModerateCommentAsync(result.Data.CommentId));
        }

        return Ok(result);
    }

    [Authorize]
    [HttpPost("{parentCommentId}/replies")]
    public async Task<IActionResult> CreateReply(Guid parentCommentId, [FromBody] ReqCreateMovieReplyDto request)
    {
        var result = await _movieCommentService.CreateReply(parentCommentId, request);
        if (result.Data != null)
        {
            _backgroundJobClient.Enqueue<MovieCommentService>(service => service.ModerateCommentAsync(result.Data.CommentId));
        }

        return Ok(result);
    }

    [Authorize]
    [HttpDelete("{commentId}")]
    public async Task<IActionResult> DeleteComment(Guid commentId)
    {
        var result = await _movieCommentService.DeleteOwnComment(commentId);
        return Ok(result);
    }
}
