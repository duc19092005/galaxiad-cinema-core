using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Cinema.Application.Dtos.IdentityAccess.Responses;
using Cinema.Domain.Entities.CinemaInfos;
using Cinema.Domain.Entities.UserInfos;
using Cinema.Application.Interfaces.IIdentityAccess;

namespace Cinema.Infrastructure.Repositories;

public class IdentityAccessRepository : IIdentityAccessRepository
{
    private readonly CinemaDbContext _dbContext;

    public IdentityAccessRepository(CinemaDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<UserInfoEntity?> FindUserByEmailAsync(string email)
    {
        return await _dbContext.Set<UserInfoEntity>()
            .Include(u => u.UserRoleInfoEntity)
                .ThenInclude(r => r.RoleListInfoEntity)
            .FirstOrDefaultAsync(u => u.UserEmail == email);
    }

    public async Task<bool> EmailExistsAsync(string email)
    {
        return await _dbContext.Set<UserInfoEntity>()
            .AnyAsync(x => x.UserEmail == email);
    }

    public async Task<bool> IdentityCodeExistsAsync(string encryptedIdentityCode)
    {
        return await _dbContext.Set<UserInfoEntity>()
            .AnyAsync(x => x.IdentityCode == encryptedIdentityCode);
    }

    public async Task<UserInfoEntity?> FindUserByIdAsync(Guid userId)
    {
        return await _dbContext.Set<UserInfoEntity>()
            .FirstOrDefaultAsync(x => x.UserId == userId);
    }

    public async Task<UserInfoEntity?> FindUserByIdWithRolesAsync(Guid userId)
    {
        return await _dbContext.Set<UserInfoEntity>()
            .Include(u => u.UserRoleInfoEntity)
                .ThenInclude(r => r.RoleListInfoEntity)
            .FirstOrDefaultAsync(u => u.UserId == userId);
    }

    public async Task<bool> IsSharedPosAccountAsync(Guid userId)
    {
        return await _dbContext.Set<DepartmentEntity>()
            .AnyAsync(d => d.SharedUserId == userId && d.IsActive);
    }

    public async Task<List<ManagedCinemaInfoDto>> GetActiveCinemasAsync()
    {
        return await _dbContext.Set<CinemaInfoEntity>()
            .Where(c => !c.IsDeleted)
            .Select(c => new ManagedCinemaInfoDto
            {
                CinemaId = c.CinemaId,
                CinemaName = c.CinemaName
            })
            .ToListAsync();
    }

    public async Task<List<ManagedCinemaInfoDto>> GetManagedCinemasAsync(Guid userId)
    {
        return await _dbContext.Set<CinemaInfoEntity>()
            .Where(c => !c.IsDeleted && (c.TheaterManagerId == userId || c.FacilitiesManagerId == userId))
            .Select(c => new ManagedCinemaInfoDto
            {
                CinemaId = c.CinemaId,
                CinemaName = c.CinemaName
            })
            .ToListAsync();
    }

    public async Task<List<ManagedCinemaInfoDto>> GetPosSharedCinemasAsync(Guid userId)
    {
        return await _dbContext.Set<DepartmentEntity>()
            .Include(d => d.CinemaInfoEntity)
            .Where(d => d.SharedUserId == userId && d.IsActive && !d.CinemaInfoEntity.IsDeleted)
            .Select(d => new ManagedCinemaInfoDto
            {
                CinemaId = d.CinemaId,
                CinemaName = d.CinemaInfoEntity.CinemaName
            })
            .ToListAsync();
    }

    public async Task<List<Guid>> GetUserRoleIdsAsync(Guid userId)
    {
        return await _dbContext.Set<UserRoleInfoEntity>()
            .Where(ur => ur.UserId == userId)
            .Select(ur => ur.RoleId)
            .ToListAsync();
    }

    public async Task<List<string>> GetUserPermissionsAsync(List<Guid> roleIds)
    {
        return await _dbContext.Set<PermissionForRoleEntity>()
            .Where(pr => roleIds.Contains(pr.RoleId))
            .Select(pr => pr.PermissionEntity.PermissionInfo)
            .Distinct()
            .ToListAsync();
    }

    public async Task AddUserAsync(UserInfoEntity user)
    {
        await _dbContext.Set<UserInfoEntity>().AddAsync(user);
    }

    public async Task AddUserRoleAsync(UserRoleInfoEntity userRole)
    {
        await _dbContext.Set<UserRoleInfoEntity>().AddAsync(userRole);
    }

    public async Task AddCustomerProfileAsync(CustomerProfileEntity customerProfile)
    {
        await _dbContext.Set<CustomerProfileEntity>().AddAsync(customerProfile);
    }
}
