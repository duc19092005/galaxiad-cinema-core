using Cinema.Application.Interfaces.Admin;
using Cinema.Application.Interfaces.IThirdPersonServices;
using Microsoft.Extensions.Logging;
using Cinema.Domain.Interfaces.Persistence;
using Cinema.Domain.Localization;

namespace Cinema.Application.UseCases.MovieManager.MovieInfos;

public class SetMovieActiveUseCase
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IAdminMovieManagementRepository _adminRepository;
    private readonly ILogger<SetMovieActiveUseCase> _logger;
    private readonly IAiMovieEmbeddingSyncService _aiMovieEmbeddingSyncService;
    private readonly IMovieCacheService _cacheService;

    public SetMovieActiveUseCase(
        IAdminMovieManagementRepository adminRepository,
        ILogger<SetMovieActiveUseCase> logger,
        IAiMovieEmbeddingSyncService aiMovieEmbeddingSyncService,
        IUnitOfWork unitOfWork,
        IMovieCacheService cacheService)
    {
        _unitOfWork = unitOfWork;
        _adminRepository = adminRepository;
        _logger = logger;
        _aiMovieEmbeddingSyncService = aiMovieEmbeddingSyncService;
        _cacheService = cacheService;
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
                await _unitOfWork.SaveChangesAsync();

                try
                {
                    await _cacheService.ClearMovieCatalogCacheAsync();
                    await _cacheService.ClearMovieDetailCacheAsync(movieId);
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Failed to clear movie cache on Redis");
                }

                await _aiMovieEmbeddingSyncService.SyncMovieAsync(movieId);
            }
            catch (Exception e)
            {
                _logger.LogError(e, "Error while update movie status id : {movieId}", movieId);
            }
        }
    }
}

