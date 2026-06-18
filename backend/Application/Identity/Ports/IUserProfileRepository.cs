namespace Application.Identity.Ports;

/// <summary>Thông tin profile cơ bản trả cho client (get-profile).</summary>
public record UserProfileAccess(Guid UserId, string? Username, string[] Roles);

/// <summary>Rạp do manager phụ trách (gắn kèm khi user là Theater/Facilities manager).</summary>
public record ManagedCinema(Guid CinemaId, string CinemaName);

/// <summary>Trường có thể cập nhật trong profile (null = giữ nguyên).</summary>
public record ProfileUpdate(string? UserName, string? PhoneNumber, string? IdentityCode, DateTime? DateOfBirth);

/// <summary>
/// Cổng thao tác profile người dùng (đọc thông tin, đổi mật khẩu, cập nhật profile).
/// </summary>
public interface IUserProfileRepository
{
    Task<UserProfileAccess?> GetProfileAccessAsync(Guid userId, CancellationToken cancellationToken = default);

    Task<List<ManagedCinema>> GetManagedCinemasAsync(Guid userId, CancellationToken cancellationToken = default);

    /// <summary>Lấy hash mật khẩu hiện tại; null nếu không tìm thấy user.</summary>
    Task<string?> GetPasswordHashAsync(Guid userId, CancellationToken cancellationToken = default);

    Task UpdatePasswordAsync(Guid userId, string newPasswordHash, CancellationToken cancellationToken = default);

    /// <summary>Cập nhật profile; trả về false nếu không tìm thấy profile.</summary>
    Task<bool> UpdateProfileAsync(Guid userId, ProfileUpdate update, CancellationToken cancellationToken = default);
}
