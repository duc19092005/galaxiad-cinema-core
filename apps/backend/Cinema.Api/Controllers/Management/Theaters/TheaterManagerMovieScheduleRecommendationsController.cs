using Cinema.Application.Dtos.TheaterManager.ShowtimeRecommendations;
using Cinema.Application.UseCases.TheaterManager.ShowtimeRecommendations;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Cinema.Api.Controllers.Management.Theaters;

[ApiController]
[Authorize(Policy = "TheaterManager")]
[Route("api/TheaterManager/MovieScheduleRecommendations")]
[Tags("Theater Manager - Movie Schedule Recommendations")]
[ApiExplorerSettings(GroupName = "v1-theater-manager")]
public class TheaterManagerMovieScheduleRecommendationsController : ControllerBase
{
    private readonly GenerateShowtimeRecommendationsUseCase _generateUseCase;
    private readonly PreviewShowtimeRecommendationsUseCase _previewUseCase;
    private readonly ApplyShowtimeRecommendationsUseCase _applyUseCase;
    private readonly DismissShowtimeRecommendationUseCase _dismissUseCase;
    private readonly GetShowtimeRecommendationHistoryUseCase _historyUseCase;

    public TheaterManagerMovieScheduleRecommendationsController(
        GenerateShowtimeRecommendationsUseCase generateUseCase,
        PreviewShowtimeRecommendationsUseCase previewUseCase,
        ApplyShowtimeRecommendationsUseCase applyUseCase,
        DismissShowtimeRecommendationUseCase dismissUseCase,
        GetShowtimeRecommendationHistoryUseCase historyUseCase)
    {
        _generateUseCase = generateUseCase;
        _previewUseCase = previewUseCase;
        _applyUseCase = applyUseCase;
        _dismissUseCase = dismissUseCase;
        _historyUseCase = historyUseCase;
    }

    [HttpPost("generate")]
    public async Task<IActionResult> Generate(GenerateShowtimeRecommendationsRequest request)
    {
        var result = await _generateUseCase.ExecuteAsync(request);
        return Ok(result);
    }

    [HttpPost("preview")]
    public async Task<IActionResult> Preview(RecommendationSelectionRequest request)
    {
        var result = await _previewUseCase.ExecuteAsync(request);
        return Ok(result);
    }

    [HttpPost("apply")]
    public async Task<IActionResult> Apply(ApplyShowtimeRecommendationsRequest request)
    {
        var result = await _applyUseCase.ExecuteAsync(request);
        return Ok(result);
    }

    [HttpPost("{recommendationId:guid}/dismiss")]
    public async Task<IActionResult> Dismiss(Guid recommendationId)
    {
        var result = await _dismissUseCase.ExecuteAsync(recommendationId);
        return Ok(result);
    }

    [HttpGet("history")]
    public async Task<IActionResult> History([FromQuery] Guid cinemaId, [FromQuery] int take = 20)
    {
        var result = await _historyUseCase.ExecuteAsync(cinemaId, take);
        return Ok(result);
    }
}
