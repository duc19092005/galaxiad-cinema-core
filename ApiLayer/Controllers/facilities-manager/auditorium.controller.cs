using BussinessLayer.Dtos.Auditoriums.facilities_manager;
using BussinessLayer.Services.facilities_manager.Auditoriums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Controllers.facilities_manager;

[ApiController]
[Route("api/facilities/auditorium")]
[Authorize(Policy = "FacilitiesManager")]
[Tags("FacilitiesManager - auditorium")]
[ApiExplorerSettings(GroupName = "v1-facilities-manager")]
public class auditorium_controller : ControllerBase
{
    private readonly add_auditorium_service add_auditorium_service;
    private readonly read_auditorium_service_auditorium_service read_auditorium_service;

    public auditorium_controller(add_auditorium_service addAuditoriumService
    , read_auditorium_service_auditorium_service  read_auditoriumService)
    {
        add_auditorium_service = addAuditoriumService;
        this.read_auditorium_service = read_auditoriumService;
    }

    [HttpPost("")]
    public async Task<IActionResult> addAuditorium(add_req_auditorium_dto request)
    {
        var results = await add_auditorium_service.AddAuditorium(request);
        return Ok(results);
    }

    [HttpGet("")]
    public async Task<IActionResult> GetAuditorium()
    {
        var results = await read_auditorium_service.getAll();
        return Ok(results);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetAuditorium(Guid id)
    {
        var results = await read_auditorium_service.getById(id);
        return Ok(results);
    }
}