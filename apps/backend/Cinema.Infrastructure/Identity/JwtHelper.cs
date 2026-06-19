using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;

namespace Cinema.Domain.Utils;

public class Jwt_helper
{
    public static string? Encrypt(string jwtKey , string jwtIss , string jwtAud ,string userEmail , string username , Guid userId , string [] userRoles, string[] userPermissions)
    {
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.Email , userEmail),
            new Claim(ClaimTypes.Sid , userId.ToString()),
            new Claim(ClaimTypes.Name , username),
        };

        foreach (var roleName in userRoles)
        {
            claims.Add(new Claim(ClaimTypes.Role, roleName));
        }

        foreach (var permissionName in userPermissions)
        {
            claims.Add(new Claim("permission", permissionName));
        }
        
        var SecurityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));
        // Tạo header
        var SigningCreatical = new SigningCredentials(SecurityKey, SecurityAlgorithms.HmacSha256);
        
        // Time is 7 days
        
        var Days = DateTime.UtcNow.AddDays(7);
        // Tạo JWT_Token
        var genrateTokenString = new JwtSecurityToken
        (jwtIss,
            jwtAud,
            claims, 
            DateTime.UtcNow,
            Days, SigningCreatical
        );

        var gettingToken = new JwtSecurityTokenHandler().WriteToken(genrateTokenString);
        
        if (gettingToken != null)
        {
            return gettingToken;
        }

        return null;
    }
}
