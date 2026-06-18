using Application.Common;
using Application.Identity.Ports;
using Microsoft.Extensions.Logging;
using Shared.Enums;
using Shared.Exceptions;
using Shared.Localization;

namespace Application.Identity.UseCases;

public record RegisterCommand(
    string UserEmail,
    string UserPassword,
    string UserName,
    string IdentityCode,
    string PhoneNumber,
    DateTime DateOfBirth);

/// <summary>
/// Use case đăng ký tài khoản khách hàng thường. Validate email/CCCD/tuổi, băm mật khẩu,
/// mã hoá CCCD, tạo user + profile + role trong một transaction.
/// </summary>
public class RegisterRegularUseCase
{
    /// <summary>Id role Customer (seed cố định).</summary>
    private static readonly Guid CustomerRoleId = Guid.Parse("2b9c8d0e-f5a6-7b8c-d9e0-1f2a3b4c5d6e");

    private const int MinCustomerAge = 16;

    private readonly IUserAccountRepository _userRepository;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IIdentityProtector _identityProtector;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IClock _clock;
    private readonly ILogger<RegisterRegularUseCase> _logger;

    public RegisterRegularUseCase(
        IUserAccountRepository userRepository,
        IPasswordHasher passwordHasher,
        IIdentityProtector identityProtector,
        IUnitOfWork unitOfWork,
        IClock clock,
        ILogger<RegisterRegularUseCase> logger)
    {
        _userRepository = userRepository;
        _passwordHasher = passwordHasher;
        _identityProtector = identityProtector;
        _unitOfWork = unitOfWork;
        _clock = clock;
        _logger = logger;
    }

    public async Task ExecuteAsync(RegisterCommand command, CancellationToken cancellationToken = default)
    {
        await using var transaction = await _unitOfWork.BeginTransactionAsync(cancellationToken: cancellationToken);
        try
        {
            var validationErrors = new List<string>();

            if (await _userRepository.EmailExistsAsync(command.UserEmail, cancellationToken))
            {
                validationErrors.Add(Messages.Auth.EmailAlreadyExists);
            }

            if (_clock.VietnamNow.Year - command.DateOfBirth.Year < MinCustomerAge)
            {
                validationErrors.Add("User Must Be At least 16 Years Old");
            }

            var encryptedIdentityCode = _identityProtector.Encrypt(command.IdentityCode);
            if (await _userRepository.IdentityCodeExistsAsync(encryptedIdentityCode, cancellationToken))
            {
                validationErrors.Add(Messages.Auth.IdentityCodeAlreadyExists);
            }

            if (validationErrors.Count > 0)
            {
                throw new BadRequestException(validationErrors, "VALIDATION_ERROR");
            }

            var registration = new NewUserRegistration(
                Guid.NewGuid(),
                command.UserEmail,
                _passwordHasher.Hash(command.UserPassword),
                command.UserName,
                encryptedIdentityCode,
                command.PhoneNumber,
                command.DateOfBirth,
                CustomerRoleId);

            await _userRepository.AddUserAsync(registration, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync(cancellationToken);
            if (ex is AppException) throw;
            _logger.LogError(ex, "Error registering user");
            throw new AppException(Messages.System.DatabaseError, 500, "S01");
        }
    }
}
