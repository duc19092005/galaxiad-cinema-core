using Cinema.Domain.Exceptions;
using Cinema.Domain.Localization;
using Cinema.Application.Dtos;
using Cinema.Application.Interfaces;
using Cinema.Application.Interfaces.Admin;
using Cinema.Application.Interfaces.IThirdPersonServices;

namespace Cinema.Application.UseCases.MovieManager.MovieInfos;

public class DeleteMovieUseCase
{
    private readonly IUserContextService _userContextService;
    private readonly IAdminRepository _adminRepository;
    private readonly IAuditLogService _auditLogService;
    private readonly IAiMovieEmbeddingSyncService _aiMovieEmbeddingSyncService;

    public DeleteMovieUseCase(
        IUserContextService userContextService,
        IAdminRepository adminRepository,
        IAuditLogService auditLogService,
        IAiMovieEmbeddingSyncService aiMovieEmbeddingSyncService)
    {
        _userContextService = userContextService;
        _adminRepository = adminRepository;
        _auditLogService = auditLogService;
        _aiMovieEmbeddingSyncService = aiMovieEmbeddingSyncService;
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
            throw new BadRequestException("Phim này đã bị xóa.", "D01");
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

        await _adminRepository.SaveChangesAsync();
        await _aiMovieEmbeddingSyncService.DeleteMovieAsync(itemId);

        return new BaseResponse<string>()
        {
            Message = "Xóa phim thành công",
            Data = null,
            IsSuccess = true
        };
    }
}
