namespace Application.MovieManager.Ports;

/// <summary>Dữ liệu tạo phim mới (đã tải ảnh xong, có URL).</summary>
public record NewMovieData(
    Guid MovieId,
    Guid MovieRequiredAgeId,
    string MovieName,
    string MovieDescription,
    string MovieImageUrl,
    DateTime StartedDate,
    DateTime EndedDate,
    int Duration,
    string TrailerUrl,
    string Director,
    string Actors,
    Guid CreatedByUserId,
    IReadOnlyList<Guid> MovieFormatIds,
    IReadOnlyList<Guid> MovieGenreIds,
    IReadOnlyList<Guid> CinemaIds);

/// <summary>Các trường có thể cập nhật cho phim (null = giữ nguyên).</summary>
public record MovieUpdateData(
    Guid? MovieRequiredAgeId,
    string? MovieName,
    string? MovieDescription,
    string? MovieImageUrl,
    DateTime? StartedDate,
    DateTime? EndedDate,
    int? Duration,
    string? TrailerUrl,
    string? Director,
    string? Actors,
    Guid UpdatedByUserId,
    IReadOnlyList<Guid>? MovieFormatIds,
    IReadOnlyList<Guid>? MovieGenreIds,
    IReadOnlyList<Guid>? CinemaIds);

/// <summary>Trạng thái phim phục vụ kiểm tra nghiệp vụ khi sửa/xoá.</summary>
public record MovieStateInfo(
    Guid MovieId,
    bool IsDeleted,
    string ImageUrl,
    DateTime ActiveAt,
    DateTime EndedDate);

/// <summary>
/// Cổng ghi cho phim. Infrastructure implement bằng EF Core.
/// </summary>
public interface IMovieRepository
{
    Task<bool> NameExistsAsync(string name, Guid? excludeMovieId, CancellationToken cancellationToken = default);

    Task<bool> DescriptionExistsAsync(string description, Guid? excludeMovieId, CancellationToken cancellationToken = default);

    Task<MovieStateInfo?> GetStateAsync(Guid movieId, CancellationToken cancellationToken = default);

    /// <summary>Phim có đơn vé ở trạng thái Booked hay không (chặn sửa/xoá cứng).</summary>
    Task<bool> HasSuccessfulBookingAsync(Guid movieId, CancellationToken cancellationToken = default);

    /// <summary>Phim có bất kỳ đơn nào (kể cả huỷ) hay không (quyết định soft vs hard delete).</summary>
    Task<bool> HasAnyBookingAsync(Guid movieId, CancellationToken cancellationToken = default);

    Task AddAsync(NewMovieData movie, CancellationToken cancellationToken = default);

    /// <summary>Cập nhật phim; trả về false nếu không tìm thấy.</summary>
    Task<bool> UpdateAsync(Guid movieId, MovieUpdateData update, CancellationToken cancellationToken = default);

    Task SoftDeleteAsync(Guid movieId, Guid deletedByUserId, CancellationToken cancellationToken = default);

    Task HardDeleteAsync(Guid movieId, CancellationToken cancellationToken = default);
}
