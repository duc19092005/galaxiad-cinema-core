using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Cinema.Application.Abstractions.Security;
using Cinema.Application.Exceptions;
using Cinema.Application.Dtos.IdentityAccess.Requests;
using Cinema.Application.Dtos;
using Cinema.Domain.Localization;
using Cinema.Application.Interfaces.IIdentityAccess;
using Cinema.Application.Validators.IdentityAccess;
using Cinema.Application.Constants;
using Cinema.Domain.Entities.UserInfos;
using Cinema.Application.Interfaces;
using Cinema.Domain.Enums;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Cinema.Domain.Interfaces.Persistence;

namespace Cinema.Application.UseCases.IdentityAccess;

public class IdentityAccessRegularRegisterUseCase : IAddBehavior<ReqRegularRegisterDto, string>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IIdentityAccessRepository _repository;
    private readonly IConfiguration _configuration;
    private readonly ILogger<IdentityAccessRegularRegisterUseCase> _logger;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IEncryptionService _encryptionService;

    public IdentityAccessRegularRegisterUseCase(
        IIdentityAccessRepository repository,
        IConfiguration configuration,
        ILogger<IdentityAccessRegularRegisterUseCase> logger,
        IPasswordHasher passwordHasher,
        IUnitOfWork unitOfWork,
        IEncryptionService encryptionService)
    {
        _unitOfWork = unitOfWork;
        _repository = repository;
        _configuration = configuration;
        _logger = logger;
        _passwordHasher = passwordHasher;
        _encryptionService = encryptionService;
    }
    
    public async Task<BaseResponse<string>> Add(ReqRegularRegisterDto dto)
    {
        await using var transaction = await _unitOfWork.BeginTransactionAsync();
        try
        {
            var validationErrors = new List<string>();

            if (await _repository.EmailExistsAsync(dto.UserEmail))
            {
                validationErrors.Add(Messages.Auth.EmailAlreadyExists);
            }

            var ageMessage = RegisterValidate.CheckValidateAge(dto.DateOfBirth, RegisterUserTypeEnum.Customer);
            if (ageMessage != null)
            {
                validationErrors.Add(ageMessage);
            }

            string? getAESKey = _configuration["AES_256:Key"];
            string? getAESIV = _configuration["AES_256:IV"];

            if (getAESKey == null || getAESIV == null)
            {
                _logger.LogError("Error AES Key and AES IV is null !");
                throw CustomSystemException.SystemExceptionCaller();
            }

            var encryptedIdentityCode = _encryptionService.Encrypt(dto.IdentityCode, getAESKey, getAESIV);

            if (await _repository.IdentityCodeExistsAsync(encryptedIdentityCode))
            {
                validationErrors.Add(Messages.Auth.IdentityCodeAlreadyExists);
            }
            
            if (validationErrors.Any())
            {
                throw new BadRequestException(validationErrors, "VALIDATION_ERROR");
            }

            var generateUserId = Guid.NewGuid();

            await _repository.AddUserAsync(new UserInfoEntity
            {
                UserId = generateUserId,
                UserEmail = dto.UserEmail,
                Password = _passwordHasher.Hash(dto.UserPassword),
                RegisterMethod = RegisterMethodEnum.UsernamePassword,
                AccountStatus = AccountStatusEnum.Active,
                DateOfBirth = dto.DateOfBirth,
                IdentityCode = encryptedIdentityCode,
                PhoneNumber = dto.PhoneNumber,
                UserName = dto.UserName
            });

            await _repository.AddUserRoleAsync(new UserRoleInfoEntity
            {
                UserId = generateUserId,
                RoleId = userRoles.Customer
            });

            await _repository.AddCustomerProfileAsync(new CustomerProfileEntity
            {
                UserId = generateUserId,
                TotalPoint = 0,
                UserSegmentId = user_segments_constant.MemberStandard
            });

            await _unitOfWork.SaveChangesAsync();
            await transaction.CommitAsync();

            return new BaseResponse<string>
            {
                IsSuccess = true,
                Data = generateUserId.ToString(),
                Message = Messages.Auth.RegisterSuccess
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
            throw new AppException(Messages.System.DatabaseError, 500, "S01");
        }
    }
}
