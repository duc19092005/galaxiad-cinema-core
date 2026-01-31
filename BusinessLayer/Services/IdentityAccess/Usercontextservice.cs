using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Shared.Exceptions;

namespace BusinessLayer.Services.IdentityAccess;

public interface IUserContextService
{
    Guid GetUserId();
}

public class UserContextService : IUserContextService
{
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly ILogger<UserContextService> _logger;

    public UserContextService(IHttpContextAccessor httpContextAccessor, ILogger<UserContextService> logger)
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
            
            throw new UnauthorizeException();
        }
        catch (Exception e) when (e is not UnauthorizeException)
        {
            _logger.LogError(e, "Error retrieving User ID from context.");
            throw CustomSystemException.SystemExceptionCaller();
        }
    }
}
