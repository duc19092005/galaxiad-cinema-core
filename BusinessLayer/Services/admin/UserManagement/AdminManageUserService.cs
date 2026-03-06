using BusinessLayer.Dtos;
using DataAccess;
using Microsoft.EntityFrameworkCore;
using Shared.Enums;
using DataAccess.Entities.UserInfos;
using Microsoft.Extensions.Logging;

namespace BusinessLayer.Services.Admin.UserManagement;

public class AdminUserDto
{
    public Guid UserId { get; set; }
    public string UserEmail { get; set; } = string.Empty;
    public string UserName { get; set; } = string.Empty;
    public AccountStatusEnum AccountStatus { get; set; }
    public RegisterMethodEnum RegisterMethod { get; set; }
}

public class AdminManageUserService
{
    private readonly CinemaDbContext _dbContext;
    private readonly ILogger<AdminManageUserService> _logger;

    public AdminManageUserService(CinemaDbContext dbContext, ILogger<AdminManageUserService> logger)
    {
        _dbContext = dbContext;
        _logger = logger;
    }

    public async Task<BaseResponse<List<AdminUserDto>>> GetAllUsersAsync()
    {
        var users = await _dbContext.UserInfoEntity
            .Include(u => u.UserProfileEntity)
            .OrderByDescending(u => u.UserId)
            .Select(u => new AdminUserDto
            {
                UserId = u.UserId,
                UserEmail = u.UserEmail,
                UserName = u.UserProfileEntity != null ? u.UserProfileEntity.UserName : string.Empty,
                AccountStatus = u.AccountStatus,
                RegisterMethod = u.RegisterMethod
            })
            .ToListAsync();

        return new BaseResponse<List<AdminUserDto>>
        {
            IsSuccess = true,
            Data = users,
            Message = "Get all users successfully."
        };
    }

    public async Task<BaseResponse<string>> SetUserStatusAsync(Guid userId, AccountStatusEnum status)
    {
        var user = await _dbContext.UserInfoEntity.FindAsync(userId);
        if (user == null)
        {
            return new BaseResponse<string>
            {
                IsSuccess = false,
                Message = "User not found."
            };
        }

        user.AccountStatus = status;
        _dbContext.UserInfoEntity.Update(user);
        await _dbContext.SaveChangesAsync();

        return new BaseResponse<string>
        {
            IsSuccess = true,
            Data = null,
            Message = $"User status updated to {status} successfully."
        };
    }

    public async Task<BaseResponse<string>> AssignRoleToUserAsync(Guid userId, string roleName)
    {
        var user = await _dbContext.UserInfoEntity.FindAsync(userId);
        if (user == null) return new BaseResponse<string> { IsSuccess = false, Message = "User not found." };

        var role = await _dbContext.RoleListInfoEntity.FirstOrDefaultAsync(r => r.RoleName == roleName);
        if (role == null) return new BaseResponse<string> { IsSuccess = false, Message = "Role not found." };

        var existRole = await _dbContext.UserRoleInfoEntity.FirstOrDefaultAsync(ur => ur.UserId == userId);
        if (existRole != null)
        {
            _dbContext.UserRoleInfoEntity.Remove(existRole);
        }

        await _dbContext.UserRoleInfoEntity.AddAsync(new UserRoleInfoEntity
        {
            UserId = userId,
            RoleId = role.RoleId
        });

        await _dbContext.SaveChangesAsync();

        return new BaseResponse<string> { IsSuccess = true, Message = $"Assigned {roleName} role to user." };
    }

    public async Task<BaseResponse<string>> AssignCinemaToManagerAsync(Guid cinemaId, Guid managerId)
    {
        var cinema = await _dbContext.CinemaInfoEntity.FindAsync(cinemaId);
        if (cinema == null) return new BaseResponse<string> { IsSuccess = false, Message = "Cinema not found." };

        var managerRole = await _dbContext.UserRoleInfoEntity
            .Include(ur => ur.RoleListInfoEntity)
            .FirstOrDefaultAsync(ur => ur.UserId == managerId && ur.RoleListInfoEntity.RoleName == "TheaterManager");

        if (managerRole == null) return new BaseResponse<string> { IsSuccess = false, Message = "User is not a TheaterManager." };

        cinema.ManagerId = managerId;
        _dbContext.CinemaInfoEntity.Update(cinema);
        await _dbContext.SaveChangesAsync();

        return new BaseResponse<string> { IsSuccess = true, Message = "Assigned cinema successfully." };
    }
}
