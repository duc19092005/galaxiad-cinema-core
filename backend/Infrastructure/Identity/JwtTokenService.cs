using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Application.Identity.Ports;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.IdentityModel.Tokens;
using Shared.Exceptions;
using Shared.Localization;

namespace Infrastructure.Identity;

/// <summary>Phát hành JWT HMAC-SHA256 cho user đã xác thực (hiệu lực 7 ngày).</summary>
public class JwtTokenService : ITokenService
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<JwtTokenService> _logger;

    public JwtTokenService(IConfiguration configuration, ILogger<JwtTokenService> logger)
    {
        _configuration = configuration;
        _logger = logger;
    }

    public string GenerateToken(string email, string? username, Guid userId, string[] roles)
    {
        var key = _configuration["JWT_Info:Key"];
        var iss = _configuration["JWT_Info:Iss"];
        var aud = _configuration["JWT_Info:Aud"];

        if (string.IsNullOrEmpty(key) || string.IsNullOrEmpty(iss) || string.IsNullOrEmpty(aud))
        {
            _logger.LogError("JWT_Info Key/Iss/Aud must not be null");
            throw new AppException(Messages.System.Error, 500, "E01");
        }

        var claims = new List<Claim>
        {
            new(ClaimTypes.Email, email),
            new(ClaimTypes.Sid, userId.ToString()),
            new(ClaimTypes.Name, username ?? string.Empty)
        };
        claims.AddRange(roles.Select(r => new Claim(ClaimTypes.Role, r)));

        var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key));
        var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            iss, aud, claims, DateTime.UtcNow, DateTime.UtcNow.AddDays(7), credentials);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
