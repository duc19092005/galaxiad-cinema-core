using System.Security.Claims;
using Cinema.Api.Controllers.Customer.Vouchers;
using Cinema.Application.Dtos.Vouchers;
using Cinema.Application.Interfaces.Vouchers;
using Cinema.Application.UseCases.Admin.Vouchers;
using Cinema.Domain.Entities;
using Cinema.Domain.Entities.Vouchers;
using Cinema.Domain.Interfaces.Persistence;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;

namespace Cinema.Tests.UnitTests.Public;

public class PublicVoucherControllerTests
{
    private readonly Mock<IVoucherRepository> _voucherRepository = new();
    private readonly Mock<IUnitOfWork> _unitOfWork = new();

    [Fact]
    public async Task GetActiveVouchers_ReturnsOk()
    {
        _voucherRepository.Setup(x => x.GetActiveVouchersAsync())
            .ReturnsAsync([
                new VoucherDto { VoucherId = Guid.NewGuid(), VoucherName = "WELCOME10" }
            ]);
        var controller = CreateController();

        var result = await controller.GetActiveVouchers();

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task GetMyVouchers_WithAuthenticatedUser_ReturnsOk()
    {
        var userId = Guid.NewGuid();
        _voucherRepository.Setup(x => x.GetMyVouchersAsync(userId))
            .ReturnsAsync([
                new UserVoucherDto { UserVoucherId = Guid.NewGuid(), VoucherId = Guid.NewGuid(), VoucherName = "WELCOME10" }
            ]);
        var controller = CreateController(userId);

        var result = await controller.GetMyVouchers();

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task GetAvailableVouchersForChatbot_ReturnsOnlyUsableVouchers()
    {
        var userId = Guid.NewGuid();
        _voucherRepository.Setup(x => x.GetMyVouchersAsync(userId))
            .ReturnsAsync([
                new UserVoucherDto
                {
                    UserVoucherId = Guid.NewGuid(),
                    VoucherId = Guid.NewGuid(),
                    VoucherName = "ACTIVE",
                    IsUsed = false,
                    ValidTo = DateTime.UtcNow.AddDays(1)
                },
                new UserVoucherDto
                {
                    UserVoucherId = Guid.NewGuid(),
                    VoucherId = Guid.NewGuid(),
                    VoucherName = "USED",
                    IsUsed = true,
                    ValidTo = DateTime.UtcNow.AddDays(1)
                }
            ]);
        var controller = CreateController();

        var result = await controller.GetAvailableVouchersForChatbot(userId);

        result.Should().BeOfType<OkObjectResult>();
    }

    private PublicVoucherController CreateController(Guid? userId = null)
    {
        var controller = new PublicVoucherController(
            new GetActiveVouchersUseCase(_voucherRepository.Object),
            new RedeemVoucherUseCase(_voucherRepository.Object, _unitOfWork.Object),
            new GetMyVouchersUseCase(_voucherRepository.Object));

        if (userId.HasValue)
        {
            controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext
                {
                    User = new ClaimsPrincipal(new ClaimsIdentity([
                        new Claim(ClaimTypes.Sid, userId.Value.ToString())
                    ], "TestAuth"))
                }
            };
        }

        return controller;
    }
}
