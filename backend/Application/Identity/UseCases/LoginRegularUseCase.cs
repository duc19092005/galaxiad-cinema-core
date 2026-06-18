using Application.Identity.Ports;
using Microsoft.Extensions.Logging;
using Shared.Exceptions;
using Shared.Localization;

namespace Application.Identity.UseCases;

public record LoginCommand(string Email, string Password);

public record LoginResult(Guid UserId, string AccessToken, string? Username, string[] Roles);

/// <summary>
/// Use case đăng nhập thường (email + mật khẩu). Xác thực, kiểm tra vai trò, phát JWT.
/// </summary>
public class LoginRegularUseCase
{
    private readonly IUserAccountRepository _userRepository;
    private readonly IPasswordHasher _passwordHasher;
    private readonly ITokenService _tokenService;
    private readonly ILogger<LoginRegularUseCase> _logger;

    public LoginRegularUseCase(
        IUserAccountRepository userRepository,
        IPasswordHasher passwordHasher,
        ITokenService tokenService,
        ILogger<LoginRegularUseCase> logger)
    {
        _userRepository = userRepository;
        _passwordHasher = passwordHasher;
        _tokenService = tokenService;
        _logger = logger;
    }

    public async Task<LoginResult> ExecuteAsync(LoginCommand command, CancellationToken cancellationToken = default)
    {
        var user = await _userRepository.GetActiveByEmailAsync(command.Email, cancellationToken);
        if (user == null)
        {
            throw new AppException(Messages.Auth.UserNotFound, 404, "UN01");
        }

        if (!_passwordHasher.Verify(user.PasswordHash, command.Password))
        {
            throw new AppException(Messages.Auth.WrongCredentials, 401, "UN01");
        }

        if (user.Roles.Length == 0)
        {
            _logger.LogError("User with Id {UserId} Role Not Found", user.UserId);
            throw new AppException(Messages.Auth.UserNotFound, 403, "UN01");
        }

        var token = _tokenService.GenerateToken(user.Email, user.Username, user.UserId, user.Roles);

        return new LoginResult(user.UserId, token, user.Username, user.Roles);
    }
}
