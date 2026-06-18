using Application.MovieManager.UseCases;
using BusinessLayer.Dtos;
using BusinessLayer.Dtos.MovieManager.Requests;
using BusinessLayer.Services.IdentityAccess;
using BusinessLayer.Services.MovieManager;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Shared.Localization;

namespace ApiLayer.Controllers.MovieManager;

[ApiController]
[Route("api/movieManager/movies")]
[Authorize(Policy = "MovieManager")]
[Tags("Movie Manager - Movies")]
[ApiExplorerSettings(GroupName = "v1-movie-manager")]
public class movieController : ControllerBase
{
    private readonly MovieManagerReadMovie _movieManagerReadMovie;
    private readonly WriteMovieUseCase _writeMovieUseCase;
    private readonly IUserContextService _userContextService;

    public movieController(
        MovieManagerReadMovie movieManagerReadMovie,
        WriteMovieUseCase writeMovieUseCase,
        IUserContextService userContextService)
    {
        this._movieManagerReadMovie = movieManagerReadMovie;
        this._writeMovieUseCase = writeMovieUseCase;
        this._userContextService = userContextService;
    }

    [HttpPost("")]
    public async Task<IActionResult> CreateMovie([FromForm] ReqAddMovieManagerMovieDto request)
    {
        var userId = _userContextService.GetUserId();

        await using var imageStream = request.MovieImage.OpenReadStream();
        var command = new CreateMovieCommand(
            request.MovieRequiredAgeId,
            request.MovieName,
            request.MovieDescription,
            new ImageUpload(imageStream, request.MovieImage.FileName),
            request.StartedDate,
            request.EndedDate,
            request.Duration,
            request.TrailerUrl,
            request.Director,
            request.Actors,
            request.MovieFormatIds,
            request.MovieGenreIds,
            request.CinemaIds);

        await _writeMovieUseCase.CreateAsync(command, userId);

        return Ok(new BaseResponse<string> { IsSuccess = true, Message = Messages.Movie.AddCompleted });
    }

    [HttpPut("{movieId}")]
    public async Task<IActionResult> UpdateMovie(Guid movieId, [FromForm] ReqEditMovieManagerMovieDto request)
    {
        var userId = _userContextService.GetUserId();

        Stream? imageStream = null;
        ImageUpload? image = null;
        try
        {
            if (request.MovieImage != null)
            {
                imageStream = request.MovieImage.OpenReadStream();
                image = new ImageUpload(imageStream, request.MovieImage.FileName);
            }

            var command = new UpdateMovieCommand(
                request.MovieRequiredAgeId,
                request.MovieName,
                request.MovieDescription,
                image,
                request.StartedDate,
                request.EndedDate,
                request.Duration,
                request.TrailerUrl,
                request.Director,
                request.Actors,
                request.MovieFormatIds,
                request.MovieGenreIds,
                request.CinemaIds);

            await _writeMovieUseCase.UpdateAsync(movieId, command, userId);
        }
        finally
        {
            if (imageStream != null)
            {
                await imageStream.DisposeAsync();
            }
        }

        return Ok(new BaseResponse<string> { IsSuccess = true, Message = Messages.Movie.EditCompleted });
    }

    [HttpDelete("{movieId}")]
    public async Task<IActionResult> DeleteMovie(Guid movieId)
    {
        var userId = _userContextService.GetUserId();
        await _writeMovieUseCase.DeleteAsync(movieId, userId);
        return Ok(new BaseResponse<string> { IsSuccess = true, Message = "Xóa phim thành công" });
    }

    [HttpGet("")]
    public async Task<IActionResult> GetAllMovies([FromQuery] Guid? cinemaId)
    {
        var results = await _movieManagerReadMovie.GetAllMovieInfos(cinemaId);
        return Ok(results);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetMovieById(Guid id)
    {
        var results = await _movieManagerReadMovie.GetMovieByMovieId(id);
        return Ok(results);
    }
}

