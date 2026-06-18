using Application.Common;
using Application.Identity.Ports;
using Microsoft.Extensions.Logging;
using Shared.Exceptions;
using Shared.Localization;

namespace Application.Identity.UseCases;

public record ProfileAccessResult(Guid UserId, string? Username, string[] Roles, List<ManagedCinema>? ManagedCinemas);

public record ChangePasswordCommand(string OldPassword, string NewPassword);

public record UpdateProfileCommand(string? UserName, string? PhoneNumber, string? IdentityCode, DateTime? DateOfBirth);

/// <summary>
/// Các use case thao tác profile người dùng: lấy thông tin truy cập, đổi mật khẩu, cập nhật profile.
/// </summary>
public class UserProfileUseCase
{
    private readonly IUserProfileRepository _profileRepository;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IClock _clock;
    private readonly ILogger<UserProfileUseCase> _logger;

    public UserProfileUseCase(
        IUserProfileRepository profileRepository,
        IPasswordHasher passwordHasher,
        IUnitOfWork unitOfWork,
        IClock clock,
        ILogger<UserProfileUseCase> logger)
    {
        _profileRepository = profileRepository;
        _passwordHasher = passwordHasher;
        _unitOfWork = unitOfWork;
        _clock = clock;
        _logger = logger;
    }

    public async Task<ProfileAccessResult> GetAccessAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var access = await _profileRepository.GetProfileAccessAsync(userId, cancellationToken);
        if (access == null)
        {
            throw new AppException(Messages.Auth.UserNotFound, 404, "UN01");
        }

        if (access.Roles.Length == 0)
        {
            throw new AppException(Messages.Auth.RoleNotFound, 403, "UN02");
        }

        List<ManagedCinema>? managedCinemas = null;
        if (access.Roles.Contains("TheaterManager") || access.Roles.Contains("FacilitiesManager"))
        {
            var cinemas = await _profileRepository.GetManagedCinemasAsync(userId, cancellationToken);
            if (cinemas.Count > 0)
            {
                managedCinemas = cinemas;
            }
        }

        return new ProfileAccessResult(access.UserId, access.Username, access.Roles, managedCinemas);
    }

    public async Task ChangePasswordAsync(
        Guid userId, ChangePasswordCommand command, CancellationToken cancellationToken = default)
    {
        var currentHash = await _profileRepository.GetPasswordHashAsync(userId, cancellationToken);
        if (currentHash == null)
        {
            throw new AppException(Messages.Auth.UserInfoNotFound, 404, "Error01");
        }

        if (!_passwordHasher.Verify(currentHash, command.OldPassword))
        {
            throw new AppException(Messages.Auth.OldPasswordNotMatch, 400, "Error02");
        }

        // Mật khẩu mới trùng mật khẩu cũ → từ chối (sửa lại logic đảo ngược ở bản cũ).
        if (_passwordHasher.Verify(currentHash, command.NewPassword))
        {
            throw new AppException(Messages.Auth.NewPasswordSameAsOld, 400, "Error02");
        }

        var newHash = _passwordHasher.Hash(command.NewPassword);
        await _profileRepository.UpdatePasswordAsync(userId, newHash, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }

    public async Task UpdateProfileAsync(
        Guid userId, UpdateProfileCommand command, CancellationToken cancellationToken = default)
    {
        if (command.DateOfBirth.HasValue)
        {
            var today = _clock.VietnamNow.Date;
            var age = today.Year - command.DateOfBirth.Value.Year;
            if (command.DateOfBirth.Value.Date > today.AddYears(-age)) age--;

            if (age < 16 || age > 80)
            {
                throw new BadRequestException("Tuổi phải từ 16 đến 80.", "V01");
            }
        }

        var update = new ProfileUpdate(
            command.UserName, command.PhoneNumber, command.IdentityCode, command.DateOfBirth);

        var found = await _profileRepository.UpdateProfileAsync(userId, update, cancellationToken);
        if (!found)
        {
            throw new AppException(Messages.Auth.UserInfoNotFound, 404, "Error01");
        }

        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }
}
