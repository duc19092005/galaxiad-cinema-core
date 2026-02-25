// ReSharper disable All

using BusinessLayer.Dtos;
using DataAccess;
using DataAccess.Entities.MovieInfos;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Shared.Localization;

namespace ApiLayer.Controllers.Public;

[ApiController]
[Route("api/[controller]")]
public class PublicController : ControllerBase
{
    // Đây là Controller Public ai cũng có thể Access được
    // Controller naày làmdđơn giản thoi
    private readonly ILogger<PublicController> _logger;
    private readonly CinemaDbContext _cinemaDbContext;

    public PublicController(ILogger<PublicController> logger, CinemaDbContext cinemaDbContext)
    {
        this._logger = logger;
        this._cinemaDbContext = cinemaDbContext;
    }

    [HttpGet("/MovieFormats")]
    public async Task<IActionResult> GetMovieFormats()
    {
        var getMovieFormats =  await _cinemaDbContext.MovieFormatInfoEntity.Select(x => new BaseFormatInfo()
        {
            FormatId = x.MovieFormatId,
            FormatName = x.MovieFormatName
        }).ToListAsync();
        var baseRes = new BaseResponse<List<BaseFormatInfo>>()
        {
            Data = getMovieFormats,
            IsSuccess = true,
            Message = Messages.MovieFormat.GetDataSuccess
        };
        return Ok(baseRes);
    }

    [HttpGet("/MovieRequiredAge")]
    public async Task<IActionResult> GetMovieRequiredAge()
    {
        var getMovieRequiredAge = await _cinemaDbContext.MovieRequiredAgeEntity.Select(x => new BaseRequiredAge()
        {
            MovieRequiredAgeSymbolId = x.MovieRequiredAgeId,
            MovieRequiredAgeDescription = x.MovieRequiredAgeDescription,
            MovieRequiredAgeSymbol = x.MovieRequiredAgeSymbol.TrimEnd().TrimStart(),
        }).ToListAsync();
        var baseRes = new BaseResponse<List<BaseRequiredAge>>()
        {
            Data = getMovieRequiredAge,
            IsSuccess = true,
            Message = Messages.RequiredAge.GetRequiredAgeCompleted
        };
        return Ok(baseRes);
    }
}
