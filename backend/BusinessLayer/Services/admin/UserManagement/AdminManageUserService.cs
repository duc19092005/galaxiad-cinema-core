using BusinessLayer.Constants;
using BusinessLayer.Dtos;
using BusinessLayer.Dtos.Admin.Responses;
using BusinessLayer.Entities.CinemaInfos;
using BusinessLayer.Entities.UserInfos;
using BusinessLayer.Interfaces.IThirdPersonServices;
using BusinessLayer.Services.Admin.Audit;
using BusinessLayer.Services.IdentityAccess;
using BusinessLayer.Validators.IdentityAccess;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Shared.Enums;
using Shared.Exceptions;
using Shared.Interfaces.Persistence;
using Shared.Localization;
using Shared.Utils;
using System.Text.Json;

namespace BusinessLayer.Services.Admin.UserManagement;

public class AdminUserDto
{
    public Guid UserId { get; set; }
    public string UserEmail { get; set; } = string.Empty;
    public string UserName { get; set; } = string.Empty;
    public string? PortraitImageUrl { get; set; }
    public string UserRoles { get; set; } = string.Empty;
    public AccountStatusEnum AccountStatus { get; set; }
    public RegisterMethodEnum RegisterMethod { get; set; }
    public string? CinemaName { get; set; }
}

public class AdminCreateUserRequestDto
{
    public string UserEmail { get; set; } = string.Empty;
    public string UserPassword { get; set; } = string.Empty;
    public string UserRepassword { get; set; } = string.Empty;
    public string UserName { get; set; } = string.Empty;
    public string IdentityCode { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public DateTime DateOfBirth { get; set; }
    public List<Guid> RoleIds { get; set; } = [];
    public Guid? CinemaId { get; set; }
    public Guid? DepartmentId { get; set; }
    public float[]? FaceVector { get; set; }
}

public class AdminCreateUserResponseDto
{
    public Guid UserId { get; set; }
}

public class AdminManageUserService
{
    private static readonly Guid[] StaffRoleIds =
    [
        userRoles.Cashier,
        userRoles.MovieManager,
        userRoles.TheaterManager,
        userRoles.FacilitiesManager
    ];

    private readonly IUnitOfWork _unitOfWork;
    private readonly ILogger<AdminManageUserService> _logger;
    private readonly AuditLogService _auditLogService;
    private readonly IImageStorageService _imageStorageService;
    private readonly IConfiguration _configuration;

    public AdminManageUserService(
        IUnitOfWork unitOfWork,
        ILogger<AdminManageUserService> logger,
        AuditLogService auditLogService,
        IImageStorageService imageStorageService,
        IConfiguration configuration)
    {
        _unitOfWork = unitOfWork;
        _logger = logger;
        _auditLogService = auditLogService;
        _imageStorageService = imageStorageService;
        _configuration = configuration;
    }

