using BusinessLayer.Dtos.FacilitiesManager.Auditoriums;
using BusinessLayer.Services.FacilitiesManager.Auditoriums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ApiLayer.Controllers.FacilitiesManager;

[ApiController]
[Route("api/facilities/auditorium")]
[Authorize(Policy = "FacilitiesManager")]
[Tags("FacilitiesManager - auditorium")]
[ApiExplorerSettings(GroupName = "v1-facilities-manager")]
public class auditoriumController : ControllerBase
{
    private readonly FacilitiesManagerWriteAuditoriumService FacilitiesManagerWriteAuditoriumService;
    private readonly FacilitiesManagerReadAuditoriumService read_auditorium_service;

    public auditoriumController(FacilitiesManagerWriteAuditoriumService FacilitiesManagerWriteAuditoriumService
    , FacilitiesManagerReadAuditoriumService  read_auditoriumService)
    {
        this.FacilitiesManagerWriteAuditoriumService = FacilitiesManagerWriteAuditoriumService;
        this.read_auditorium_service = read_auditoriumService;
    }

    [HttpPost("")]
    public async Task<IActionResult> addAuditorium(AddReqAuditoriumDto request)
    {
        var results = await FacilitiesManagerWriteAuditoriumService.AddAuditorium(request);
        return Ok(results);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> EditAuditorium(Guid id, EditReqAuditoriumDto request)
    {
        var results = await FacilitiesManagerWriteAuditoriumService.EditAuditorium(id, request);
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


