using Moq;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Cinema.Api.Controllers.Customer.Vouchers;
using Cinema.Application.Dtos;
using Cinema.Application.Dtos.Vouchers;
using Cinema.Application.UseCases.Vouchers;
using Cinema.Application.Exceptions;

namespace Cinema.Tests.UnitTests.Public;

public class PublicVoucherControllerTests
{
    private readonly Mock<GetAvailableVouchersUseCase> _getAvailableVouchersUseCase;
    private readonly Mock<RedeemVoucherUseCase> _redeemVoucherUseCase;
    private readonly PublicVoucherController _controller;

    public PublicVoucherControllerTests()
    {
        _getAvailableVouchersUseCase = new Mock<GetAvailableVouchersUseCase>();
        _redeemVoucherUseCase = new Mock<RedeemVoucherUseCase>();
        _controller = new PublicVoucherController(
            _getAvailableVouchersUseCase.Object,
            _redeemVoucherUseCase.Object);
    }

    [Fact]
    public async Task GetAvailableVouchers_ValidUser_ReturnsVoucherList()
    {
        var response = new BaseResponse<List<ResVoucherDto>>
        {
            IsSuccess = true,
            Data = new List<ResVoucherDto>
            {
                new() { VoucherId = Guid.NewGuid(), DiscountPercent = 10, ExpiryDate = DateTime.UtcNow.AddDays(30) },
                new() { VoucherId = Guid.NewGuid(), DiscountPercent = 20, ExpiryDate = DateTime.UtcNow.AddDays(60) }
            }
        };

        _getAvailableVouchersUseCase.Setup(x => x.ExecuteAsync(It.IsAny<Guid>()))
            .ReturnsAsync(response);

        var result = await _controller.GetAvailableVouchers(Guid.NewGuid());

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RedeemVoucher_ValidVoucher_ReturnsOk()
    {
        var voucherId = Guid.NewGuid();
        var response = new BaseResponse<object>
        {
            IsSuccess = true,
            Message = "Voucher redeemed successfully"
        };

        _redeemVoucherUseCase.Setup(x => x.ExecuteAsync(It.IsAny<Guid>(), voucherId))
            .ReturnsAsync(response);

        var result = await _controller.RedeemVoucher(voucherId);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RedeemVoucher_AlreadyRedeemed_ThrowsAppException()
    {
        var voucherId = Guid.NewGuid();
        _redeemVoucherUseCase.Setup(x => x.ExecuteAsync(It.IsAny<Guid>(), voucherId))
            .ThrowsAsync(new AppException("Voucher already redeemed", 400));

        await Assert.ThrowsAsync<AppException>(() => _controller.RedeemVoucher(voucherId));
    }

    [Fact]
    public async Task RedeemVoucher_InsufficientPoints_ThrowsAppException()
    {
        var voucherId = Guid.NewGuid();
        _redeemVoucherUseCase.Setup(x => x.ExecuteAsync(It.IsAny<Guid>(), voucherId))
            .ThrowsAsync(new AppException("Insufficient reward points", 400));

        await Assert.ThrowsAsync<AppException>(() => _controller.RedeemVoucher(voucherId));
    }
}
