using System.ComponentModel;
using BusinessLayer.Dtos.FacilitiesManager.Cinemas.Requests;
using BusinessLayer.Services.FacilitiesManager;
using BusinessLayer.Services.FacilitiesManager.Cinemas;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;

namespace ApiLayer.Controllers.Management.Facilities;

[ApiController]
[Route("api/facilities/cinema")]
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

    /// <summary>
    /// Get all cinemas - accessible by FacilitiesManager, TheaterManager, and Admin
    /// </summary>
    [HttpGet()]
    [Authorize(Roles = "FacilitiesManager,TheaterManager,Admin")]
    public async Task<IActionResult> GetAll()
    {
        var results = await _readService.GetAll();
        return Ok(results);
    }
    
    [HttpPost()]
    [Authorize(Policy = "FacilitiesManager")]
    [Description("API to create a cinema")]
    public async Task<IActionResult> AddCinema(AddCinemaReqDto addCinemaReqDto)
    {
        var results = await _cinemaService.AddItem(addCinemaReqDto);
        return Ok(results);
    }

    /// <summary>
    /// Get cinema by ID - accessible by FacilitiesManager, TheaterManager, and Admin
    /// </summary>
    [HttpGet("{id}")]
    [Authorize(Roles = "FacilitiesManager,TheaterManager,Admin")]
    public async Task<IActionResult> GetCinemaById(Guid id)
    {
        var results = await _readService.GetById(id);
        return Ok(results);
    }

    [HttpPut("{cinemaId}")]
    [Authorize(Policy = "FacilitiesManager")]
    [Description("API to update a cinema")]
    public async Task<IActionResult> EditCinema(Guid cinemaId , EditCinemaReqDto editCinemaReqDto)
    {
        var results = await _cinemaService.EditItem(cinemaId , editCinemaReqDto);
        return Ok(results);
    }
}

