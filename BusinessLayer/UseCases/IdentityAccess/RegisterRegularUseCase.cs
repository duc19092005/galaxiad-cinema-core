// ReSharper disable All

using Shared.Exceptions;
using BusinessLayer.Dtos.IdentityAccess;
using BusinessLayer.Dtos;
using BusinessLayer.Interfaces.IIdentityAccess;
using BusinessLayer.Validators.IdentityAccess;
using DataAccess;
using DataAccess.Constants;
using DataAccess.Entities;
using DataAccess.Entities.UserInfos;
using Shared.Enums;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Shared.Utils;

namespace BusinessLayer.UseCases.IdentityAccess;

public class IdentityAccessRegularRegisterUseCase : IAddBehavior<ResRegularRegisterDto , string>
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
    
    public async Task<BaseResponse<string>> Add(ResRegularRegisterDto dto)
    {
        using var transaction = await _dbContext.Database.BeginTransactionAsync();        
        try
        {
            if (RegisterValidate.CheckExistEmail(_dbContext, dto.UserEmail))
            {
                throw new AppException("Email Already Exits", 400, "UError02");
            }

            var ageMessage = RegisterValidate.CheckValidateAge(dto.DateOfBirth, RegisterUserTypeEnum.Customer);

            if (ageMessage != null)
            {
                throw new AppException(ageMessage, 404, "UError03");
            }

            string? getAESKey = _configuration["AES_256:Key"];
            string? getAESIV = _configuration["AES_256:IV"];

            if (getAESKey == null || getAESIV == null)
            {
                throw new AppException("Key is Null", 400, "UError04");
            }

            if (RegisterValidate.CheckExistIdentityCode(getAESKey, getAESIV, _dbContext, dto.IdentityCode))
            {
                throw new AppException("Identity Code is already Exits", 400, "UError05");
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
                Message = "Register Successfully"
            };
        }catch (AppException) {
            await transaction.RollbackAsync();
            throw;
        }
        catch (Exception ex) {
            _logger.LogError(ex, ex.Message);
            await transaction.RollbackAsync();
            throw new AppException("Database Error", 500, "S01");
        }
    }
}

