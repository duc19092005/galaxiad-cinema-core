using System;
using System.Threading.Tasks;
using Cinema.Application.Dtos.FacilitiesManager.Auditoriums.Requests;
using Cinema.Application.UseCases.FacilitiesManager.Auditoriums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Cinema.Api.Controllers.Management.Facilities;

[ApiController]
[Route("api/facilities/auditorium")]
[Authorize(Policy = "FacilitiesManager")]
[Tags("Facilities Manager - auditorium")]
[ApiExplorerSettings(GroupName = "v1-facilities-manager")]
public class AuditoriumController : ControllerBase
{
    private readonly CreateAuditoriumUseCase _createUseCase;
    private readonly UpdateAuditoriumUseCase _updateUseCase;
    private readonly GetAllAuditoriumsUseCase _getAllUseCase;
    private readonly GetAuditoriumByIdUseCase _getByIdUseCase;
    private readonly GetAuditoriumsByCinemaIdUseCase _getByCinemaIdUseCase;

    public AuditoriumController(
        CreateAuditoriumUseCase createUseCase,
        UpdateAuditoriumUseCase updateUseCase,
        GetAllAuditoriumsUseCase getAllUseCase,
        GetAuditoriumByIdUseCase getByIdUseCase,
        GetAuditoriumsByCinemaIdUseCase getByCinemaIdUseCase)
    {
        _createUseCase = createUseCase;
        _updateUseCase = updateUseCase;
        _getAllUseCase = getAllUseCase;
        _getByIdUseCase = getByIdUseCase;
        _getByCinemaIdUseCase = getByCinemaIdUseCase;
    }

    [HttpPost("")]
    public async Task<IActionResult> AddAuditorium(AddReqAuditoriumDto request)
    {
        var results = await _createUseCase.ExecuteAsync(request);
        return Ok(results);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> EditAuditorium(Guid id, EditReqAuditoriumDto request)
    {
        var results = await _updateUseCase.ExecuteAsync(id, request);
        return Ok(results);
    }

    [HttpGet("")]
    public async Task<IActionResult> GetAuditorium()
    {
        var results = await _getAllUseCase.ExecuteAsync();
        return Ok(results);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetAuditorium(Guid id)
    {
        var results = await _getByIdUseCase.ExecuteAsync(id);
        return Ok(results);
    }

    [HttpGet("cinema/{id}")]
    public async Task<IActionResult> GetCinema(Guid id)
    {
        var results = await _getByCinemaIdUseCase.ExecuteAsync(id);
        return Ok(results);
    }
}
