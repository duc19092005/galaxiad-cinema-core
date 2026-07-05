namespace Cinema.Application.Interfaces;

public interface IUserContextService
{
    Guid GetUserId();
    Guid? TryGetUserId();
    string? GetEmail();
    string? GetUserName();
    bool IsInRole(string roleName);
}
