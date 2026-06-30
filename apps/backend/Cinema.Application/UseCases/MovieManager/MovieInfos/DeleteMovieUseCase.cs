using Cinema.Application.Exceptions;
using Cinema.Domain.Localization;
using Cinema.Application.Dtos;
using Cinema.Application.Interfaces;
using Cinema.Application.Interfaces.Admin;
using Cinema.Application.Interfaces.IThirdPersonServices;
using Cinema.Domain.Interfaces.Persistence;

namespace Cinema.Application.UseCases.MovieManager.MovieInfos;

public class DeleteMovieUseCase
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IUserContextService _userContextService;
    private readonly IAdminMovieManagementRepository _adminRepository;
    private readonly IAuditLogService _auditLogService;
    private readonly IAiMovieEmbeddingSyncService _aiMovieEmbeddingSyncService;
    private readonly IMovieCacheService _cacheService;

    public DeleteMovieUseCase(
        IUserContextService userContextService,
        IAdminMovieManagementRepository adminRepository,
        IAuditLogService auditLogService,
        IAiMovieEmbeddingSyncService aiMovieEmbeddingSyncService,
        IUnitOfWork unitOfWork,
        IMovieCacheService cacheService)
    {
        _unitOfWork = unitOfWork;
        _userContextService = userContextService;
        _adminRepository = adminRepository;
        _auditLogService = auditLogService;
        _aiMovieEmbeddingSyncService = aiMovieEmbeddingSyncService;
        _cacheService = cacheService;
    }

    public async Task<BaseResponse<string>> ExecuteAsync(Guid itemId)
    {
        var getCurrentUserId = _userContextService.GetUserId();

        var movie = await _adminRepository.GetMovieInfoEntityAsync(itemId);
            
        if (movie == null)
        {
            throw new NotFoundException(Messages.Movie.NotFoundById(itemId));
        }

        if (movie.IsDeleted)
        {
            throw new BadRequestException(Messages.Movie.AlreadyDeleted, "D01");
        }

        var hasSuccessfulBooking = await _adminRepository.HasSuccessfulBookingAsync(itemId);

        if (hasSuccessfulBooking)
        {
            movie.IsDeleted = true;
            movie.DeletedByUserId = getCurrentUserId;
            movie.DeletedAt = DateTime.UtcNow;
            _adminRepository.UpdateMovie(movie);
        }
        else
        {
            var hasAnyBooking = await _adminRepository.HasAnyBookingAsync(itemId);

            if (hasAnyBooking)
            {
                // Soft delete to avoid foreign key conflict with failed/canceled orders
                movie.IsDeleted = true;
                movie.DeletedByUserId = getCurrentUserId;
                movie.DeletedAt = DateTime.UtcNow;
                _adminRepository.UpdateMovie(movie);
            }
            else
            {
                // Hard delete
                await _adminRepository.HardDeleteMovieAsync(itemId);
            }
        }
        
        await _auditLogService.WriteAsync(
            "Delete",
            "Movie",
            movie.MovieId,
            movie.MovieName,
            $"Deleted movie {movie.MovieName}.",
            (await _adminRepository.GetMovieCinemasByMovieIdAsync(itemId))
                .Select(x => (Guid?)x.CinemaId)
                .FirstOrDefault());

        await _unitOfWork.SaveChangesAsync();

        try
        {
            await _cacheService.ClearMovieCatalogCacheAsync();
            await _cacheService.ClearMovieDetailCacheAsync(itemId);
        }
        catch
        {
        }

        await _aiMovieEmbeddingSyncService.DeleteMovieAsync(itemId);

        return new BaseResponse<string>()
        {
            Message = Messages.Movie.DeletedSuccessfully,
            Data = null,
            IsSuccess = true
        };
    }
}
