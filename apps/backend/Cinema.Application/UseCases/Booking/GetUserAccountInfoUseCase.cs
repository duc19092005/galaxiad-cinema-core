using Cinema.Application.Abstractions.Security;
using Cinema.Application.Dtos;
using Cinema.Application.Dtos.Booking;
using Cinema.Application.Interfaces.Booking;
using Cinema.Application.Interfaces;
using Microsoft.Extensions.Configuration;
using Cinema.Application.Exceptions;
using Cinema.Domain.Localization;

namespace Cinema.Application.UseCases.Booking;

public class GetUserAccountInfoUseCase
{
    private readonly IUserBookingRepository _repo;
    private readonly IUserContextService _userContextService;
    private readonly IConfiguration _configuration;
    private readonly IEncryptionService _encryptionService;

    public GetUserAccountInfoUseCase(
        IUserBookingRepository repo,
        IUserContextService userContextService,
        IConfiguration configuration,
        IEncryptionService encryptionService)
    {
        _repo = repo;
        _userContextService = userContextService;
        _configuration = configuration;
        _encryptionService = encryptionService;
    }

    public async Task<BaseResponse<ResUserAccountInfoDto>> ExecuteAsync()
    {
        var userId = _userContextService.GetUserId();
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

        return new BaseResponse<ResUserAccountInfoDto>
        {
            IsSuccess = true,
            Data = res,
            Message = Messages.Auth.GetInfoSuccess
        };
    }
}
