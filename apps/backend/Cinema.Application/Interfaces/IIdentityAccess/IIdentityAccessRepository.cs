using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Cinema.Application.Dtos.IdentityAccess.Responses;
using Cinema.Domain.Entities.UserInfos;

namespace Cinema.Application.Interfaces.IIdentityAccess;

public interface IIdentityAccessTransaction : IAsyncDisposable
{
    Task CommitAsync();
    Task RollbackAsync();
}

public interface IIdentityAccessRepository
{
    Task<UserInfoEntity?> FindUserByEmailAsync(string email);
    Task<bool> EmailExistsAsync(string email);
    Task<bool> IdentityCodeExistsAsync(string encryptedIdentityCode);
    Task<UserInfoEntity?> FindUserByIdAsync(Guid userId);
    Task<UserInfoEntity?> FindUserByIdWithRolesAsync(Guid userId);
    Task<bool> IsSharedPosAccountAsync(Guid userId);
    Task<List<ManagedCinemaInfoDto>> GetActiveCinemasAsync();
    Task<List<ManagedCinemaInfoDto>> GetManagedCinemasAsync(Guid userId);
    Task<List<Guid>> GetUserRoleIdsAsync(Guid userId);
    Task<List<string>> GetUserPermissionsAsync(List<Guid> roleIds);
    Task AddUserAsync(UserInfoEntity user);
    Task AddUserRoleAsync(UserRoleInfoEntity userRole);
    Task AddCustomerProfileAsync(CustomerProfileEntity customerProfile);
    Task SaveChangesAsync();
    Task<IIdentityAccessTransaction> BeginTransactionAsync();
}