    public async Task<BaseResponse<List<AdminUserDto>>> GetAllUsersAsync()
    {
        var users = await Query<UserInfoEntity>()
            .OrderByDescending(u => u.UserId)
            .Select(u => new AdminUserDto
            {
                UserId = u.UserId,
                UserEmail = u.UserEmail,
                UserName = u.UserName ?? string.Empty,
                PortraitImageUrl = u.PortraitImageUrl,
                AccountStatus = u.AccountStatus,
                RegisterMethod = u.RegisterMethod,
                UserRoles = string.Join(",", u.UserRoleInfoEntity.Select(x => x.RoleListInfoEntity.RoleName)),
                CinemaName = u.StaffProfileEntity != null && u.StaffProfileEntity.CinemaInfoEntity != null 
                    ? u.StaffProfileEntity.CinemaInfoEntity.CinemaName 
                    : u.TheaterManagedCinemas.Any() 
                        ? u.TheaterManagedCinemas.First().CinemaName 
                        : u.FacilitiesManagedCinemas.Any() 
                            ? u.FacilitiesManagedCinemas.First().CinemaName 
                            : null
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
        var user = await Repository<UserInfoEntity>().FindAsync(userId);
        if (user == null)
        {
            return new BaseResponse<string>
            {
                IsSuccess = false,
                Message = "User not found."
            };
        }

        user.AccountStatus = status;
        Repository<UserInfoEntity>().Update(user);
        await _auditLogService.WriteAsync(
            "Update",
            "User",
            user.UserId,
            user.UserEmail,
            $"Updated user status to {status}.");
        await _unitOfWork.SaveChangesAsync();

        return new BaseResponse<string>
        {
            IsSuccess = true,
            Data = null,
            Message = $"User status updated to {status} successfully."
        };
    }

    public async Task<BaseResponse<AdminCreateUserResponseDto>> CreateUserAsync(AdminCreateUserRequestDto dto)
    {
        await using var transaction = await _unitOfWork.BeginTransactionAsync();
        try
        {
            var normalizedRoleIds = NormalizeStaffRoleIds(dto.RoleIds);
            var staffCinemaId = await ValidateStaffAssignmentAsync(normalizedRoleIds, dto.CinemaId, dto.DepartmentId);
            var encryptedFaceVector = EncryptFaceVector(dto.FaceVector);
            var validationErrors = new List<string>();
            var userRepository = Repository<UserInfoEntity>();

            if (string.IsNullOrWhiteSpace(dto.UserEmail))
                validationErrors.Add("Email is required.");
            if (string.IsNullOrWhiteSpace(dto.UserName))
                validationErrors.Add("User name is required.");
            if (dto.UserPassword != dto.UserRepassword)
                validationErrors.Add("Passwords do not match.");
            if (dto.UserPassword.Length < 8)
                validationErrors.Add("Password must be at least 8 characters.");
            if (!System.Text.RegularExpressions.Regex.IsMatch(dto.IdentityCode, "^\\d{12}$"))
                validationErrors.Add("Identity code must be exactly 12 digits.");
            if (!System.Text.RegularExpressions.Regex.IsMatch(dto.PhoneNumber, "^\\d{10}$"))
                validationErrors.Add("Phone number must be exactly 10 digits.");

            if (await userRepository.AnyAsync(x => x.UserEmail == dto.UserEmail))
                validationErrors.Add(Messages.Auth.EmailAlreadyExists);

            var ageMessage = RegisterValidate.CheckValidateAge(
                dto.DateOfBirth,
                normalizedRoleIds.Count > 0 ? RegisterUserTypeEnum.Staff : RegisterUserTypeEnum.Customer);
            if (ageMessage != null)
                validationErrors.Add(ageMessage);

            var aesKey = _configuration["AES_256:Key"];
            var aesIv = _configuration["AES_256:IV"];
            if (aesKey == null || aesIv == null)
            {
                _logger.LogError("Error AES Key and AES IV is null.");
                throw CustomSystemException.SystemExceptionCaller();
            }

            var encryptedIdentityCode = AES256Helper.Encrypt(dto.IdentityCode, aesKey, aesIv);
            if (await userRepository.AnyAsync(x => x.IdentityCode == encryptedIdentityCode))
                validationErrors.Add(Messages.Auth.IdentityCodeAlreadyExists);

            if (validationErrors.Any())
                throw new BadRequestException(validationErrors, "VALIDATION_ERROR");

            var userId = Guid.NewGuid();
            await userRepository.AddAsync(new UserInfoEntity
            {
                UserId = userId,
                UserEmail = dto.UserEmail,
                Password = BCrypt_helper.Hash(dto.UserPassword),
                RegisterMethod = RegisterMethodEnum.UsernamePassword,
                AccountStatus = AccountStatusEnum.Active,
                DateOfBirth = dto.DateOfBirth,
                IdentityCode = encryptedIdentityCode,
                PhoneNumber = dto.PhoneNumber,
                UserName = dto.UserName
            });

            await ReplaceStaffRolesAsync(userId, normalizedRoleIds, staffCinemaId, dto.DepartmentId, encryptedFaceVector);

            await _auditLogService.WriteAsync(
                "Create",
                "User",
                userId,
                dto.UserEmail,
                normalizedRoleIds.Count == 0 ? "Created user without staff roles." : "Created user with staff roles.");

            await _unitOfWork.SaveChangesAsync();
            await transaction.CommitAsync();

            return new BaseResponse<AdminCreateUserResponseDto>
            {
                IsSuccess = true,
                Data = new AdminCreateUserResponseDto { UserId = userId },
                Message = "User account created successfully."
            };
        }
        catch (AppException)
        {
            await transaction.RollbackAsync();
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, ex.Message);
            await transaction.RollbackAsync();
            throw CustomSystemException.SystemExceptionCaller();
        }
    }

    public async Task<BaseResponse<string>> AssignRoleToUserAsync(Guid userId, List<Guid> roleIds)
    {
        await using var transaction = await _unitOfWork.BeginTransactionAsync();
        try
        {
            var user = await Repository<UserInfoEntity>().FindAsync(userId);
            if (user == null)
            {
                return new BaseResponse<string> { IsSuccess = false, Message = "User not found." };
            }

            var normalizedRoleIds = NormalizeStaffRoleIds(roleIds);
            await ReplaceStaffRolesAsync(userId, normalizedRoleIds, null, null, null);

            await _auditLogService.WriteAsync(
                "Update",
                "UserRole",
                user.UserId,
                user.UserEmail,
                normalizedRoleIds.Count == 0 ? "Cleared staff roles." : "Updated staff roles.");

            await _unitOfWork.SaveChangesAsync();
            await transaction.CommitAsync();

            return new BaseResponse<string> { IsSuccess = true, Message = "Staff roles updated successfully." };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, ex.Message);
            await transaction.RollbackAsync();
            if (ex is AppException)
            {
                throw;
            }
            throw CustomSystemException.SystemExceptionCaller();
        }
    }

