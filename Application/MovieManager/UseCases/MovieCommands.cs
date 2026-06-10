namespace Application.MovieManager.UseCases;

/// <summary>Ảnh truyền vào use case (đã tách khỏi IFormFile của ASP.NET).</summary>
public record ImageUpload(Stream Content, string FileName);

public record CreateMovieCommand(
    Guid MovieRequiredAgeId,
    string MovieName,
    string MovieDescription,
    ImageUpload Image,
    DateTime StartedDate,
    DateTime EndedDate,
    int Duration,
    string? TrailerUrl,
    string? Director,
    string? Actors,
    IReadOnlyList<Guid> MovieFormatIds,
    IReadOnlyList<Guid> MovieGenreIds,
    IReadOnlyList<Guid> CinemaIds);

public record UpdateMovieCommand(
    Guid? MovieRequiredAgeId,
    string? MovieName,
    string? MovieDescription,
    ImageUpload? Image,
    DateTime? StartedDate,
    DateTime? EndedDate,
    int? Duration,
    string? TrailerUrl,
    string? Director,
    string? Actors,
    IReadOnlyList<Guid>? MovieFormatIds,
    IReadOnlyList<Guid>? MovieGenreIds,
    IReadOnlyList<Guid>? CinemaIds);
