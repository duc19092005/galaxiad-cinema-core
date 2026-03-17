using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Shared.Exceptions;

namespace BusinessLayer.Services.IdentityAccess;

public interface IUserContextService
{
    Guid GetUserId();
    Guid? TryGetUserId();
    bool IsInRole(string roleName);
}

public class UserContextservice : IUserContextService
{
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly ILogger<UserContextservice> _logger;

    public UserContextservice(IHttpContextAccessor httpContextAccessor, ILogger<UserContextservice> logger)
    {
        _httpContextAccessor = httpContextAccessor;
        _logger = logger;
    }

    public Guid GetUserId()
    {
        try
        {
            var user = _httpContextAccessor.HttpContext?.User;
            var userIdClaim = user?.FindFirst(ClaimTypes.Sid) ?? user?.FindFirst(ClaimTypes.NameIdentifier);
            var userIdValue = userIdClaim?.Value;

            if (userIdValue != null && Guid.TryParse(userIdValue, out var guid))
            {
                return guid;
            }
            
            throw new UnauthorizeException(null);
        }
        catch (Exception e) when (e is not UnauthorizeException)
        {
            _logger.LogError(e, "Error retrieving User ID from context.");
            throw CustomSystemException.SystemExceptionCaller();
        }
    }
    public Guid? TryGetUserId()
    {
        try
        {
            var user = _httpContextAccessor.HttpContext?.User;
            var userIdClaim = user?.FindFirst(ClaimTypes.Sid) ?? user?.FindFirst(ClaimTypes.NameIdentifier);
            var userIdValue = userIdClaim?.Value;

            if (userIdValue != null && Guid.TryParse(userIdValue, out var guid))
            {
                return guid;
            }

            return null;
        }
        catch
        {
            return null;
        }
    }

    public bool IsInRole(string roleName)
    {
        return _httpContextAccessor.HttpContext?.User.IsInRole(roleName) ?? false;
    }
}
