using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Cinema.Application.Dtos;
using Cinema.Application.Dtos.Public.Responses;
using Cinema.Application.UseCases.Customer.Catalog;
using Microsoft.AspNetCore.Mvc;

namespace Cinema.Api.Controllers.Customer.Catalog;

[ApiController]
[Route("api/v1/[controller]/")]
public class PublicController : ControllerBase
{
    private readonly GetMovieFormatsUseCase _getMovieFormatsUseCase;
    private readonly GetMovieRequiredAgeUseCase _getMovieRequiredAgeUseCase;
    private readonly GetMoviesUseCase _getMoviesUseCase;
    private readonly GetMovieDetailUseCase _getMovieDetailUseCase;
    private readonly GetScheduleDatesUseCase _getScheduleDatesUseCase;
    private readonly GetScheduleDetailsUseCase _getScheduleDetailsUseCase;
    private readonly GetAuditoriumDetailsUseCase _getAuditoriumDetailsUseCase;
    private readonly GetAllUpcomingDatesUseCase _getAllUpcomingDatesUseCase;

    public PublicController(
        GetMovieFormatsUseCase getMovieFormatsUseCase,
        GetMovieRequiredAgeUseCase getMovieRequiredAgeUseCase,
        GetMoviesUseCase getMoviesUseCase,
        GetMovieDetailUseCase getMovieDetailUseCase,
        GetScheduleDatesUseCase getScheduleDatesUseCase,
        GetScheduleDetailsUseCase getScheduleDetailsUseCase,
        GetAuditoriumDetailsUseCase getAuditoriumDetailsUseCase,
        GetAllUpcomingDatesUseCase getAllUpcomingDatesUseCase)
    {
        _getMovieFormatsUseCase = getMovieFormatsUseCase;
        _getMovieRequiredAgeUseCase = getMovieRequiredAgeUseCase;
        _getMoviesUseCase = getMoviesUseCase;
        _getMovieDetailUseCase = getMovieDetailUseCase;
        _getScheduleDatesUseCase = getScheduleDatesUseCase;
        _getScheduleDetailsUseCase = getScheduleDetailsUseCase;
        _getAuditoriumDetailsUseCase = getAuditoriumDetailsUseCase;
        _getAllUpcomingDatesUseCase = getAllUpcomingDatesUseCase;
    }

    [HttpGet("MovieFormats")]
    public async Task<IActionResult> GetMovieFormats()
    {
        var result = await _getMovieFormatsUseCase.ExecuteAsync();
        return Ok(result);
    }

    [HttpGet("MovieRequiredAge")]
    public async Task<IActionResult> GetMovieRequiredAge()
    {
        var result = await _getMovieRequiredAgeUseCase.ExecuteAsync();
        return Ok(result);
    }

    [HttpGet("Movies")]
    public async Task<IActionResult> GetMovies(
        [FromQuery] string? city,
        [FromQuery] string? status,
        [FromQuery] Guid? cinemaId)
    {
        var result = await _getMoviesUseCase.ExecuteAsync(city, status, cinemaId);
        return Ok(result);
    }

    [HttpGet("MovieDetail/{MovieId}")]
    public async Task<IActionResult> GetMovieDetail(Guid MovieId)
    {
        var result = await _getMovieDetailUseCase.ExecuteAsync(MovieId);
        return Ok(result);
    }

    [HttpGet("ScheduleDates/{MovieId}")]
    public async Task<IActionResult> GetScheduleDates(Guid MovieId, [FromQuery] string? city)
    {
        var result = await _getScheduleDatesUseCase.ExecuteAsync(MovieId, city);
        return Ok(result);
    }

    [HttpGet("ScheduleDetails/{MovieId}/{ScheduleDate}")]
    public async Task<IActionResult> GetScheduleDetails(Guid MovieId, DateTime ScheduleDate, [FromQuery] string? city)
    {
        var result = await _getScheduleDetailsUseCase.ExecuteAsync(MovieId, ScheduleDate, city);
        return Ok(result);
    }

    [HttpGet("AuditoriumDetails/{ScheduleId}")]
    public async Task<IActionResult> GetAuditoriumDetails(Guid ScheduleId)
    {
        var result = await _getAuditoriumDetailsUseCase.ExecuteAsync(ScheduleId);
        return Ok(result);
    }

    [HttpGet("UpcomingDates")]
    public async Task<IActionResult> GetAllUpcomingDates([FromQuery] string? city, [FromQuery] Guid? cinemaId)
    {
        var result = await _getAllUpcomingDatesUseCase.ExecuteAsync(city, cinemaId);
        return Ok(result);
    }
}
