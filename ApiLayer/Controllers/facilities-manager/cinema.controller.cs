using BussinessLayer.Dtos.cinemas;
using BussinessLayer.Services.facilities_manager;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Controllers.facilities_manager;

[ApiController]
[Route("api/facilities")]
[Authorize(Policy = "FacilitiesManager")]
public class cinema_controller : ControllerBase
{
    private readonly cinema_service cinema_service;

    public cinema_controller(cinema_service cinemaService)
    {
        this.cinema_service = cinemaService;
    }
    
    [HttpPost("cinema")]
    public async Task<IActionResult> AddCinema(add_cinema_req_dto addCinemaReqDto)
    {
        var results = await cinema_service.AddItem(addCinemaReqDto);
        return Ok(results);
    }
}