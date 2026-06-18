using Application.Identity.Ports;
using DataAccess;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Identity;

/// <summary>
/// Repository thao tác profile người dùng, hiện thực bằng EF Core.
/// </summary>
public class UserProfileRepository : IUserProfileRepository
{
    private readonly CinemaDbContext _dbContext;

    public UserProfileRepository(CinemaDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<UserProfileAccess?> GetProfileAccessAsync(
        Guid userId, CancellationToken cancellationToken = default)
    {
        return await _dbContext.UserInfoEntity
            .Where(x => x.UserId == userId)
            .Select(x => new UserProfileAccess(
                x.UserId,
                x.UserProfileEntity != null ? x.UserProfileEntity.UserName : null,
                x.UserRoleInfoEntity.Select(r => r.RoleListInfoEntity.RoleName).ToArray()))
            .AsNoTracking()
            .FirstOrDefaultAsync(cancellationToken);
    }

    public async Task<List<ManagedCinema>> GetManagedCinemasAsync(
        Guid userId, CancellationToken cancellationToken = default)
    {
        return await _dbContext.CinemaInfoEntity
            .Where(c => !c.IsDeleted && (c.TheaterManagerId == userId || c.FacilitiesManagerId == userId))
            .Select(c => new ManagedCinema(c.CinemaId, c.CinemaName))
            .AsNoTracking()
            .ToListAsync(cancellationToken);
    }

    public async Task<string?> GetPasswordHashAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var user = await _dbContext.UserInfoEntity
            .FirstOrDefaultAsync(x => x.UserId == userId, cancellationToken);
        return user?.Password;
    }

    public async Task UpdatePasswordAsync(
        Guid userId, string newPasswordHash, CancellationToken cancellationToken = default)
    {
        var user = await _dbContext.UserInfoEntity
            .FirstOrDefaultAsync(x => x.UserId == userId, cancellationToken);
        if (user != null)
        {
            user.Password = newPasswordHash;
        }
    }

    public async Task<bool> UpdateProfileAsync(
        Guid userId, ProfileUpdate update, CancellationToken cancellationToken = default)
    {
        var profile = await _dbContext.UserProfileEntity
            .FirstOrDefaultAsync(x => x.UserId == userId, cancellationToken);
        if (profile == null)
        {
            return false;
        }

        if (update.DateOfBirth.HasValue)
        {
            profile.DateOfBirth = update.DateOfBirth.Value;
        }
        if (!string.IsNullOrEmpty(update.UserName))
        {
            profile.UserName = update.UserName;
        }
        if (!string.IsNullOrEmpty(update.PhoneNumber))
        {
            profile.PhoneNumber = update.PhoneNumber;
        }
        if (!string.IsNullOrEmpty(update.IdentityCode))
        {
            profile.IdentityCode = update.IdentityCode;
        }

        return true;
    }
}
