using Application.Identity.Ports;
using DataAccess;
using DataAccess.Entities.UserInfos;
using Microsoft.EntityFrameworkCore;
using Shared.Enums;

namespace Infrastructure.Identity;

/// <summary>
/// Repository tài khoản người dùng cho luồng Identity, hiện thực bằng EF Core.
/// </summary>
public class UserAccountRepository : IUserAccountRepository
{
    private readonly CinemaDbContext _dbContext;

    public UserAccountRepository(CinemaDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<UserAuthInfo?> GetActiveByEmailAsync(string email, CancellationToken cancellationToken = default)
    {
        return await _dbContext.UserInfoEntity
            .Where(x => x.UserEmail == email && x.AccountStatus == AccountStatusEnum.Active)
            .Select(x => new UserAuthInfo(
                x.UserId,
                x.UserEmail,
                x.Password,
                x.UserProfileEntity != null ? x.UserProfileEntity.UserName : null,
                x.UserRoleInfoEntity.Select(r => r.RoleListInfoEntity.RoleName).ToArray()))
            .AsNoTracking()
            .FirstOrDefaultAsync(cancellationToken);
    }

    public async Task<bool> EmailExistsAsync(string email, CancellationToken cancellationToken = default)
    {
        return await _dbContext.UserInfoEntity.AnyAsync(x => x.UserEmail == email, cancellationToken);
    }

    public async Task<bool> IdentityCodeExistsAsync(
        string encryptedIdentityCode, CancellationToken cancellationToken = default)
    {
        return await _dbContext.UserProfileEntity
            .AnyAsync(x => x.IdentityCode == encryptedIdentityCode, cancellationToken);
    }

    public async Task AddUserAsync(NewUserRegistration registration, CancellationToken cancellationToken = default)
    {
        await _dbContext.UserInfoEntity.AddAsync(new UserInfoEntity
        {
            UserId = registration.UserId,
            UserEmail = registration.Email,
            Password = registration.PasswordHash,
            RegisterMethod = RegisterMethodEnum.UsernamePassword,
            AccountStatus = AccountStatusEnum.Active
        }, cancellationToken);

        await _dbContext.UserProfileEntity.AddAsync(new UserProfileEntity
        {
            UserId = registration.UserId,
            DateOfBirth = registration.DateOfBirth,
            IdentityCode = registration.EncryptedIdentityCode,
            PhoneNumber = registration.PhoneNumber,
            UserName = registration.Username
        }, cancellationToken);

        await _dbContext.UserRoleInfoEntity.AddAsync(new UserRoleInfoEntity
        {
            UserId = registration.UserId,
            RoleId = registration.RoleId
        }, cancellationToken);
    }
}
