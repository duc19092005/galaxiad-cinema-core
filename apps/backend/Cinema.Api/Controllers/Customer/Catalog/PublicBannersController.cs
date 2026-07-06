using System;
using System.Threading.Tasks;
using Cinema.Application.UseCases.Public;
using Cinema.Infrastructure.ExternalServices.Cache;
using Microsoft.AspNetCore.Mvc;

namespace Cinema.Api.Controllers.Customer.Catalog;

[ApiController]
[Route("api/v1/Public/banners")]
[Tags("Public - Banners")]
[ApiExplorerSettings(GroupName = "v1-user")]
public class PublicBannersController : ControllerBase
{
    private readonly GetActiveBannersUseCase _getActiveBannersUseCase;
    private readonly IMovieInterestBuffer _interestBuffer;

    public PublicBannersController(
        GetActiveBannersUseCase getActiveBannersUseCase,
        IMovieInterestBuffer interestBuffer)
    {
        _getActiveBannersUseCase = getActiveBannersUseCase;
        _interestBuffer = interestBuffer;
    }

    [HttpGet]
    public async Task<IActionResult> GetActive([FromQuery] Guid? cinemaId, [FromQuery] string? cinemaCity)
    {
        return Ok(await _getActiveBannersUseCase.ExecuteAsync(cinemaId, cinemaCity));
    }

    /// <summary>
    /// Track movie interest (click) — increments Redis counter for upcoming movies
    /// </summary>
    [HttpPost("track-interest")]
    public async Task<IActionResult> TrackInterest([FromBody] TrackInterestRequest request)
    {
        await _interestBuffer.IncrementInterestAsync(request.MovieId);
        return Ok(new { message = "Tracked" });
    }
}

public class TrackInterestRequest
{
    public Guid MovieId { get; set; }
}
