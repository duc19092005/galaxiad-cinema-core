using System;
using System.Security.Claims;
using System.Threading.Tasks;
using Cinema.Application.Dtos.Public.Responses;
using Cinema.Application.UseCases.Comments.Recommendation;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Cinema.Api.Controllers.Customer.Engagement;

[ApiController]
[Route("api/v1/[controller]/")]
[ApiExplorerSettings(GroupName = "v1-user")]
public class RecommendationController : ControllerBase
{
    private readonly GetSurveyStatusUseCase _getSurveyStatusUseCase;
    private readonly SaveSurveyUseCase _saveSurveyUseCase;
    private readonly GetRecommendationsUseCase _getRecommendationsUseCase;
    private readonly SyncMoviesToAiServiceUseCase _syncMoviesToAiServiceUseCase;

    public RecommendationController(
        GetSurveyStatusUseCase getSurveyStatusUseCase,
        SaveSurveyUseCase saveSurveyUseCase,
        GetRecommendationsUseCase getRecommendationsUseCase,
        SyncMoviesToAiServiceUseCase syncMoviesToAiServiceUseCase)
    {
        _getSurveyStatusUseCase = getSurveyStatusUseCase;
        _saveSurveyUseCase = saveSurveyUseCase;
        _getRecommendationsUseCase = getRecommendationsUseCase;
        _syncMoviesToAiServiceUseCase = syncMoviesToAiServiceUseCase;
    }

    private Guid GetCurrentUserId()
    {
        var sid = User.FindFirstValue(ClaimTypes.Sid);
        if (string.IsNullOrEmpty(sid) || !Guid.TryParse(sid, out var userId))
        {
            throw new UnauthorizedAccessException("Cannot determine current user.");
        }

        return userId;
    }

    [HttpGet("survey/status")]
    [Authorize]
    public async Task<IActionResult> GetSurveyStatus()
    {
        Guid userId;
        try { userId = GetCurrentUserId(); }
        catch { return Unauthorized(); }

        var result = await _getSurveyStatusUseCase.ExecuteAsync(userId);
        return Ok(result);
    }

    [HttpPost("survey")]
    [Authorize]
    public async Task<IActionResult> SaveSurvey([FromBody] SaveSurveyRequestDto dto)
    {
        Guid userId;
        try { userId = GetCurrentUserId(); }
        catch { return Unauthorized(); }

        var result = await _saveSurveyUseCase.ExecuteAsync(userId, dto);
        return Ok(result);
    }

    [HttpGet("movies")]
    [Authorize]
    public async Task<IActionResult> GetRecommendations()
    {
        Guid userId;
        try { userId = GetCurrentUserId(); }
        catch { return Unauthorized(); }

        var result = await _getRecommendationsUseCase.ExecuteAsync(userId, HttpContext.RequestAborted);
        return Ok(result);
    }

    [HttpPost("sync-movies")]
    [Authorize(Policy = "Admin")]
    public async Task<IActionResult> SyncMoviesToAiService()
    {
        var result = await _syncMoviesToAiServiceUseCase.ExecuteAsync(HttpContext.RequestAborted);
        return Ok(result);
    }
}
