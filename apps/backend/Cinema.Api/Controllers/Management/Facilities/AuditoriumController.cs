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
    private readonly FacilitiesManagerWriteAuditoriumUseCase _writeUseCase;
    private readonly FacilitiesManagerReadAuditoriumUseCase _readUseCase;

    public AuditoriumController(
        FacilitiesManagerWriteAuditoriumUseCase writeUseCase,
        FacilitiesManagerReadAuditoriumUseCase readUseCase)
    {
        _writeUseCase = writeUseCase;
        _readUseCase = readUseCase;
    }

    [HttpPost("")]
    public async Task<IActionResult> AddAuditorium(AddReqAuditoriumDto request)
    {
        var results = await _writeUseCase.AddItem(request);
        return Ok(results);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> EditAuditorium(Guid id, EditReqAuditoriumDto request)
    {
        var results = await _writeUseCase.UpdateItem(id, request);
        return Ok(results);
    }

    [HttpGet("")]
    public async Task<IActionResult> GetAuditorium()
    {
        var results = await _readUseCase.GetAll();
        return Ok(results);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetAuditorium(Guid id)
    {
        var results = await _readUseCase.GetById(id);
        return Ok(results);
    }

    [HttpGet("cinema/{id}")]
    public async Task<IActionResult> GetCinema(Guid id)
    {
        var results = await _readUseCase.GetByCinemaId(id);
        return Ok(results);
    }
}
