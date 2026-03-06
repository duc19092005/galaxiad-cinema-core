
using Shared.Exceptions;
using BusinessLayer.Dtos.IdentityAccess.Requests;
using BusinessLayer.Dtos;
using Shared.Localization;
using BusinessLayer.Interfaces.IIdentityAccess;
using BusinessLayer.Validators.IdentityAccess;
using DataAccess;
using DataAccess.Constants;
using DataAccess.Entities.UserInfos;
using Shared.Enums;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using BusinessLayer.Services.IdentityAccess;
using Shared.Utils;

namespace BusinessLayer.UseCases.IdentityAccess;

public class IdentityAccessRegularRegisterUseCase : IAddBehavior<ReqRegularRegisterDto , string>
{
    private readonly CinemaDbContext _dbContext;
    
    private readonly IConfiguration _configuration;
    
    private readonly ILogger<IdentityAccessRegularRegisterUseCase> _logger;

    public IdentityAccessRegularRegisterUseCase(CinemaDbContext dbContext , IConfiguration configuration, ILogger<IdentityAccessRegularRegisterUseCase> logger)
    {
        _dbContext = dbContext;
        _configuration = configuration;
        _logger = logger;
    }
    
    public async Task<BaseResponse<string>> Add(ReqRegularRegisterDto dto)
    {
        using var transaction = await _dbContext.Database.BeginTransactionAsync();        
        try
        {
            var validationErrors = new List<string>();

            if (RegisterValidate.CheckExistEmail(_dbContext, dto.UserEmail))
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

            if (RegisterValidate.CheckExistIdentityCode(getAESKey, getAESIV, _dbContext, dto.IdentityCode))
            {
                validationErrors.Add(Messages.Auth.IdentityCodeAlreadyExists);
            }
            
            if (validationErrors.Any())
            {
                throw new BadRequestException(validationErrors, "VALIDATION_ERROR");
            }

            // Add User

            var generateUserId = Guid.NewGuid();

            await _dbContext.UserInfoEntity.AddAsync(new UserInfoEntity()
            {
                UserId = generateUserId,
                UserEmail = dto.UserEmail,
                Password = BCrypt_helper.Hash(dto.UserPassword),
                RegisterMethod = RegisterMethodEnum.UsernamePassword
            });

            await _dbContext.UserProfileEntity.AddAsync(new UserProfileEntity()
            {
                UserId = generateUserId,
                DateOfBirth = dto.DateOfBirth,
                IdentityCode = AES256Helper.Encrypt(dto.IdentityCode, getAESKey, getAESIV),
                PhoneNumber = dto.PhoneNumber,
                UserName = dto.UserName,
            });

            await _dbContext.UserRoleInfoEntity.AddAsync(new UserRoleInfoEntity()
            {
                UserId = generateUserId,
                RoleId = userRoles.Customer
            });

            await _dbContext.SaveChangesAsync();
            
            await transaction.CommitAsync();

            return new BaseResponse<string>()
            {
                IsSuccess = true,
                Data = null,
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

