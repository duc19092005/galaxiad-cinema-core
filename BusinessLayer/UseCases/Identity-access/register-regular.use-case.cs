// ReSharper disable All

using Backend.Shard.Exceptions;
using BussinessLayer.Dtos.Identity_Access;
using BussinessLayer.Dtos;
using BussinessLayer.Interfaces.i_identity_access;
using BussinessLayer.Validates.Identity_access;
using DataAccess;
using DataAccess.Constants;
using DataAccess.Entities;
using DataAccess.Entities.User_Info;
using DataAccess.Enums;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Shared.Ultis;

namespace BussinessLayer.Use_cases.Identity_access;

public class identityAccessRegularRegisterUseCase : IAddBehavior<resRegularRegisterDto , string>
{
    private readonly cinemaDbContext _dbContext;
    
    private readonly IConfiguration _configuration;
    
    private readonly ILogger<identityAccessRegularRegisterUseCase> _logger;

    public identityAccessRegularRegisterUseCase(cinemaDbContext dbContext , IConfiguration configuration, ILogger<identityAccessRegularRegisterUseCase> logger)
    {
        _dbContext = dbContext;
        _configuration = configuration;
        _logger = logger;
    }
    
    public async BaseResponseponse<string>> Add(resRegularRegisterDto dto)
    {
        using var transaction = await _dbContext.Database.BeginTransactionAsync();        
        try
        {
            if (registerValidate.CheckExistEmail(_dbContext, dto.userEmail))
            {
                throw new appException("Email Already Exits", 400, "UError02");
            }

            var ageMessage = registerValidate.CheckValidateAge(dto.dateOfBirth, register_user_type_enum.Customer);

            if (ageMessage != null)
            {
                throw new appException(ageMessage, 404, "UError03");
            }

            string? getAESKey = _configuration["AES_256:Key"];
            string? getAESIV = _configuration["AES_256:IV"];

            if (getAESKey == null || getAESIV == null)
            {
                throw new appException("Key is Null", 400, "UError04");
            }

            if (registerValidate.CheckExistIdentityCode(getAESKey, getAESIV, _dbContext, dto.identityCode))
            {
                throw new appException("Identity Code is already Exits", 400, "UError05");
            }

            // Add User

            var generateUserId = Guid.NewGuid();

            await _dbContext.user_info_entity.AddAsync(new user_info_entity()
            {
                userId = generateUserId,
                userEmail = dto.userEmail,
                password = BCrypt_helper.Hash(dto.userPassword),
                registerMethod = register_method_enum.UsernamePassword
            });

            await _dbContext.user_profile_entity.AddAsync(new user_profile_entity()
            {
                userID = generateUserId,
                dateOfBirth = dto.dateOfBirth,
                identityCode = AES256Helper.Encrypt(dto.identityCode, getAESKey, getAESIV),
                phoneNumber = dto.phoneNumber,
                userName = dto.userName,
            });

            await _dbContext.user_role_info_entity.AddAsync(new user_role_info_entity()
            {
                userId = generateUserId,
                roleId = userRoles.Customer
            });

            await _dbContext.SaveChangesAsync();
            
            await transaction.CommitAsync();

            return new BaseResponse<string>()
            {
                isSuccess = true,
                data = null,
                message = "Register Successfully"
            };
        }catch (appException) {
            await transaction.RollbackAsync();
            throw;
        }
        catch (Exception ex) {
            _logger.LogError(ex, ex.Message);
            await transaction.RollbackAsync();
            throw new appException("Database Error", 500, "S01");
        }
    }
}