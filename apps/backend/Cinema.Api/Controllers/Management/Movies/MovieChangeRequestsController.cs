using Cinema.Application.Dtos.MovieManager.Contracts;
using Cinema.Application.UseCases.MovieManager.MovieChangeRequests;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Cinema.Api.Controllers.Management.Movies;

[ApiController]
[Authorize(Roles = "Admin,MovieManager")]
[Tags("Movie change requests")]
public sealed class MovieChangeRequestsController : ControllerBase
{
    private readonly CreateMovieChangeRequestUseCase _createUseCase;
    private readonly ListMovieChangeRequestsUseCase _listUseCase;
    private readonly SubmitMovieChangeRequestUseCase _submitUseCase;
    private readonly ReturnMovieChangeRequestUseCase _returnUseCase;
    private readonly RejectMovieChangeRequestUseCase _rejectUseCase;
    private readonly ApproveMovieChangeRequestUseCase _approveUseCase;

    public MovieChangeRequestsController(
        CreateMovieChangeRequestUseCase createUseCase,
        ListMovieChangeRequestsUseCase listUseCase,
        SubmitMovieChangeRequestUseCase submitUseCase,
        ReturnMovieChangeRequestUseCase returnUseCase,
        RejectMovieChangeRequestUseCase rejectUseCase,
        ApproveMovieChangeRequestUseCase approveUseCase)
    {
        _createUseCase = createUseCase;
        _listUseCase = listUseCase;
        _submitUseCase = submitUseCase;
        _returnUseCase = returnUseCase;
        _rejectUseCase = rejectUseCase;
        _approveUseCase = approveUseCase;
    }

    [HttpPost("api/movies/{movieId:guid}/change-requests")]
    public async Task<IActionResult> Create(Guid movieId, CreateMovieChangeRequestDto request, CancellationToken ct)
    {
        var item = await _createUseCase.ExecuteAsync(movieId, request, ct);
        return Ok(new { isSuccess = true, data = item });
    }

    [HttpGet("api/movies/{movieId:guid}/change-requests")]
    public async Task<IActionResult> List(Guid movieId, CancellationToken ct)
    {
        var list = await _listUseCase.ExecuteAsync(movieId, ct);
        return Ok(new { isSuccess = true, data = list });
    }

    [HttpPost("api/movie-change-requests/{id:guid}/submit")]
    public async Task<IActionResult> Submit(Guid id, CancellationToken ct)
    {
        var status = await _submitUseCase.ExecuteAsync(id, ct);
        return Ok(new { isSuccess = true, data = new { status } });
    }

    [HttpPost("api/movie-change-requests/{id:guid}/return")]
    public async Task<IActionResult> Return(Guid id, ReviewMovieChangeRequestDto request, CancellationToken ct)
    {
        var status = await _returnUseCase.ExecuteAsync(id, request, ct);
        return Ok(new { isSuccess = true, data = new { status } });
    }

    [HttpPost("api/movie-change-requests/{id:guid}/reject")]
    public async Task<IActionResult> Reject(Guid id, ReviewMovieChangeRequestDto request, CancellationToken ct)
    {
        var status = await _rejectUseCase.ExecuteAsync(id, request, ct);
        return Ok(new { isSuccess = true, data = new { status } });
    }

    [HttpPost("api/movie-change-requests/{id:guid}/approve")]
    public async Task<IActionResult> Approve(Guid id, CancellationToken ct)
    {
        var status = await _approveUseCase.ExecuteAsync(id, ct);
        return Ok(new { isSuccess = true, data = new { status } });
    }
}
