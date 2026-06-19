namespace Cinema.Application.Interfaces.IIdentityAccess;

/// <summary>
/// Abstraction for JWT token generation, decoupling Application from JWT library dependency.
/// </summary>
public interface IJwtService
{
    string? GenerateToken(string jwtKey, string jwtIss, string jwtAud,
        string userEmail, string username, Guid userId,
        string[] userRoles, string[] userPermissions);
}
