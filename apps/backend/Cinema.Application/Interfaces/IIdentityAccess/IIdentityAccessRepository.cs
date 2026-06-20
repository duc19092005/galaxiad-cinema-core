using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Cinema.Application.Dtos.IdentityAccess.Responses;
using Cinema.Domain.Entities.UserInfos;
using Cinema.Domain.Interfaces.Persistence;

namespace Cinema.Application.Interfaces.IIdentityAccess;

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

    /// <summary>
    /// Commits all pending changes to the database as a single unit.
    /// </summary>
    Task SaveChangesAsync();

    /// <summary>
    /// Begins a database transaction. Returns IUnitOfWorkTransaction (Domain abstraction),
    /// hiding all EF Core/persistence details from the Application layer.
    /// </summary>
    Task<IUnitOfWorkTransaction> BeginTransactionAsync();
}
