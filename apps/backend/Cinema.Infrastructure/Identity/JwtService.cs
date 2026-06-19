using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Cinema.Application.Interfaces.IIdentityAccess;
using Microsoft.IdentityModel.Tokens;

namespace Cinema.Infrastructure.Identity;

/// <summary>
/// JWT-based implementation of IJwtService using System.IdentityModel.Tokens.Jwt.
/// </summary>
public class JwtService : IJwtService
{
    public string? GenerateToken(string jwtKey, string jwtIss, string jwtAud,
        string userEmail, string username, Guid userId,
        string[] userRoles, string[] userPermissions)
    {
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.Email, userEmail),
            new Claim(ClaimTypes.Sid, userId.ToString()),
            new Claim(ClaimTypes.Name, username),
        };

        foreach (var roleName in userRoles)
            claims.Add(new Claim(ClaimTypes.Role, roleName));

        foreach (var permissionName in userPermissions)
            claims.Add(new Claim("permission", permissionName));

        var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));
        var signingCredentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            jwtIss,
            jwtAud,
            claims,
            DateTime.UtcNow,
            DateTime.UtcNow.AddDays(7),
            signingCredentials);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
