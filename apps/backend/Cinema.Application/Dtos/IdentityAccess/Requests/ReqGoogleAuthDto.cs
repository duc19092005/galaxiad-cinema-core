using System.ComponentModel.DataAnnotations;

namespace Cinema.Application.Dtos.IdentityAccess.Requests;

/// <summary>
/// DTO cho việc khởi tạo Google OAuth flow
/// FE gọi endpoint này để lấy redirect URL đến Google consent screen
/// </summary>
public class ReqGoogleLoginDto
{
    /// <summary>
    /// Loại client: "web" hoặc "mobile"
    /// </summary>
    [Required(ErrorMessage = "Platform is required (web or mobile)")]
    public string Platform { get; set; } = "web";
}

/// <summary>
/// DTO cho Google OAuth callback - nhận authorization code từ Google
/// </summary>
public class ReqGoogleCallbackDto
{
    /// <summary>
    /// Authorization code từ Google OAuth consent screen
    /// </summary>
    [Required(ErrorMessage = "Authorization code is required")]
    public string Code { get; set; } = string.Empty;

    /// <summary>
    /// State parameter để verify request (chống CSRF)
    /// </summary>
    [Required(ErrorMessage = "State is required")]
    public string State { get; set; } = string.Empty;
}
