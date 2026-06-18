namespace Application.Identity.Ports;

/// <summary>Cổng băm & xác thực mật khẩu.</summary>
public interface IPasswordHasher
{
    string Hash(string password);
    bool Verify(string hash, string password);
}

/// <summary>Cổng phát hành JWT cho user đã xác thực.</summary>
public interface ITokenService
{
    string GenerateToken(string email, string? username, Guid userId, string[] roles);
}

/// <summary>Cổng mã hoá/giải mã dữ liệu định danh nhạy cảm (vd: CCCD).</summary>
public interface IIdentityProtector
{
    string Encrypt(string plainText);
    string Decrypt(string cipherText);
}
