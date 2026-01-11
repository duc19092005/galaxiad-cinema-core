// ReSharper disable All

using Backend.Shard.Exceptions;
using BussinessLayer.Dtos.Identity_Access;
using BussinessLayer.Dtos.Response;
using BussinessLayer.Interfaces;
using BussinessLayer.Validates.Identity_access;
using DataAccess;
using DataAccess.Entities;
using DataAccess.Entities.User_Info;
using DataAccess.Enums;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Shared.Ultis;

namespace BussinessLayer.Use_cases.Identity_access;

public class regular_register_use_case : IAddBehavior<regular_register_request_dto , string>
{
    private readonly dbContext _dbContext;
    
    private readonly IConfiguration _configuration;
    
    private readonly ILogger<regular_register_use_case> _logger;

    public regular_register_use_case(dbContext dbContext , IConfiguration configuration, ILogger<regular_register_use_case> logger)
    {
        _dbContext = dbContext;
        _configuration = configuration;
        _logger = logger;
    }
    
    public async Task<base_reponse<string>> Add(regular_register_request_dto dto)
    {
        using var transaction = await _dbContext.Database.BeginTransactionAsync();        
        try
        {
            
            if (register_validate.checkExistEmail(_dbContext, dto.userEmail))
            {
                throw new app_exception("Email Already Exits", 400, "UError02");
            }

            var ageMessage = register_validate.checkValidateAge(dto.dateOfBirth, register_user_type_enum.Customer);

            if (ageMessage != null)
            {
                throw new app_exception(ageMessage, 404, "UError03");
            }

            string? getAESKey = _configuration["AES_256:Key"];
            string? getAESIV = _configuration["AES_256:IV"];

            if (getAESKey == null || getAESIV == null)
            {
                throw new app_exception("Key is Null", 400, "UError04");
            }

            if (register_validate.checkExistIdentityCode(getAESKey, getAESIV, _dbContext, dto.identityCode))
            {
                throw new app_exception("Identity Code is already Exits", 400, "UError05");
            }

            // Add User

            var generateUserId = Guid.NewGuid().ToString();

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

            await _dbContext.SaveChangesAsync();
            
            await transaction.CommitAsync();

            return new base_reponse<string>()
            {
                isSuccess = true,
                data = null,
                message = "Register Successfully"
            };
        }catch (app_exception) {
            await transaction.RollbackAsync();
            throw;
        }
        catch (Exception ex) {
            _logger.LogError(ex, ex.Message);
            await transaction.RollbackAsync();
            throw new app_exception("Database Error", 500, "S01");
        }
    }
}