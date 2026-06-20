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
    private readonly CreateCinemaUseCase _createUseCase;
    private readonly UpdateCinemaUseCase _updateUseCase;
    private readonly GetAllCinemasUseCase _getAllUseCase;
    private readonly GetCinemaByIdUseCase _getByIdUseCase;

    public CinemaController(
        CreateCinemaUseCase createUseCase,
        UpdateCinemaUseCase updateUseCase,
        GetAllCinemasUseCase getAllUseCase,
        GetCinemaByIdUseCase getByIdUseCase)
    {
        _createUseCase = createUseCase;
        _updateUseCase = updateUseCase;
        _getAllUseCase = getAllUseCase;
        _getByIdUseCase = getByIdUseCase;
    }

    /// <summary>
    /// Get all cinemas - accessible by FacilitiesManager, TheaterManager, and Admin
    /// </summary>
    [HttpGet()]
    [Authorize(Roles = "FacilitiesManager,TheaterManager,Admin")]
    public async Task<IActionResult> GetAll()
    {
        var results = await _getAllUseCase.ExecuteAsync();
        return Ok(results);
    }

    [HttpPost()]
    [Authorize(Policy = "FacilitiesManager")]
    [Description("API to create a cinema")]
    public async Task<IActionResult> AddCinema(AddCinemaReqDto addCinemaReqDto)
    {
        var results = await _createUseCase.ExecuteAsync(addCinemaReqDto);
        return Ok(results);
    }

    /// <summary>
    /// Get cinema by ID - accessible by FacilitiesManager, TheaterManager, and Admin
    /// </summary>
    [HttpGet("{id}")]
    [Authorize(Roles = "FacilitiesManager,TheaterManager,Admin")]
    public async Task<IActionResult> GetCinemaById(Guid id)
    {
        var results = await _getByIdUseCase.ExecuteAsync(id);
        return Ok(results);
    }

    [HttpPut("{cinemaId}")]
    [Authorize(Policy = "FacilitiesManager")]
    [Description("API to update a cinema")]
    public async Task<IActionResult> EditCinema(Guid cinemaId, EditCinemaReqDto editCinemaReqDto)
    {
        var results = await _updateUseCase.ExecuteAsync(cinemaId, editCinemaReqDto);
        return Ok(results);
    }
}