    public async Task<BaseResponse<string>> AssignCinemaToManagerAsync(Guid cinemaId, Guid managerId)
    {
        var cinema = await Repository<CinemaInfoEntity>().FindAsync(cinemaId);
        if (cinema == null) return new BaseResponse<string> { IsSuccess = false, Message = "Cinema not found." };

        var userRoles = await Query<UserRoleInfoEntity>()
            .Include(ur => ur.RoleListInfoEntity)
            .Where(ur => ur.UserId == managerId)
            .ToListAsync();

        var isManager = userRoles.Any(ur => ur.RoleListInfoEntity.RoleName == "TheaterManager" || ur.RoleListInfoEntity.RoleName == "FacilitiesManager");
        var isStaff = userRoles.Any(ur => StaffRoleIds.Contains(ur.RoleId));

        if (!isManager && !isStaff)
        {
            return new BaseResponse<string> { IsSuccess = false, Message = "User must be a staff member or manager." };
        }

        if (isManager)
        {
            var managerRole = userRoles.First(ur => ur.RoleListInfoEntity.RoleName == "TheaterManager" || ur.RoleListInfoEntity.RoleName == "FacilitiesManager");
            if (managerRole.RoleListInfoEntity.RoleName == "TheaterManager")
            {
                cinema.TheaterManagerId = managerId;
            }
            else
            {
                cinema.FacilitiesManagerId = managerId;
            }
            Repository<CinemaInfoEntity>().Update(cinema);
        }

        if (isStaff || isManager)
        {
            var staffProfile = await Query<StaffProfileEntity>().FirstOrDefaultAsync(sp => sp.UserId == managerId);
            if (staffProfile != null)
            {
                staffProfile.CinemaId = cinemaId;
                staffProfile.IsCinemaManager = userRoles.Any(ur => ur.RoleListInfoEntity.RoleName == "TheaterManager");
                Repository<StaffProfileEntity>().Update(staffProfile);
            }
            else
            {
                await Repository<StaffProfileEntity>().AddAsync(new StaffProfileEntity
                {
                    UserId = managerId,
                    WorkingStatus = true,
                    CinemaId = cinemaId,
                    IsCinemaManager = userRoles.Any(ur => ur.RoleListInfoEntity.RoleName == "TheaterManager")
                });
            }
        }

        await _auditLogService.WriteAsync(
            "Update",
            "Cinema",
            cinema.CinemaId,
            cinema.CinemaName,
            $"Assigned user to cinema {cinema.CinemaName}.",
            cinema.CinemaId);
        await _unitOfWork.SaveChangesAsync();

        return new BaseResponse<string> { IsSuccess = true, Message = "Assigned cinema successfully." };
    }

