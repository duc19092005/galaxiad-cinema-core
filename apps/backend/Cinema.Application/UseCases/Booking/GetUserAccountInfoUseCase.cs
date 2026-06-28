using Cinema.Application.Abstractions.Security;
using Cinema.Application.Dtos;
using Cinema.Application.Dtos.Booking;
using Cinema.Application.Interfaces.Booking;
using Cinema.Application.Interfaces.IThirdPersonServices;
using Cinema.Application.Interfaces;
using Microsoft.Extensions.Configuration;
using Cinema.Application.Exceptions;
using Cinema.Domain.Localization;
using System;
using System.Threading.Tasks;

namespace Cinema.Application.UseCases.Booking;

public class GetUserAccountInfoUseCase
{
    private readonly IUserBookingRepository _repo;
    private readonly IUserContextService _userContextService;
    private readonly IConfiguration _configuration;
    private readonly IEncryptionService _encryptionService;
    private readonly IMovieCacheService _cacheService;

    public GetUserAccountInfoUseCase(
        IUserBookingRepository repo,
        IUserContextService userContextService,
        IConfiguration configuration,
        IEncryptionService encryptionService,
        IMovieCacheService cacheService)
    {
        _repo = repo;
        _userContextService = userContextService;
        _configuration = configuration;
        _encryptionService = encryptionService;
        _cacheService = cacheService;
    }

    public async Task<BaseResponse<ResUserAccountInfoDto>> ExecuteAsync()
    {
        var userId = _userContextService.GetUserId();
        var cacheKey = $"user:profile:{userId}";

        var cached = await _cacheService.GetAsync<BaseResponse<ResUserAccountInfoDto>>(cacheKey);
        if (cached != null)
        {
            return cached;
        }

        var user = await _repo.GetUserAccountInfoAsync(userId);

        if (user == null)
        {
            throw new UnauthorizeException(null);
        }

        var key = _configuration["AES_256:Key"] ?? "";
        var iv = _configuration["AES_256:IV"] ?? "";
        var decryptedIdentityCode = _encryptionService.Decrypt(user.IdentityCode, key, iv);

        var res = new ResUserAccountInfoDto
        {
            UserId = user.UserId,
            Email = user.UserEmail,
            UserName = user.UserName,
            IdentityCode = decryptedIdentityCode,
            DateOfBirth = user.DateOfBirth,
            PhoneNumber = user.PhoneNumber,
            RewardPoints = user.RewardPoints
        };

        var response = new BaseResponse<ResUserAccountInfoDto>
        {
            IsSuccess = true,
            Data = res,
            Message = Messages.Auth.GetInfoSuccess
        };

        await _cacheService.SetAsync(cacheKey, response, TimeSpan.FromMinutes(30));
        return response;
    }
}
