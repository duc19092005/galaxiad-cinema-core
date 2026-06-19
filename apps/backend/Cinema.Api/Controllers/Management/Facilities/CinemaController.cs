using Cinema.Application.Dtos.FacilitiesManager.Cinemas.Requests;
using Cinema.Application.UseCases.FacilitiesManager.Cinemas;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.ComponentModel;

namespace Cinema.Api.Controllers.Management.Facilities;

[ApiController]
[Route("api/facilities/cinema")]
[Tags("Facilities Manager - Cinema")]
[ApiExplorerSettings(GroupName = "v1-facilities-manager")]
public class CinemaController : ControllerBase
{
    private readonly FacilitiesManagerWriteCinemaUseCase _writeUseCase;
    private readonly FacilitiesManagerReadCinemaUseCase _readUseCase;

    public CinemaController(
        FacilitiesManagerWriteCinemaUseCase writeUseCase,
        FacilitiesManagerReadCinemaUseCase readUseCase)
    {
        _writeUseCase = writeUseCase;
        _readUseCase = readUseCase;
    }

    /// <summary>
    /// Get all cinemas - accessible by FacilitiesManager, TheaterManager, and Admin
    /// </summary>
    [HttpGet()]
    [Authorize(Roles = "FacilitiesManager,TheaterManager,Admin")]
    public async Task<IActionResult> GetAll()
    {
        var results = await _readUseCase.GetAll();
        return Ok(results);
    }

    [HttpPost()]
    [Authorize(Policy = "FacilitiesManager")]
    [Description("API to create a cinema")]
    public async Task<IActionResult> AddCinema(AddCinemaReqDto addCinemaReqDto)
    {
        var results = await _writeUseCase.AddItem(addCinemaReqDto);
        return Ok(results);
    }

    /// <summary>
    /// Get cinema by ID - accessible by FacilitiesManager, TheaterManager, and Admin
    /// </summary>
    [HttpGet("{id}")]
    [Authorize(Roles = "FacilitiesManager,TheaterManager,Admin")]
    public async Task<IActionResult> GetCinemaById(Guid id)
    {
        var results = await _readUseCase.GetById(id);
        return Ok(results);
    }

    [HttpPut("{cinemaId}")]
    [Authorize(Policy = "FacilitiesManager")]
    [Description("API to update a cinema")]
    public async Task<IActionResult> EditCinema(Guid cinemaId, EditCinemaReqDto editCinemaReqDto)
    {
        var results = await _writeUseCase.UpdateItem(cinemaId, editCinemaReqDto);
        return Ok(results);
    }
}