    public async Task<BaseResponse<string>> UpdateUserPortraitAsync(Guid userId, IFormFile? portrait)
    {
        if (portrait == null || portrait.Length == 0)
        {
            return new BaseResponse<string> { IsSuccess = false, Message = "Portrait image is required." };
        }

        var user = await Repository<UserInfoEntity>().FindAsync(userId);
        if (user == null)
        {
            return new BaseResponse<string> { IsSuccess = false, Message = "User not found." };
        }

        var oldPortraitUrl = user.PortraitImageUrl;
        var uploadResult = await _imageStorageService.PostImageAsync(portrait);
        if (!uploadResult.Success)
        {
            return new BaseResponse<string> { IsSuccess = false, Message = uploadResult.Result };
        }

        user.PortraitImageUrl = uploadResult.Result;
        Repository<UserInfoEntity>().Update(user);

        await _auditLogService.WriteAsync(
            "Update",
            "UserPortrait",
            user.UserId,
            user.UserEmail,
            "Updated user portrait image.");

        await _unitOfWork.SaveChangesAsync();

        if (!string.IsNullOrWhiteSpace(oldPortraitUrl))
        {
            _ = await _imageStorageService.DeleteImageAsync(oldPortraitUrl);
        }

        return new BaseResponse<string>
        {
            IsSuccess = true,
            Data = uploadResult.Result,
            Message = "Portrait image updated successfully."
        };
    }

    public async Task<List<string>> GetUserRolesAsync(Guid userId)
    {
        return await Query<UserRoleInfoEntity>()
            .AsNoTracking()
            .Where(x => x.UserId.Equals(userId))
            .Select(x => x.RoleListInfoEntity.RoleName)
            .ToListAsync();
    }

    public async Task<List<ResponseRolesDto>> GetAssignableRolesAsync()
    {
        return await Query<RoleListInfoEntity>()
            .AsNoTracking()
            .Where(x => StaffRoleIds.Contains(x.RoleId))
            .Select(x => new ResponseRolesDto
            {
                RoleId = x.RoleId,
                RoleName = x.RoleName
            })
            .ToListAsync();
    }

    public async Task<BaseResponse<List<ResponsePermissionDto>>> GetAllPermissionsAsync()
    {
        var permissions = await Query<PermissionEntity>()
            .AsNoTracking()
            .Select(p => new ResponsePermissionDto
            {
                PermissionId = p.PermissionId,
                PermissionInfo = p.PermissionInfo
            })
            .ToListAsync();

        return new BaseResponse<List<ResponsePermissionDto>>
        {
            IsSuccess = true,
            Data = permissions,
            Message = "Permissions loaded successfully."
        };
    }

    public async Task<BaseResponse<List<ResponseRolePermissionsDto>>> GetRolesPermissionsAsync()
    {
        var roles = await Query<RoleListInfoEntity>()
            .AsNoTracking()
            .Select(r => new ResponseRolePermissionsDto
            {
                RoleId = r.RoleId,
                RoleName = r.RoleName,
                Permissions = r.PermissionForRoleEntities.Select(pr => new ResponsePermissionDto
                {
                    PermissionId = pr.PermissionId,
                    PermissionInfo = pr.PermissionEntity.PermissionInfo
                }).ToList()
            })
            .ToListAsync();

        return new BaseResponse<List<ResponseRolePermissionsDto>>
        {
            IsSuccess = true,
            Data = roles,
            Message = "Role permissions loaded successfully."
        };
    }

