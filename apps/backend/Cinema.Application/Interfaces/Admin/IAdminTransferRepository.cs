using Cinema.Application.Dtos.Admin.Responses;

namespace Cinema.Application.Interfaces.Admin;

public interface IAdminTransferRepository
{
    Task<List<AdminTransferUserDto>> GetUsersByRoleAsync(Guid roleId);
    Task<List<ManagedItemDto>> GetManagedCinemasAsync(Guid? managerUserId, bool filterUnmanaged, bool isFacilities);
    Task<List<ManagedItemDto>> GetManagedMoviesAsync(Guid? managerUserId, bool filterUnmanaged);
}
