using System.Text.Json.Serialization;

namespace Cinema.Application.Dtos.IdentityAccess.Responses;

/// <summary>
/// Response khi khởi tạo Google OAuth flow - trả redirect URL cho FE
/// </summary>
public class ResGoogleLoginInitDto
{
    /// <summary>
    /// URL redirect đến Google consent screen
    /// </summary>
    public string RedirectUrl { get; set; } = string.Empty;
}

/// <summary>
/// Response khi Google OAuth callback thành công
/// </summary>
public class ResGoogleLoginDto
{
    public Guid UserId { get; set; }
    
    public string? Username { get; set; } = string.Empty;
    
    public string Email { get; set; } = string.Empty;
    
    public string[] Roles { get; set; } = [];
    
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? AccessToken { get; set; }
    
    /// <summary>
    /// True nếu là tài khoản mới được tạo, False nếu đã tồn tại
    /// </summary>
    public bool IsNewAccount { get; set; }
    
    /// <summary>
    /// Avatar URL từ Google profile
    /// </summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? AvatarUrl { get; set; }
}
