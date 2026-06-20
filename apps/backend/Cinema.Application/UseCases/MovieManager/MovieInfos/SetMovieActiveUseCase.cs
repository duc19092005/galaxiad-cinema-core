using Cinema.Application.Interfaces.Admin;
using Cinema.Application.Interfaces.IThirdPersonServices;
using Microsoft.Extensions.Logging;

namespace Cinema.Application.UseCases.MovieManager.MovieInfos;

public class SetMovieActiveUseCase
{
    private readonly IAdminRepository _adminRepository;
    private readonly ILogger<SetMovieActiveUseCase> _logger;
    private readonly IAiMovieEmbeddingSyncService _aiMovieEmbeddingSyncService;

    public SetMovieActiveUseCase(
        IAdminRepository adminRepository,
        ILogger<SetMovieActiveUseCase> logger,
        IAiMovieEmbeddingSyncService aiMovieEmbeddingSyncService)
    {
        _adminRepository = adminRepository;
        _logger = logger;
        _aiMovieEmbeddingSyncService = aiMovieEmbeddingSyncService;
    }

    public async Task ExecuteAsync(Guid movieId)
    {
        var findMovie = await _adminRepository.GetMovieInfoEntityAsync(movieId);
        if (findMovie == null)
        {
            _logger.LogError("Can't find movie with id: {movieId} to run Jobs", movieId);
        }
        else
        {
            try
            {
                findMovie.IsCommingSoon = false;
                findMovie.IsActive = true;
                _adminRepository.UpdateMovie(findMovie);
                await _adminRepository.SaveChangesAsync();
                await _aiMovieEmbeddingSyncService.SyncMovieAsync(movieId);
            }
            catch (Exception e)
            {
                _logger.LogError(e, "Error while update movie status id : {movieId}", movieId);
            }
        }
    }
}
