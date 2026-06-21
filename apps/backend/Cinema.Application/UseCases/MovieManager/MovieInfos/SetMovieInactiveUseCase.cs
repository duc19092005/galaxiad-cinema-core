using Cinema.Application.Interfaces.Admin;
using Cinema.Application.Interfaces.IThirdPersonServices;
using Microsoft.Extensions.Logging;
using Cinema.Domain.Interfaces.Persistence;
using Cinema.Domain.Localization;

namespace Cinema.Application.UseCases.MovieManager.MovieInfos;

public class SetMovieInactiveUseCase
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IAdminMovieManagementRepository _adminRepository;
    private readonly ILogger<SetMovieInactiveUseCase> _logger;
    private readonly IAiMovieEmbeddingSyncService _aiMovieEmbeddingSyncService;

    public SetMovieInactiveUseCase(
        IAdminMovieManagementRepository adminRepository,
        ILogger<SetMovieInactiveUseCase> logger,
        IAiMovieEmbeddingSyncService aiMovieEmbeddingSyncService,
        IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
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
                findMovie.IsActive = false;
                _adminRepository.UpdateMovie(findMovie);
                await _unitOfWork.SaveChangesAsync();
                await _aiMovieEmbeddingSyncService.DeleteMovieAsync(movieId);
            }
            catch (Exception e)
            {
                _logger.LogError(e, "Error while update movie status id : {movieId}", movieId);
            }
        }
    }
}

