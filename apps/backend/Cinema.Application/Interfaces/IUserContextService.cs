namespace Cinema.Application.Interfaces;

public interface IUserContextService
{
    Guid GetUserId();
    Guid? TryGetUserId();
    bool IsInRole(string roleName);
}
