using Moq;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Cinema.Api.Controllers.Admin;
using Cinema.Application.Dtos;
using Cinema.Application.Dtos.Vouchers;
using Cinema.Application.UseCases.Vouchers;
using Cinema.Application.Exceptions;

namespace Cinema.Tests.UnitTests.Admin;

public class AdminVoucherControllerTests
{
    private readonly Mock<CreateVoucherUseCase> _createVoucherUseCase;
    private readonly Mock<GetAllVouchersUseCase> _getAllVouchersUseCase;
    private readonly Mock<UpdateVoucherUseCase> _updateVoucherUseCase;
    private readonly Mock<DeleteVoucherUseCase> _deleteVoucherUseCase;
    private readonly AdminVoucherController _controller;

    public AdminVoucherControllerTests()
    {
        _createVoucherUseCase = new Mock<CreateVoucherUseCase>();
        _getAllVouchersUseCase = new Mock<GetAllVouchersUseCase>();
        _updateVoucherUseCase = new Mock<UpdateVoucherUseCase>();
        _deleteVoucherUseCase = new Mock<DeleteVoucherUseCase>();
        _controller = new AdminVoucherController(
            _createVoucherUseCase.Object,
            _getAllVouchersUseCase.Object,
            _updateVoucherUseCase.Object,
            _deleteVoucherUseCase.Object);
    }

    [Fact]
    public async Task CreateVoucher_ValidData_ReturnsOk()
    {
        var request = new ReqCreateVoucherDto
        {
            VoucherCode = "SUMMER2026",
            DiscountPercent = 15,
            ExpiryDate = DateTime.UtcNow.AddMonths(3),
            PointsCost = 100
        };

        var response = new BaseResponse<object>
        {
            IsSuccess = true,
            Data = new { VoucherId = Guid.NewGuid() }
        };

        _createVoucherUseCase.Setup(x => x.ExecuteAsync(It.IsAny<ReqCreateVoucherDto>()))
            .ReturnsAsync(response);

        var result = await _controller.CreateVoucher(request);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task CreateVoucher_DuplicateCode_ThrowsAppException()
    {
        var request = new ReqCreateVoucherDto { VoucherCode = "EXISTING" };

        _createVoucherUseCase.Setup(x => x.ExecuteAsync(It.IsAny<ReqCreateVoucherDto>()))
            .ThrowsAsync(new AppException("Voucher code already exists", 409));

        await Assert.ThrowsAsync<AppException>(() => _controller.CreateVoucher(request));
    }

    [Fact]
    public async Task GetAllVouchers_ReturnsList()
    {
        var response = new BaseResponse<object>
        {
            IsSuccess = true,
            Data = new[]
            {
                new { VoucherId = "v1", Code = "SUMMER2026", DiscountPercent = 15 },
                new { VoucherId = "v2", Code = "WINTER2026", DiscountPercent = 20 }
            }
        };

        _getAllVouchersUseCase.Setup(x => x.ExecuteAsync(It.IsAny<int>(), It.IsAny<int>()))
            .ReturnsAsync(response);

        var result = await _controller.GetAllVouchers(0, 10);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task UpdateVoucher_ValidData_ReturnsOk()
    {
        var voucherId = Guid.NewGuid();
        var request = new ReqUpdateVoucherDto { DiscountPercent = 25 };
        var response = new BaseResponse<object>
        {
            IsSuccess = true,
            Message = "Voucher updated"
        };

        _updateVoucherUseCase.Setup(x => x.ExecuteAsync(voucherId, It.IsAny<ReqUpdateVoucherDto>()))
            .ReturnsAsync(response);

        var result = await _controller.UpdateVoucher(voucherId, request);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task DeleteVoucher_ValidId_ReturnsOk()
    {
        var voucherId = Guid.NewGuid();
        var response = new BaseResponse<object>
        {
            IsSuccess = true,
            Message = "Voucher deleted"
        };

        _deleteVoucherUseCase.Setup(x => x.ExecuteAsync(voucherId))
            .ReturnsAsync(response);

        var result = await _controller.DeleteVoucher(voucherId);

        result.Should().BeOfType<OkObjectResult>();
    }
}
