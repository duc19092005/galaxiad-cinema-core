using Cinema.Application.Abstractions.Security;
using Cinema.Application.Dtos.IdentityAccess.Requests;
using Cinema.Application.Dtos.IdentityAccess.Responses;
using Cinema.Application.Exceptions;
using Cinema.Application.Interfaces;
using Cinema.Application.Interfaces.IIdentityAccess;
using Cinema.Application.UseCases.IdentityAccess;
using Cinema.Domain.Entities.UserInfos;
using Cinema.Domain.Enums;
using Cinema.Domain.Interfaces.Persistence;
using Cinema.Domain.Localization;
using FluentAssertions;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace Cinema.Tests.Unit.Identity;

public class IdentityUseCasesTests
{
    private readonly Mock<IIdentityAccessRepository> _repoMock = new();
    private readonly Mock<IUnitOfWork> _uowMock = new();
    private readonly Mock<IConfiguration> _configMock = new();
    private readonly Mock<IPasswordHasher> _hasherMock = new();
    private readonly Mock<IEncryptionService> _encryptionMock = new();
    private readonly Mock<IJwtService> _jwtMock = new();
    private readonly Mock<ILogger<IdentityAccessRegularRegisterUseCase>> _registerLoggerMock = new();
    private readonly Mock<ILogger<identityAccessRegularLoginUseCase>> _loginLoggerMock = new();

    public IdentityUseCasesTests()
    {
        _configMock.Setup(c => c["AES_256:Key"]).Returns("12345678901234567890123456789012");
        _configMock.Setup(c => c["AES_256:IV"]).Returns("1234567890123456");
        _configMock.Setup(c => c["JWT_Info:Key"]).Returns("TestJwtKey123456789012345678901234567890!");
        _configMock.Setup(c => c["JWT_Info:Iss"]).Returns("TestIss");
        _configMock.Setup(c => c["JWT_Info:Aud"]).Returns("TestAud");

        var transactionMock = new Mock<IUnitOfWorkTransaction>();
        _uowMock.Setup(u => u.BeginTransactionAsync(default)).ReturnsAsync(transactionMock.Object);
        _uowMock.Setup(u => u.SaveChangesAsync(default)).ReturnsAsync(1);
    }

    [Fact]
    public async Task RegisterRegularUseCase_ValidData_CreatesCustomerSuccessfully()
    {
        // Arrange
        _repoMock.Setup(r => r.EmailExistsAsync(It.IsAny<string>())).ReturnsAsync(false);
        _repoMock.Setup(r => r.IdentityCodeExistsAsync(It.IsAny<string>())).ReturnsAsync(false);
        _hasherMock.Setup(h => h.Hash("Password123!")).Returns("hashed_pwd_123");
        _encryptionMock.Setup(e => e.Encrypt(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>())).Returns("encrypted_id");

        var useCase = new IdentityAccessRegularRegisterUseCase(
            _repoMock.Object,
            _configMock.Object,
            _registerLoggerMock.Object,
            _hasherMock.Object,
            _uowMock.Object,
            _encryptionMock.Object);

        var dto = new ReqRegularRegisterDto
        {
            UserName = "Nguyen Van A",
            UserEmail = "nguyenvana@example.com",
            UserPassword = "Password123!",
            DateOfBirth = new DateTime(2000, 1, 1),
            IdentityCode = "001200012345",
            PhoneNumber = "0987654321"
        };

        // Act
        var result = await useCase.Add(dto);

        // Assert
        result.IsSuccess.Should().BeTrue();
        _repoMock.Verify(r => r.AddUserAsync(It.Is<UserInfoEntity>(u =>
            u.UserEmail == "nguyenvana@example.com" &&
            u.Password == "hashed_pwd_123" &&
            u.AccountStatus == AccountStatusEnum.Active &&
            u.UserType == UserTypeEnum.Customer
        )), Times.Once);

        _repoMock.Verify(r => r.AddUserRoleAsync(It.IsAny<UserRoleInfoEntity>()), Times.Once);
        _repoMock.Verify(r => r.AddCustomerProfileAsync(It.IsAny<CustomerProfileEntity>()), Times.Once);
        _uowMock.Verify(u => u.SaveChangesAsync(default), Times.Once);
    }

