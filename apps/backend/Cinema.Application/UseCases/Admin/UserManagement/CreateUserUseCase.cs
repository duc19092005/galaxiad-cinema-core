using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Cinema.Application.Abstractions.Security;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Cinema.Application.Dtos;
using Cinema.Application.Dtos.Admin;
using Cinema.Domain.Entities.UserInfos;
using Cinema.Application.Interfaces.Admin;
using Cinema.Application.Interfaces;
using Cinema.Application.Interfaces.IIdentityAccess;
using Cinema.Domain.Enums;
using Cinema.Domain.Policies;
using Cinema.Application.Exceptions;
using Cinema.Domain.Interfaces.Persistence;
using Cinema.Domain.Localization;

namespace Cinema.Application.UseCases.Admin.UserManagement;

public class CreateUserUseCase
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IAdminUserRepository _adminUserRepository;
    private readonly ILogger<CreateUserUseCase> _logger;
    private readonly IAuditLogService _auditLogService;
    private readonly IConfiguration _configuration;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IEncryptionService _encryptionService;

    public CreateUserUseCase(
        IUnitOfWork unitOfWork,
        IAdminUserRepository adminUserRepository,
        ILogger<CreateUserUseCase> logger,
        IAuditLogService auditLogService,
        IConfiguration configuration,
        IPasswordHasher passwordHasher,
        IEncryptionService encryptionService)
    {
        _unitOfWork = unitOfWork;
        _adminUserRepository = adminUserRepository;
        _logger = logger;
        _auditLogService = auditLogService;
        _configuration = configuration;
        _passwordHasher = passwordHasher;
        _encryptionService = encryptionService;
    }

    public async Task<BaseResponse<AdminCreateUserResponseDto>> ExecuteAsync(AdminCreateUserRequestDto dto)
    {
        await using var transaction = await _unitOfWork.BeginTransactionAsync();
        try
        {
            var normalizedRoleIds = AdminUserManagementHelper.NormalizeStaffRoleIds(dto.RoleIds);
            var staffCinemaId = await AdminUserManagementHelper.ValidateStaffAssignmentAsync(_unitOfWork, _adminUserRepository, normalizedRoleIds, dto.CinemaId, dto.DepartmentId);
            var encryptedFaceVector = AdminUserManagementHelper.EncryptFaceVector(dto.FaceVector, _configuration, _logger, _encryptionService);
            var validationErrors = new List<string>();
            var userRepository = _unitOfWork.Repository<UserInfoEntity>();

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

            if (await _adminUserRepository.EmailExistsAsync(dto.UserEmail))
                validationErrors.Add(Messages.Auth.EmailAlreadyExists);

            var ageMessage = RegistrationAgePolicy.GetValidationMessage(
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

            var encryptedIdentityCode = _encryptionService.Encrypt(dto.IdentityCode, aesKey, aesIv);
            if (await _adminUserRepository.IdentityCodeExistsAsync(encryptedIdentityCode))
                validationErrors.Add(Messages.Auth.IdentityCodeAlreadyExists);

            if (validationErrors.Any())
                throw new BadRequestException(validationErrors, "VALIDATION_ERROR");

            var userId = Guid.NewGuid();
            await userRepository.AddAsync(new UserInfoEntity
            {
                UserId = userId,
                UserEmail = dto.UserEmail,
                Password = _passwordHasher.Hash(dto.UserPassword),
                RegisterMethod = RegisterMethodEnum.UsernamePassword,
                AccountStatus = AccountStatusEnum.Active,
                DateOfBirth = dto.DateOfBirth,
                IdentityCode = encryptedIdentityCode,
                PhoneNumber = dto.PhoneNumber,
                UserName = dto.UserName
            });

            await AdminUserManagementHelper.ReplaceStaffRolesAsync(_unitOfWork, _adminUserRepository, userId, normalizedRoleIds, staffCinemaId, dto.DepartmentId, encryptedFaceVector, dto.EmployeeType);

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
}
