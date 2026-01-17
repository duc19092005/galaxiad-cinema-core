using BussinessLayer.Dtos.facilities_manager.Auditoriums;
using BussinessLayer.Services.facilities_manager.Auditoriums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Controllers.facilities_manager;

[ApiController]
[Route("api/facilities/auditorium")]
[Authorize(Policy = "FacilitiesManager")]
[Tags("FacilitiesManager - auditorium")]
[ApiExplorerSettings(GroupName = "v1-facilities-manager")]
public class auditoriumController : ControllerBase
{
    private readonly facilitiesManagerWriteAuditoriumService facilitiesManagerWriteAuditoriumService;
    private readonly facilitiesManagerReadAuditoriumService read_auditorium_service;

    public auditoriumController(facilitiesManagerWriteAuditoriumService facilitiesManagerWriteAuditoriumService
    , facilitiesManagerReadAuditoriumService  read_auditoriumService)
    {
        this.facilitiesManagerWriteAuditoriumService = facilitiesManagerWriteAuditoriumService;
        this.read_auditorium_service = read_auditoriumService;
    }

    [HttpPost("")]
    public async Task<IActionResult> addAuditorium(add_req_auditorium_dto request)
    {
        var results = await facilitiesManagerWriteAuditoriumService.AddAuditorium(request);
        return Ok(results);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> EditAuditorium(Guid id, edit_req_auditorium_dto request)
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