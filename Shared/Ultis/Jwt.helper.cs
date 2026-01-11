using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;

namespace Shared.Ultis;
// ReSharper disable All

public class Jwt_helper
{
    public static string? Encrypt(string jwtKey , string jwtIss , string jwtAud ,string userEmail , Guid userId , string [] userRoles)
    {
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.Email , userEmail),
            new Claim(ClaimTypes.Sid , userId.ToString()),
        };

        foreach (var roleName in userRoles)
        {
            claims.Add(new Claim(ClaimTypes.Role, roleName));
        }
        
        var SecurityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));
        // Tạo header
        var SigningCreatical = new SigningCredentials(SecurityKey, SecurityAlgorithms.HmacSha256);
        
        // Time is 7 days
        
        var Days = DateTime.Now.AddDays(7);
        // Tạo JWT_Token
        var genrateTokenString = new JwtSecurityToken
        (jwtIss,
            jwtAud,
            claims, 
            DateTime.Now,
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