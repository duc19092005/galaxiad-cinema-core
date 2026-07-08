using Moq;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Cinema.Api.Controllers.Identity;
using Cinema.Application.Dtos;
using Cinema.Application.Dtos.IdentityAccess.Requests;
using Cinema.Application.Dtos.IdentityAccess.Responses;
using Cinema.Application.UseCases.IdentityAccess;
using Cinema.Application.Exceptions;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;

namespace Cinema.Tests.UnitTests.Identity;

public class IdentityAccessControllerTests
{
    private readonly Mock<IdentityAccessRegularRegisterUseCase> _registerUseCase;
    private readonly Mock<identityAccessRegularLoginUseCase> _loginUseCase;
    private readonly Mock<GoogleLoginInitUseCase> _googleLoginInitUseCase;
    private readonly Mock<GoogleLoginCallbackUseCase> _googleLoginCallbackUseCase;
    private readonly Mock<GetProfileUseCase> _getProfileUseCase;
    private readonly Mock<ChangePasswordUseCase> _changePasswordUseCase;
    private readonly Mock<UpdateUserProfileUseCase> _updateUserProfileUseCase;
    private readonly Mock<IConfiguration> _configuration;
    private readonly IdentityAccessController _controller;

    public IdentityAccessControllerTests()
    {
        _registerUseCase = new Mock<IdentityAccessRegularRegisterUseCase>();
        _loginUseCase = new Mock<identityAccessRegularLoginUseCase>();
        _googleLoginInitUseCase = new Mock<GoogleLoginInitUseCase>();
        _googleLoginCallbackUseCase = new Mock<GoogleLoginCallbackUseCase>();
        _getProfileUseCase = new Mock<GetProfileUseCase>();
        _changePasswordUseCase = new Mock<ChangePasswordUseCase>();
        _updateUserProfileUseCase = new Mock<UpdateUserProfileUseCase>();
        _configuration = new Mock<IConfiguration>();
        _configuration.Setup(c => c["FrontendBaseUrl"]).Returns("http://localhost:5173");
        _controller = new IdentityAccessController(
            _registerUseCase.Object,
            _loginUseCase.Object,
            _googleLoginInitUseCase.Object,
            _googleLoginCallbackUseCase.Object,
            _getProfileUseCase.Object,
            _changePasswordUseCase.Object,
            _updateUserProfileUseCase.Object,
            _configuration.Object);
    }

    [Fact]
    public async Task RegularRegister_ValidRequest_ReturnsOk()
    {
        var request = new ReqRegularRegisterDto
        {
            Email = "newuser@test.com",
            Password = "P@ssword123!",
            FullName = "Test User",
            PhoneNumber = "0901234567",
            IdentityCard = "123456789012",
            DateOfBirth = DateTime.Parse("1990-01-01")
        };

        var response = new BaseResponse<object>
        {
            IsSuccess = true,
            Message = "Registration successful"
        };

        _registerUseCase.Setup(x => x.Add(It.IsAny<ReqRegularRegisterDto>()))
            .ReturnsAsync(response);

        var result = await _controller.RegularRegister(request);

        result.Should().BeOfType<OkObjectResult>();
        var okResult = result as OkObjectResult;
        var data = okResult!.Value as BaseResponse<object>;
        data!.IsSuccess.Should().BeTrue();
    }

    [Fact]
    public async Task RegularRegister_DuplicateEmail_ReturnsError()
    {
        var request = new ReqRegularRegisterDto
        {
            Email = "existing@test.com",
            Password = "P@ssword123!",
            FullName = "Test User",
            PhoneNumber = "0901234567",
            IdentityCard = "123456789012",
            DateOfBirth = DateTime.Parse("1990-01-01")
        };

        _registerUseCase.Setup(x => x.Add(It.IsAny<ReqRegularRegisterDto>()))
            .ThrowsAsync(new AppException("Email already exists", 409));

        await Assert.ThrowsAsync<AppException>(() => _controller.RegularRegister(request));
    }

    [Fact]
    public async Task RegularLogin_ValidCredentials_ReturnsOkWithCookie()
    {
        var request = new ReqRegularLoginDto
        {
            Email = "test@test.com",
            Password = "P@ssword123!"
        };

        var response = new BaseResponse<ResRegularLoginDto>
        {
            IsSuccess = true,
            Data = new ResRegularLoginDto
            {
                UserId = Guid.NewGuid(),
                Username = "Test User",
                Roles = new List<string> { "Customer" },
                AccessToken = "jwt-token-here"
            }
        };

        _loginUseCase.Setup(x => x.Login(It.IsAny<ReqRegularLoginDto>()))
            .ReturnsAsync(response);

        // Setup HttpContext for cookie
        _controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext()
        };

        var result = await _controller.RegularLogin(request);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RegularLogin_InvalidCredentials_ThrowsAppException()
    {
        var request = new ReqRegularLoginDto
        {
            Email = "wrong@test.com",
            Password = "wrongpassword"
        };

        _loginUseCase.Setup(x => x.Login(It.IsAny<ReqRegularLoginDto>()))
            .ThrowsAsync(new AppException("Invalid credentials", 401));

        await Assert.ThrowsAsync<AppException>(() => _controller.RegularLogin(request));
    }

    [Fact]
    public void GoogleLoginInit_ReturnsRedirectUrl()
    {
        var response = new BaseResponse<object>
        {
            IsSuccess = true,
            Data = new { RedirectUrl = "https://accounts.google.com/..." }
        };

        _googleLoginInitUseCase.Setup(x => x.Execute("web"))
            .Returns(response);

        var result = _controller.GoogleLoginInit("web");

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task Logout_ReturnsOk()
    {
        _controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext()
        };

        var result = _controller.Logout();

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task GetProfile_WithAuth_ReturnsOk()
    {
        var response = new BaseResponse<object>
        {
            IsSuccess = true,
            Data = new { UserId = "user-1", Username = "Test User" }
        };

        _getProfileUseCase.Setup(x => x.ExecuteAsync())
            .ReturnsAsync(response);

        var result = await _controller.GetProfile();

        result.Should().BeOfType<OkObjectResult>();
        var okResult = result as OkObjectResult;
        var data = okResult!.Value as BaseResponse<object>;
        data!.IsSuccess.Should().BeTrue();
    }

    [Fact]
    public async Task ChangePassword_ValidRequest_ReturnsOk()
    {
        var request = new ReqChangePasswordDto
        {
            OldPassword = "OldP@ss123!",
            NewPassword = "NewP@ss123!"
        };

        var response = new BaseResponse<object>
        {
            IsSuccess = true,
            Message = "Password changed successfully"
        };

        _changePasswordUseCase.Setup(x => x.ExecuteAsync(It.IsAny<ReqChangePasswordDto>()))
            .ReturnsAsync(response);

        var result = await _controller.ChangePassword(request);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task UpdateProfile_ValidRequest_ReturnsOk()
    {
        var request = new ReqUpdateUserProfileDto
        {
            FullName = "Updated Name",
            PhoneNumber = "0909876543"
        };

        var response = new BaseResponse<object>
        {
            IsSuccess = true,
            Message = "Profile updated"
        };

        _updateUserProfileUseCase.Setup(x => x.ExecuteAsync(It.IsAny<ReqUpdateUserProfileDto>()))
            .ReturnsAsync(response);

        var result = await _controller.UpdateUserProfile(request);

        result.Should().BeOfType<OkObjectResult>();
    }
}
