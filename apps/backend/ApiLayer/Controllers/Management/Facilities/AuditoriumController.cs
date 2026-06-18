using BusinessLayer.Dtos.FacilitiesManager.Auditoriums.Requests;
using BusinessLayer.Services.FacilitiesManager.Auditoriums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ApiLayer.Controllers.Management.Facilities;

[ApiController]
[Route("api/facilities/auditorium")]
[Authorize(Policy = "FacilitiesManager")]
[Tags("Facilities Manager - auditorium")]
[ApiExplorerSettings(GroupName = "v1-facilities-manager")]
public class AuditoriumController : ControllerBase
{
    private readonly FacilitiesManagerWriteAuditoriumService facilitiesManagerWriteAuditoriumService;
    private readonly FacilitiesManagerReadAuditoriumService read_auditorium_service;

    public AuditoriumController(FacilitiesManagerWriteAuditoriumService facilitiesManagerWriteAuditoriumService
    , FacilitiesManagerReadAuditoriumService  readAuditoriumService)
    {
        this.facilitiesManagerWriteAuditoriumService = facilitiesManagerWriteAuditoriumService;
        this.read_auditorium_service = readAuditoriumService;
    }

    [HttpPost("")]
    public async Task<IActionResult> AddAuditorium(AddReqAuditoriumDto request)
    {
        var results = await facilitiesManagerWriteAuditoriumService.AddAuditorium(request);
        return Ok(results);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> EditAuditorium(Guid id, EditReqAuditoriumDto request)
    {
        var results = await facilitiesManagerWriteAuditoriumService.EditAuditorium(id, request);
        return Ok(results);
    }

    [HttpGet("")]
    public async Task<IActionResult> GetAuditorium()
    {
        var results = await read_auditorium_service.GetAll();
        return Ok(results);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetAuditorium(Guid id)
    {
        var results = await read_auditorium_service.GetById(id);
        return Ok(results);
    }

    [HttpGet("cinema/{id}")]
    public async Task<IActionResult> GetCinema(Guid id)
    {
        var results = await read_auditorium_service.GetByCinemaId(id);
        return Ok(results);
    }
}