    public async Task<BaseResponse<string>> UpdateRolePermissionsAsync(Guid roleId, List<Guid> permissionIds)
    {
        await using var transaction = await _unitOfWork.BeginTransactionAsync();
        try
        {
            var role = await Repository<RoleListInfoEntity>().FindAsync(roleId);
            if (role == null)
            {
                return new BaseResponse<string> { IsSuccess = false, Message = "Role not found." };
            }

            await Query<PermissionForRoleEntity>()
                .Where(pr => pr.RoleId == roleId)
                .ExecuteDeleteAsync();

            var nextPermissionIds = permissionIds.Distinct().ToList();
            if (nextPermissionIds.Contains(userPermissions.ApproveShift) &&
                roleId != userRoles.Admin &&
                roleId != userRoles.TheaterManager)
            {
                throw new BadRequestException("ApproveShift can only be assigned to Admin or TheaterManager.", "PERMISSION_ERR");
            }

            var validPermissionCount = await Query<PermissionEntity>()
                .CountAsync(permission => nextPermissionIds.Contains(permission.PermissionId));
            if (validPermissionCount != nextPermissionIds.Count)
            {
                throw new BadRequestException("One or more permissions are invalid.", "PERMISSION_ERR");
            }

            var newMappings = nextPermissionIds.Select(pid => new PermissionForRoleEntity
            {
                RoleId = roleId,
                PermissionId = pid
            }).ToList();

            if (newMappings.Any())
            {
                await Repository<PermissionForRoleEntity>().AddRangeAsync(newMappings);
            }

            await _auditLogService.WriteAsync(
                "Update",
                "RolePermissions",
                roleId,
                role.RoleName,
                $"Updated permissions for role {role.RoleName}.");

            await _unitOfWork.SaveChangesAsync();
            await transaction.CommitAsync();

            return new BaseResponse<string>
            {
                IsSuccess = true,
                Message = $"Permissions updated for role {role.RoleName}."
            };
        }
        catch (AppException)
        {
            await transaction.RollbackAsync();
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, ex.Message);
            await transaction.RollbackAsync();
            throw CustomSystemException.SystemExceptionCaller();
        }
    }

    private static List<Guid> NormalizeStaffRoleIds(IEnumerable<Guid>? roleIds)
    {
        var nextRoleIds = (roleIds ?? []).Distinct().ToList();
        var invalidRoleIds = nextRoleIds.Where(roleId => !StaffRoleIds.Contains(roleId)).ToList();
        if (invalidRoleIds.Any())
        {
            throw new BadRequestException("Only staff roles can be assigned from Admin Users.", "ROLE_ERR");
        }
        return nextRoleIds;
    }

    private async Task ReplaceStaffRolesAsync(Guid userId, List<Guid> roleIds, Guid? cinemaId, Guid? departmentId, string? encryptedFaceVector)
    {
        await Query<UserRoleInfoEntity>()
            .Where(ur => ur.UserId == userId && StaffRoleIds.Contains(ur.RoleId))
            .ExecuteDeleteAsync();

        if (roleIds.Count > 0)
        {
            var rolesToAdd = roleIds.Select(roleId => new UserRoleInfoEntity
            {
                UserId = userId,
                RoleId = roleId
            }).ToList();
            await Repository<UserRoleInfoEntity>().AddRangeAsync(rolesToAdd);
            await EnsureStaffProfileAsync(userId, roleIds, cinemaId, departmentId, encryptedFaceVector);
        }
        else
        {
            var staffProfile = await Query<StaffProfileEntity>()
                .FirstOrDefaultAsync(sp => sp.UserId == userId);
            if (staffProfile != null)
            {
                staffProfile.WorkingStatus = false;
                staffProfile.IsCinemaManager = false;
                Repository<StaffProfileEntity>().Update(staffProfile);
            }
        }
    }

