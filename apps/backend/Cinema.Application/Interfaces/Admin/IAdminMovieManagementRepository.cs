using Cinema.Application.Dtos.MovieManager.Responses;
using Cinema.Domain.Entities.CinemaInfos;
using Cinema.Domain.Entities.MovieInfos;

namespace Cinema.Application.Interfaces.Admin;

public interface IAdminMovieManagementRepository
{
    Task<List<ResGetMovieInfosMovieManagerDto>> GetMovieInfosAsync(Guid? currentUserId, bool isAdmin, Guid? cinemaId);
    Task<ResGetMovieInfosMovieManagerDto?> GetMovieInfoByIdAsync(Guid movieId, Guid? currentUserId, bool isAdmin);
    Task<MovieInfoEntity?> GetMovieInfoEntityAsync(Guid movieId);
    Task<bool> HasSuccessfulBookingAsync(Guid movieId);
    Task<bool> HasAnyBookingAsync(Guid movieId);
    Task<List<movieFormatMovieInfoEntity>> GetMovieFormatsByMovieIdAsync(Guid movieId);
    Task<List<MovieGenreMovieInfoEntity>> GetMovieGenresByMovieIdAsync(Guid movieId);
    Task<List<MovieCinemaEntity>> GetMovieCinemasByMovieIdAsync(Guid movieId);
    Task AddMovieAsync(MovieInfoEntity movie);
    Task AddMovieFormatsAsync(IEnumerable<movieFormatMovieInfoEntity> formats);
    Task AddMovieGenresAsync(IEnumerable<MovieGenreMovieInfoEntity> genres);
    Task AddMovieCinemasAsync(IEnumerable<MovieCinemaEntity> cinemas);
    void RemoveMovieFormats(IEnumerable<movieFormatMovieInfoEntity> formats);
    void RemoveMovieGenres(IEnumerable<MovieGenreMovieInfoEntity> genres);
    void RemoveMovieCinemas(IEnumerable<MovieCinemaEntity> cinemas);
    void RemoveMovie(MovieInfoEntity movie);
    void UpdateMovie(MovieInfoEntity movie);
    Task HardDeleteMovieAsync(Guid movieId);
    Task<bool> IsMovieNameExistsAsync(string name, Guid? excludeMovieId);
    Task<bool> IsMovieDescriptionExistsAsync(string description, Guid? excludeMovieId);
}
