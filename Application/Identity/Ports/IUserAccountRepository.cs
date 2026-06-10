namespace Application.Identity.Ports;

/// <summary>Thông tin xác thực user lấy theo email (phục vụ đăng nhập).</summary>
public record UserAuthInfo(
    Guid UserId,
    string Email,
    string PasswordHash,
    string? Username,
    string[] Roles);

/// <summary>Dữ liệu tạo user mới (đăng ký).</summary>
public record NewUserRegistration(
    Guid UserId,
    string Email,
    string PasswordHash,
    string Username,
    string EncryptedIdentityCode,
    string PhoneNumber,
    DateTime DateOfBirth,
    Guid RoleId);

/// <summary>
/// Cổng truy cập tài khoản người dùng cho luồng Identity. Infrastructure implement bằng EF Core.
/// </summary>
public interface IUserAccountRepository
{
    Task<UserAuthInfo?> GetActiveByEmailAsync(string email, CancellationToken cancellationToken = default);

    Task<bool> EmailExistsAsync(string email, CancellationToken cancellationToken = default);

    Task<bool> IdentityCodeExistsAsync(string encryptedIdentityCode, CancellationToken cancellationToken = default);

    Task AddUserAsync(NewUserRegistration registration, CancellationToken cancellationToken = default);
}
