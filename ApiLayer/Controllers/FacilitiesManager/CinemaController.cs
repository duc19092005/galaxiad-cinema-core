using System.ComponentModel;
using BusinessLayer.Dtos.FacilitiesManager.Cinemas;
using BusinessLayer.Services.FacilitiesManager;
using BusinessLayer.Services.FacilitiesManager.Cinemas;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;

namespace ApiLayer.Controllers.FacilitiesManager;

[ApiController]
[Route("api/facilities/cinema")]
[Authorize(Policy = "FacilitiesManager")]
[Tags("Facilities Manager - Cinema")]
[ApiExplorerSettings(GroupName = "v1-facilities-manager")]
public class CinemaController : ControllerBase
{
    private readonly FacilitiesManagerWriteCinemaService _cinemaService;
    private readonly FacilitiesManagerReadCinemaService _readService;

    public CinemaController(FacilitiesManagerWriteCinemaService cinemaService , FacilitiesManagerReadCinemaService readService)
    {
        this._cinemaService = cinemaService;
        this._readService = readService;
    }

    [HttpGet()]
    public async Task<IActionResult> GetAll()
    {
        var results = await _readService.GetAll();
        return Ok(results);
    }
    
    [HttpPost()]
    [Description("API to create a cinema")]
    public async Task<IActionResult> AddCinema(AddCinemaReqDto addCinemaReqDto)
    {
        var results = await _cinemaService.AddItem(addCinemaReqDto);
        return Ok(results);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetCinemaById(Guid id)
    {
        var results = await _readService.GetById(id);
        return Ok(results);
    }

    [HttpPut("{cinemaId}")]
    [Description("API to update a cinema")]
    public async Task<IActionResult> EditCinema(Guid cinemaId , EditCinemaReqDto editCinemaReqDto)
    {
        var results = await _cinemaService.EditItem(cinemaId , editCinemaReqDto);
        return Ok(results);
    }
}
