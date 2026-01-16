using System.ComponentModel;
using BussinessLayer.Dtos.cinemas;
using BussinessLayer.Services.facilities_manager;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Controllers.facilities_manager;

[ApiController]
[Route("api/facilities/cinema")]
[Authorize(Policy = "FacilitiesManager")]
[Tags("FacilitiesManager - Cinema")]
[ApiExplorerSettings(GroupName = "v1-facilities-manager")]
public class cinema_controller : ControllerBase
{
    private readonly facilitiesManagerWriteCinemaService cinema_service;
    private readonly facilitiesManagerReadCinemaService facilities_manager_read_service;

    public cinema_controller(facilitiesManagerWriteCinemaService cinemaService , facilitiesManagerReadCinemaService facilities_manager_read_service)
    {
        this.cinema_service = cinemaService;
        this.facilities_manager_read_service = facilities_manager_read_service;
    }

    [HttpGet()]
    public async Task<IActionResult> GetAll()
    {
        var results = await facilities_manager_read_service.GetAll();
        return Ok(results);
    }
    
    [HttpPost()]
    [Description("API to create a cinema")]
    public async Task<IActionResult> AddCinema(add_cinema_req_dto addCinemaReqDto)
    {
        var results = await cinema_service.AddItem(addCinemaReqDto);
        return Ok(results);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetCinemaById(Guid id)
    {
        var results = await facilities_manager_read_service.GetById(id);
        return Ok(results);
    }

    [HttpPut("{cinemaId}")]
    [Description("API to update a cinema")]
    public async Task<IActionResult> EditCinema(Guid cinemaId , edit_cinema_req_dto editCinemaReqDto)
    {
        var results = await cinema_service.EditItem(cinemaId , editCinemaReqDto);
        return Ok(results);
    }
    
    
}