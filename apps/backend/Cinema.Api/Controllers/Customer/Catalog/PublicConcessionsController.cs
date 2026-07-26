using Cinema.Application.UseCases.Concessions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Cinema.Api.Controllers.Customer.Catalog;

[ApiController]
[AllowAnonymous]
[Route("api/Public/Concessions")]
[Route("api/v1/Public/Concessions")]
[Tags("Public - Concessions")]
[ApiExplorerSettings(GroupName = "v1-public")]
public class PublicConcessionsController : ControllerBase
{
    private readonly GetConcessionMenuUseCase _getConcessionMenuUseCase;

    public PublicConcessionsController(GetConcessionMenuUseCase getConcessionMenuUseCase)
    {
        _getConcessionMenuUseCase = getConcessionMenuUseCase;
    }

    [HttpGet("{cinemaId:guid}/menu")]
    public async Task<IActionResult> GetMenu(Guid cinemaId)
        => Ok(await _getConcessionMenuUseCase.ExecuteAsync(cinemaId, onlineOnly: true));
}