    private async Task EnsureStaffProfileAsync(Guid userId, List<Guid> roleIds, Guid? cinemaId, Guid? departmentId, string? encryptedFaceVector)
    {
        var staffProfile = await Query<StaffProfileEntity>()
            .FirstOrDefaultAsync(sp => sp.UserId == userId);

        var targetCinema = await ResolveTargetCinemaAsync(cinemaId);

        if (staffProfile != null)
        {
            staffProfile.WorkingStatus = true;
            staffProfile.CinemaId = targetCinema.CinemaId;
            staffProfile.DepartmentId = departmentId;
            staffProfile.IsCinemaManager = roleIds.Contains(userRoles.TheaterManager);
            if (!string.IsNullOrWhiteSpace(encryptedFaceVector))
            {
                staffProfile.FaceVector = encryptedFaceVector;
            }
            Repository<StaffProfileEntity>().Update(staffProfile);
            return;
        }

        await Repository<StaffProfileEntity>().AddAsync(new StaffProfileEntity
        {
            UserId = userId,
            WorkingStatus = true,
            CinemaId = targetCinema.CinemaId,
            DepartmentId = departmentId,
            IsCinemaManager = roleIds.Contains(userRoles.TheaterManager),
            FaceVector = encryptedFaceVector
        });
    }

    private async Task<Guid?> ValidateStaffAssignmentAsync(List<Guid> roleIds, Guid? cinemaId, Guid? departmentId)
    {
        if (roleIds.Count == 0)
        {
            return null;
        }

        var targetCinema = await ResolveTargetCinemaAsync(cinemaId);

        if (departmentId.HasValue)
        {
            var department = await Query<DepartmentEntity>()
                .FirstOrDefaultAsync(d => d.DepartmentId == departmentId.Value && d.IsActive);

            if (department == null)
            {
                throw new AppException("Selected department does not exist or is inactive.", 400, "STAFF_ASSIGNMENT_ERR");
            }

            if (department.CinemaId != targetCinema.CinemaId)
            {
                throw new AppException("Selected department does not belong to the selected cinema.", 400, "STAFF_ASSIGNMENT_ERR");
            }
        }

        return targetCinema.CinemaId;
    }

    private async Task<CinemaInfoEntity> ResolveTargetCinemaAsync(Guid? cinemaId)
    {
        CinemaInfoEntity? cinema;
        if (cinemaId.HasValue)
        {
            cinema = await Query<CinemaInfoEntity>()
                .FirstOrDefaultAsync(c => c.CinemaId == cinemaId.Value && !c.IsDeleted);
        }
        else
        {
            cinema = await Query<CinemaInfoEntity>()
                .FirstOrDefaultAsync(c => !c.IsDeleted);
        }

        if (cinema == null)
        {
            throw new AppException("Cannot assign staff role because no valid cinema branch exists.", 400, "ROLE_ERR");
        }

        return cinema;
    }

    private string? EncryptFaceVector(float[]? faceVector)
    {
        if (faceVector == null || faceVector.Length == 0)
        {
            return null;
        }

        if (faceVector.Length != 128)
        {
            throw new AppException("Face vector must contain exactly 128 values.", 400, "FACE_ERR");
        }

        var aesKey = _configuration["AES_256:Key"];
        var aesIv = _configuration["AES_256:IV"];
        if (string.IsNullOrEmpty(aesKey) || string.IsNullOrEmpty(aesIv))
        {
            _logger.LogError("Error AES Key and AES IV is null.");
            throw CustomSystemException.SystemExceptionCaller();
        }

        return AES256Helper.Encrypt(JsonSerializer.Serialize(faceVector), aesKey, aesIv);
    }

    private IQueryable<TEntity> Query<TEntity>() where TEntity : class
    {
        return Repository<TEntity>().Query();
    }

    private IRepository<TEntity> Repository<TEntity>() where TEntity : class
    {
        return _unitOfWork.Repository<TEntity>();
    }
}

public class ResponsePermissionDto
{
    public Guid PermissionId { get; set; }
    public string PermissionInfo { get; set; } = string.Empty;
}

public class ResponseRolePermissionsDto
{
    public Guid RoleId { get; set; }
    public string RoleName { get; set; } = string.Empty;
    public List<ResponsePermissionDto> Permissions { get; set; } = [];
}
