using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using Cinema.Application.Abstractions.Security;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Cinema.Application.Constants;
using Cinema.Domain.Entities.CinemaInfos;
using Cinema.Domain.Entities.UserInfos;
using Cinema.Application.Interfaces.Admin;
using Cinema.Application.Exceptions;
using Cinema.Domain.Interfaces.Persistence;
using Cinema.Domain.Localization;

namespace Cinema.Application.UseCases.Admin.UserManagement;

public static class AdminUserManagementHelper
{
    public static readonly Guid[] StaffRoleIds =
    [
        userRoles.Cashier,
        userRoles.MovieManager,
        userRoles.TheaterManager,
        userRoles.FacilitiesManager
    ];

    public static List<Guid> NormalizeStaffRoleIds(IEnumerable<Guid>? roleIds)
    {
        var nextRoleIds = (roleIds ?? []).Distinct().ToList();
        var invalidRoleIds = nextRoleIds.Where(roleId => !StaffRoleIds.Contains(roleId)).ToList();
        if (invalidRoleIds.Any())
        {
            throw new AppException("Only staff roles can be assigned from Admin Users.", 400, "ROLE_ERR");
        }
        return nextRoleIds;
    }

    public static string? EncryptFaceVector(
        float[]? faceVector,
        IConfiguration configuration,
        ILogger logger,
        IEncryptionService encryptionService)
    {
        if (faceVector == null || faceVector.Length == 0)
        {
            return null;
        }

        if (faceVector.Length != 128)
        {
            throw new AppException("Face vector must contain exactly 128 values.", 400, "FACE_ERR");
        }

        var aesKey = configuration["AES_256:Key"];
        var aesIv = configuration["AES_256:IV"];
        if (string.IsNullOrEmpty(aesKey) || string.IsNullOrEmpty(aesIv))
        {
            logger.LogError("Error AES Key and AES IV is null.");
            throw CustomSystemException.SystemExceptionCaller();
        }

        return encryptionService.Encrypt(JsonSerializer.Serialize(faceVector), aesKey, aesIv);
    }

    public static async Task<CinemaInfoEntity> ResolveTargetCinemaAsync(IAdminUserRepository adminUserRepository, Guid? cinemaId)
    {
        CinemaInfoEntity? cinema;
        if (cinemaId.HasValue)
        {
            cinema = await adminUserRepository.FindActiveCinemaAsync(cinemaId.Value);
        }
        else
        {
            cinema = await adminUserRepository.FindFirstActiveCinemaAsync();
        }

        if (cinema == null)
        {
            throw new AppException("Cannot assign staff role because no valid cinema branch exists.", 400, "ROLE_ERR");
        }

        return cinema;
    }

    public static async Task<Guid?> ValidateStaffAssignmentAsync(
        IUnitOfWork unitOfWork,
        IAdminUserRepository adminUserRepository,
        List<Guid> roleIds,
        Guid? cinemaId,
        Guid? departmentId)
    {
        if (roleIds.Count == 0)
        {
            return null;
        }

        var targetCinema = await ResolveTargetCinemaAsync(adminUserRepository, cinemaId);

        if (departmentId.HasValue)
        {
            var department = await adminUserRepository.FindActiveDepartmentAsync(departmentId.Value);

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

    public static async Task EnsureStaffProfileAsync(
        IUnitOfWork unitOfWork,
        IAdminUserRepository adminUserRepository,
        Guid userId,
        List<Guid> roleIds,
        Guid? cinemaId,
        Guid? departmentId,
        string? encryptedFaceVector)
    {
        var staffProfile = await adminUserRepository.FindStaffProfileAsync(userId);
        var targetCinema = await ResolveTargetCinemaAsync(adminUserRepository, cinemaId);

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
            unitOfWork.Repository<StaffProfileEntity>().Update(staffProfile);
            return;
        }

        await unitOfWork.Repository<StaffProfileEntity>().AddAsync(new StaffProfileEntity
        {
            UserId = userId,
            WorkingStatus = true,
            CinemaId = targetCinema.CinemaId,
            DepartmentId = departmentId,
            IsCinemaManager = roleIds.Contains(userRoles.TheaterManager),
            FaceVector = encryptedFaceVector
        });
    }

    public static async Task ReplaceStaffRolesAsync(
        IUnitOfWork unitOfWork,
        IAdminUserRepository adminUserRepository,
        Guid userId,
        List<Guid> roleIds,
        Guid? cinemaId,
        Guid? departmentId,
        string? encryptedFaceVector)
    {
        await adminUserRepository.DeleteStaffRolesAsync(userId, StaffRoleIds);

        if (roleIds.Count > 0)
        {
            var rolesToAdd = roleIds.Select(roleId => new UserRoleInfoEntity
            {
                UserId = userId,
                RoleId = roleId
            }).ToList();
            await unitOfWork.Repository<UserRoleInfoEntity>().AddRangeAsync(rolesToAdd);
            await EnsureStaffProfileAsync(unitOfWork, adminUserRepository, userId, roleIds, cinemaId, departmentId, encryptedFaceVector);
        }
        else
        {
            var staffProfile = await adminUserRepository.FindStaffProfileAsync(userId);
            if (staffProfile != null)
            {
                staffProfile.WorkingStatus = false;
                staffProfile.IsCinemaManager = false;
                unitOfWork.Repository<StaffProfileEntity>().Update(staffProfile);
            }
        }
    }
}

