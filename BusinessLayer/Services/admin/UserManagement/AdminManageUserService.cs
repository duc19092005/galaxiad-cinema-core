using BusinessLayer.Dtos;
using BusinessLayer.Services.Admin.Audit;
using DataAccess;
using Microsoft.EntityFrameworkCore;
using Shared.Enums;
using DataAccess.Entities.UserInfos;
using Microsoft.Extensions.Logging;
using Shared.Exceptions;

namespace BusinessLayer.Services.Admin.UserManagement;

public class AdminUserDto
{
    public Guid UserId { get; set; }
    public string UserEmail { get; set; } = string.Empty;
    public string UserName { get; set; } = string.Empty;

    public string UserRoles { get; set; } = string.Empty;
    public AccountStatusEnum AccountStatus { get; set; }
    public RegisterMethodEnum RegisterMethod { get; set; }
}

public class AdminManageUserService
{
    private readonly CinemaDbContext _dbContext;
    private readonly ILogger<AdminManageUserService> _logger;
    private readonly AuditLogService _auditLogService;

    public AdminManageUserService(CinemaDbContext dbContext, ILogger<AdminManageUserService> logger, AuditLogService auditLogService)
    {
        _dbContext = dbContext;
        _logger = logger;
        _auditLogService = auditLogService;
    }

    public async Task<BaseResponse<List<AdminUserDto>>> GetAllUsersAsync()
    {
        var users = await _dbContext.UserInfoEntity
            .OrderByDescending(u => u.UserId)
            .Select(u => new AdminUserDto
            {
                UserId = u.UserId,
                UserEmail = u.UserEmail,
                UserName = u.UserName ?? string.Empty,
                AccountStatus = u.AccountStatus,
                RegisterMethod = u.RegisterMethod,
                UserRoles = String.Join("," , u.UserRoleInfoEntity.Select(x => x.RoleListInfoEntity.RoleName))
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
        await _auditLogService.WriteAsync(
            "Update",
            "User",
            user.UserId,
            user.UserEmail,
            $"Updated user status to {status}.");
        await _dbContext.SaveChangesAsync();

        return new BaseResponse<string>
        {
            IsSuccess = true,
            Data = null,
            Message = $"User status updated to {status} successfully."
        };
    }

    public async Task<BaseResponse<string>> AssignRoleToUserAsync(Guid userId, List<Guid> roleIds)
    {
        var transactions = await _dbContext.Database.BeginTransactionAsync();
        try
        {
            var user = await _dbContext.UserInfoEntity.FindAsync(userId);
            if (user == null) return new BaseResponse<string> { IsSuccess = false, Message = "User not found." };

            var isValidRole = await _dbContext.RoleListInfoEntity.AnyAsync(r => roleIds.Contains(r.RoleId));

            if (!isValidRole)
            {
                throw new NotFoundException("Error role is invalid");
            }

            // Protect the Admin role: Don't delete it if it exists
            var adminRoleId = DataAccess.Constants.userRoles.Admin;
            
            bool hasAdminPreviously = await _dbContext.UserRoleInfoEntity
                .AnyAsync(ur => ur.UserId == userId && ur.RoleId == adminRoleId);

            await _dbContext.UserRoleInfoEntity
                .Where(ur => ur.UserId == userId && ur.RoleId != adminRoleId)
                .ExecuteDeleteAsync();

            // Add new roles, but skip Admin if they already have it to avoid duplicates
            var rolesToAdd = roleIds
                .Where(id => !(id == adminRoleId && hasAdminPreviously))
                .Select(x => new UserRoleInfoEntity
                {
                    UserId = userId,
                    RoleId = x
                }).ToList();

            if (rolesToAdd.Any())
            {
                await _dbContext.UserRoleInfoEntity.AddRangeAsync(rolesToAdd);
            }

            await _auditLogService.WriteAsync(
                "Update",
                "UserRole",
                user.UserId,
                user.UserEmail,
                "Updated user roles.");

            await _dbContext.SaveChangesAsync();
            await transactions.CommitAsync();

            return new BaseResponse<string> { IsSuccess = true, Message = $"Role Assign Completed successfully." };
        }
        catch (Exception e)
        {
            _logger.LogError(e.Message);
            await transactions.RollbackAsync();
            if (e is AppException)
            {
                throw;
            }
            throw CustomSystemException.SystemExceptionCaller();

        }
    }

    public async Task<BaseResponse<string>> AssignCinemaToManagerAsync(Guid cinemaId, Guid managerId)
    {
        var cinema = await _dbContext.CinemaInfoEntity.FindAsync(cinemaId);
        if (cinema == null) return new BaseResponse<string> { IsSuccess = false, Message = "Cinema not found." };

        var userRole = await _dbContext.UserRoleInfoEntity
            .Include(ur => ur.RoleListInfoEntity)
            .FirstOrDefaultAsync(ur => ur.UserId == managerId && 
                                       (ur.RoleListInfoEntity.RoleName == "TheaterManager" || ur.RoleListInfoEntity.RoleName == "FacilitiesManager"));

        if (userRole == null) return new BaseResponse<string> { IsSuccess = false, Message = "User must be a TheaterManager or FacilitiesManager." };

        if (userRole.RoleListInfoEntity.RoleName == "TheaterManager")
        {
            cinema.TheaterManagerId = managerId;
        }
        else
        {
            cinema.FacilitiesManagerId = managerId;
        }
        
        _dbContext.CinemaInfoEntity.Update(cinema);
        await _auditLogService.WriteAsync(
            "Update",
            "Cinema",
            cinema.CinemaId,
            cinema.CinemaName,
            $"Assigned {userRole.RoleListInfoEntity.RoleName} to cinema {cinema.CinemaName}.",
            cinema.CinemaId);
        await _dbContext.SaveChangesAsync();

        return new BaseResponse<string> { IsSuccess = true, Message = "Assigned cinema successfully." };
    }
}