    [Fact]
    public async Task RegisterRegularUseCase_DuplicateEmail_ThrowsAppException()
    {
        // Arrange
        _repoMock.Setup(r => r.EmailExistsAsync("duplicate@example.com")).ReturnsAsync(true);

        var useCase = new IdentityAccessRegularRegisterUseCase(
            _repoMock.Object,
            _configMock.Object,
            _registerLoggerMock.Object,
            _hasherMock.Object,
            _uowMock.Object,
            _encryptionMock.Object);

        var dto = new ReqRegularRegisterDto
        {
            UserName = "Test User",
            UserEmail = "duplicate@example.com",
            UserPassword = "Password123!",
            DateOfBirth = new DateTime(2000, 1, 1),
            IdentityCode = "001200012345",
            PhoneNumber = "0987654321"
        };

        // Act & Assert
        var act = () => useCase.Add(dto);
        await act.Should().ThrowAsync<BadRequestException>()
            .Where(ex => ex.Errors.Contains(Messages.Auth.EmailAlreadyExists));

        _repoMock.Verify(r => r.AddUserAsync(It.IsAny<UserInfoEntity>()), Times.Never);
    }

    [Fact]
    public async Task LoginRegularUseCase_CorrectCredentials_ReturnsJwtToken()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var user = new UserInfoEntity
        {
            UserId = userId,
            UserEmail = "customer@cinema.com",
            UserName = "Customer",
            Password = "hashed_correct_password",
            AccountStatus = AccountStatusEnum.Active,
            UserRoleInfoEntity = new List<UserRoleInfoEntity>
            {
                new()
                {
                    UserId = userId,
                    RoleId = Guid.NewGuid(),
                    RoleListInfoEntity = new RoleListInfoEntity
                    {
                        RoleId = Guid.NewGuid(),
                        RoleName = "Customer"
                    }
                }
            }
        };

        _repoMock.Setup(r => r.FindUserByEmailAsync("customer@cinema.com")).ReturnsAsync(user);
        _hasherMock.Setup(h => h.Validate("hashed_correct_password", "Password123!")).Returns(true);
        _repoMock.Setup(r => r.FindUserByIdWithRolesAsync(userId)).ReturnsAsync(user);
        _repoMock.Setup(r => r.GetUserRoleIdsAsync(userId)).ReturnsAsync(new List<Guid>());
        _repoMock.Setup(r => r.GetUserPermissionsAsync(It.IsAny<List<Guid>>())).ReturnsAsync(new List<string>());
        _repoMock.Setup(r => r.GetActiveCinemasAsync()).ReturnsAsync(new List<ManagedCinemaInfoDto>());
        _repoMock.Setup(r => r.GetManagedCinemasAsync(userId)).ReturnsAsync(new List<ManagedCinemaInfoDto>());

        _jwtMock.Setup(j => j.GenerateToken(
            It.IsAny<string>(),
            It.IsAny<string>(),
            It.IsAny<string>(),
            It.IsAny<string>(),
            It.IsAny<string>(),
            It.IsAny<Guid>(),
            It.IsAny<string[]>(),
            It.IsAny<string[]>())).Returns("valid.jwt.token");

        var useCase = new identityAccessRegularLoginUseCase(
            _repoMock.Object,
            _configMock.Object,
            _loginLoggerMock.Object,
            _hasherMock.Object,
            _jwtMock.Object);

        // Act
        var result = await useCase.Login(new ReqRegularLoginDto
        {
            Email = "customer@cinema.com",
            Password = "Password123!"
        });

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Data.Should().NotBeNull();
        result.Data!.AccessToken.Should().Be("valid.jwt.token");
    }

    [Fact]
    public async Task LoginRegularUseCase_InvalidOrLocked_RejectsLogin()
    {
        // Arrange
        var lockedUser = new UserInfoEntity
        {
            UserId = Guid.NewGuid(),
            UserEmail = "locked@cinema.com",
            Password = "hashed_password",
            AccountStatus = AccountStatusEnum.Banned
        };

        _repoMock.Setup(r => r.FindUserByEmailAsync("locked@cinema.com")).ReturnsAsync(lockedUser);

        var useCase = new identityAccessRegularLoginUseCase(
            _repoMock.Object,
            _configMock.Object,
            _loginLoggerMock.Object,
            _hasherMock.Object,
            _jwtMock.Object);

        // Act & Assert
        var act = () => useCase.Login(new ReqRegularLoginDto
        {
            Email = "locked@cinema.com",
            Password = "Password123!"
        });

        await act.Should().ThrowAsync<AppException>()
            .Where(ex => ex.StatusCode == 404 || ex.StatusCode == 401);
    }
}
