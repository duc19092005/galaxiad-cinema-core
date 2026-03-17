using Shared.Exceptions;
using Shared.Localization;
using BusinessLayer.Dtos;
using BusinessLayer.Dtos.IdentityAccess.Requests;
using BusinessLayer.Dtos.IdentityAccess.Responses;
using BusinessLayer.Interfaces.IIdentityAccess;
using BusinessLayer.Services.IdentityAccess;
using DataAccess;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using BusinessLayer.Services.IdentityAccess;

namespace BusinessLayer.UseCases.IdentityAccess;

public class UserProfileUseCase : IProfileBehavior
{
    private readonly CinemaDbContext _dbContext;
    private readonly IUserContextService _userContextService;
    private readonly ILogger<UserProfileUseCase> _logger;

    public UserProfileUseCase(CinemaDbContext dbContext, IUserContextService userContextService,
        ILogger<UserProfileUseCase> logger)
    {
        _dbContext = dbContext;
        _userContextService = userContextService;
        _logger = logger;
    }
    
    public async Task<BaseResponse<ResRegularLoginDto>> GetAccess()
    {
        try
        {
            var userId = _userContextService.GetUserId();
            
            // Get user basic info
            var result = await _dbContext.UserInfoEntity
                .AsNoTracking()
                .Where(x => x.UserId == userId)
                .Select(x => new ResRegularLoginDto
                {
                    UserId = x.UserId,
                    Username = _dbContext.UserProfileEntity
                                .Where(p => p.UserId == x.UserId)
                                .Select(p => p.UserName)
                                .FirstOrDefault(),
                    Roles = _dbContext.UserRoleInfoEntity
                                .Where(r => r.UserId == x.UserId)
                                .Select(r => r.RoleListInfoEntity.RoleName)
                                .ToArray(),
                    AccessToken = null
                })
                .FirstOrDefaultAsync();

            if (result == null) 
                throw new AppException(Messages.Auth.UserNotFound, 404, "UN01");
            
            if (string.IsNullOrEmpty(result.Username))
                _logger.LogError("User with Id {0} Profile Not Found", userId);

            if (result.Roles == null || result.Roles.Length == 0)
                throw new AppException(Messages.Auth.RoleNotFound, 403, "UN02");

            // Look up managed cinemas if the user is a manager
            if (result.Roles.Contains("TheaterManager") || result.Roles.Contains("FacilitiesManager"))
            {
                var managedCinemas = await _dbContext.CinemaInfoEntity
                    .Where(c => !c.IsDeleted && (c.TheaterManagerId == userId || c.FacilitiesManagerId == userId))
                    .Select(c => new ManagedCinemaInfoDto
                    {
                        CinemaId = c.CinemaId,
                        CinemaName = c.CinemaName
                    })
                    .ToListAsync();

                if (managedCinemas.Any())
                {
                    result.ManagedCinemas = managedCinemas;
                }
            }

            return new BaseResponse<ResRegularLoginDto>()
            {
                IsSuccess = true,
                Data = result,
                Message = Messages.Auth.ValidateSuccess
            };
        }
        catch (AppException) { throw; }
        catch (Exception ex)
        {
            _logger.LogError(ex, "System error in getAccess");
            throw new AppException(Messages.System.GeneralError, 500, "S01");
        }
    }
    
    public async Task<BaseResponse<string>> ChangePassword(ReqChangePasswordDto request)
    {
        try
        {
            // Get User Id
            var getUserId = _userContextService.GetUserId();

            var findUser = await _dbContext.UserInfoEntity.FirstOrDefaultAsync(x => x.UserId.Equals(getUserId));

            if (findUser == null)
            {
                throw new AppException(Messages.Auth.UserInfoNotFound, 404, "Error01");
            }
            else
            {
                if (!BCrypt_helper.Validate(findUser.Password, request.OldPassword!))
                {
                    throw new AppException(Messages.Auth.OldPasswordNotMatch, 400, "Error02");
                }else if (!BCrypt_helper.Validate(findUser.Password, request.NewPassword!))
                {
                    throw new AppException(Messages.Auth.NewPasswordSameAsOld, 400, "Error02");
                }else
                {
                    var newPassword = BCrypt_helper.Hash(request.NewPassword!);
                    findUser.Password = newPassword;
                    await _dbContext.SaveChangesAsync();
                    return new BaseResponse<string>()
                    {
                        IsSuccess = true,
                        Data = null,
                        Message = Messages.Auth.ChangePasswordCompleted
                    };
                }

            }
        }
        catch (AppException)
        {
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex , ex.Message);
            throw CustomSystemException.SystemExceptionCaller();
        }
    }

    public async Task<BaseResponse<ResGetUserInfo>> GetUserProfile()
    {
        return null!;
    }

    public async Task<BaseResponse<string>> UpdateUserProfile(ReqUpdateUserProfileDto request)
    {
        try
        {
            var userId = _userContextService.GetUserId();
            var profile = await _dbContext.UserProfileEntity.FirstOrDefaultAsync(x => x.UserId == userId);

            if (profile == null)
            {
                throw new AppException(Messages.Auth.UserInfoNotFound, 404, "Error01");
            }

            if (request.DateOfBirth.HasValue)
            {
                var today = DateTime.Today;
                var age = today.Year - request.DateOfBirth.Value.Year;
                if (request.DateOfBirth.Value.Date > today.AddYears(-age)) age--;

                if (age < 16 || age > 80)
                {
                    throw new BadRequestException("Tuổi phải từ 16 đến 80.", "V01");
                }
                profile.DateOfBirth = request.DateOfBirth.Value;
            }

            if (!string.IsNullOrEmpty(request.UserName))
            {
                profile.UserName = request.UserName;
            }

            if (!string.IsNullOrEmpty(request.PhoneNumber))
            {
                profile.PhoneNumber = request.PhoneNumber;
            }

            if (!string.IsNullOrEmpty(request.IdentityCode))
            {
                profile.IdentityCode = request.IdentityCode;
            }

            await _dbContext.SaveChangesAsync();

            return new BaseResponse<string>
            {
                IsSuccess = true,
                Message = "Cập nhật thông tin cá nhân thành công."
            };
        }
        catch (AppException) { throw; }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating user profile");
            throw CustomSystemException.SystemExceptionCaller();
        }
    }
}

