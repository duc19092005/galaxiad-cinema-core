namespace Cinema.Application.Interfaces.IThirdPersonServices;

public class GoogleUserProfile
{
    public string Id { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? Name { get; set; }
    public string? Picture { get; set; }
    public string? RefreshToken { get; set; }
}

public interface IGoogleAuthService
{
    string BuildAuthorizationUrl(string platform, string state);
    Task<GoogleUserProfile?> AuthenticateCodeAsync(string code, string platform, CancellationToken ct = default);
}
