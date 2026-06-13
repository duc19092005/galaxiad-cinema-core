
using Shared.Exceptions;
using BusinessLayer.Dtos.IdentityAccess.Requests;
using BusinessLayer.Dtos;
using Shared.Localization;
using BusinessLayer.Interfaces.IIdentityAccess;
using BusinessLayer.Validators.IdentityAccess;
using BusinessLayer.Constants;
using BusinessLayer.Entities.UserInfos;
using Shared.Enums;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using BusinessLayer.Services.IdentityAccess;
using Shared.Interfaces.Persistence;
using Shared.Utils;

namespace BusinessLayer.UseCases.IdentityAccess;

public class IdentityAccessRegularRegisterUseCase : IAddBehavior<ReqRegularRegisterDto , string>
{
    private readonly IUnitOfWork _unitOfWork;
    
    private readonly IConfiguration _configuration;
    
    private readonly ILogger<IdentityAccessRegularRegisterUseCase> _logger;

    public IdentityAccessRegularRegisterUseCase(IUnitOfWork unitOfWork , IConfiguration configuration, ILogger<IdentityAccessRegularRegisterUseCase> logger)
    {
        _unitOfWork = unitOfWork;
        _configuration = configuration;
        _logger = logger;
    }
    
    public async Task<BaseResponse<string>> Add(ReqRegularRegisterDto dto)
    {
        await using var transaction = await _unitOfWork.BeginTransactionAsync();        
        try
        {
            var validationErrors = new List<string>();
            var userRepository = _unitOfWork.Repository<UserInfoEntity>();
            var userRoleRepository = _unitOfWork.Repository<UserRoleInfoEntity>();

            if (await userRepository.AnyAsync(x => x.UserEmail == dto.UserEmail))
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

            var encryptedIdentityCode = AES256Helper.Encrypt(dto.IdentityCode, getAESKey, getAESIV);

            if (await userRepository.AnyAsync(x => x.IdentityCode == encryptedIdentityCode))
            {
                validationErrors.Add(Messages.Auth.IdentityCodeAlreadyExists);
            }
            
            if (validationErrors.Any())
            {
                throw new BadRequestException(validationErrors, "VALIDATION_ERROR");
            }

            // Add User

            var generateUserId = Guid.NewGuid();

            await userRepository.AddAsync(new UserInfoEntity()
            {
                UserId = generateUserId,
                UserEmail = dto.UserEmail,
                Password = BCrypt_helper.Hash(dto.UserPassword),
                RegisterMethod = RegisterMethodEnum.UsernamePassword,
                AccountStatus = AccountStatusEnum.Active,
                DateOfBirth = dto.DateOfBirth,
                IdentityCode = encryptedIdentityCode,
                PhoneNumber = dto.PhoneNumber,
                UserName = dto.UserName
            });

            await userRoleRepository.AddAsync(new UserRoleInfoEntity()
            {
                UserId = generateUserId,
                RoleId = userRoles.Customer
            });

            await _unitOfWork.Repository<CustomerProfileEntity>().AddAsync(new CustomerProfileEntity
            {
                UserId = generateUserId,
                TotalPoint = 0,
                UserSegmentId = user_segments_constant.MemberStandard
            });

            await _unitOfWork.SaveChangesAsync();
            
            await transaction.CommitAsync();

            return new BaseResponse<string>()
            {
                IsSuccess = true,
                Data = generateUserId.ToString(),
                Message = Messages.Auth.RegisterSuccess
            };
        }catch (AppException) {
            await transaction.RollbackAsync();
            throw;
        }
        catch (Exception ex) {
            _logger.LogError(ex, ex.Message);
            await transaction.RollbackAsync();
            throw new AppException(Messages.System.DatabaseError, 500, "S01");
        }
    }
}

