using Moq;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Cinema.Api.Controllers.Admin;
using Cinema.Application.Dtos;
using Cinema.Application.Dtos.PricingPromotions;
using Cinema.Application.UseCases.Admin.PricingPromotions;

namespace Cinema.Tests.UnitTests.Admin;

public class AdminPricingPromotionsControllerTests
{
    private readonly Mock<CreatePricingPromotionUseCase> _createUseCase;
    private readonly Mock<GetAllPricingPromotionsUseCase> _getAllUseCase;
    private readonly Mock<UpdatePricingPromotionUseCase> _updateUseCase;
    private readonly Mock<DeletePricingPromotionUseCase> _deleteUseCase;
    private readonly AdminPricingPromotionsController _controller;

    public AdminPricingPromotionsControllerTests()
    {
        _createUseCase = new Mock<CreatePricingPromotionUseCase>();
        _getAllUseCase = new Mock<GetAllPricingPromotionsUseCase>();
        _updateUseCase = new Mock<UpdatePricingPromotionUseCase>();
        _deleteUseCase = new Mock<DeletePricingPromotionUseCase>();
        _controller = new AdminPricingPromotionsController(
            _createUseCase.Object,
            _getAllUseCase.Object,
            _updateUseCase.Object,
            _deleteUseCase.Object);
    }

    [Fact]
    public async Task CreatePromotion_ValidData_ReturnsOk()
    {
        var request = new ReqCreatePricingPromotionDto
        {
            PromotionName = "Summer Sale",
            DiscountPercent = 20,
            StartDate = DateTime.UtcNow,
            EndDate = DateTime.UtcNow.AddMonths(1)
        };

        var response = new BaseResponse<object>
        {
            IsSuccess = true,
            Data = new { PromotionId = Guid.NewGuid() }
        };

        _createUseCase.Setup(x => x.ExecuteAsync(It.IsAny<ReqCreatePricingPromotionDto>()))
            .ReturnsAsync(response);

        var result = await _controller.CreatePromotion(request);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task GetAllPromotions_ReturnsList()
    {
        var response = new BaseResponse<object>
        {
            IsSuccess = true,
            Data = new[]
            {
                new { PromotionId = "p1", Name = "Summer Sale", Discount = 20 },
                new { PromotionId = "p2", Name = "Holiday Special", Discount = 30 }
            }
        };

        _getAllUseCase.Setup(x => x.ExecuteAsync(It.IsAny<int>(), It.IsAny<int>()))
            .ReturnsAsync(response);

        var result = await _controller.GetAllPromotions(0, 10);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task UpdatePromotion_ValidData_ReturnsOk()
    {
        var promotionId = Guid.NewGuid();
        var request = new ReqUpdatePricingPromotionDto { DiscountPercent = 25 };
        var response = new BaseResponse<object>
        {
            IsSuccess = true,
            Message = "Promotion updated"
        };

        _updateUseCase.Setup(x => x.ExecuteAsync(promotionId, It.IsAny<ReqUpdatePricingPromotionDto>()))
            .ReturnsAsync(response);

        var result = await _controller.UpdatePromotion(promotionId, request);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task DeletePromotion_ValidId_ReturnsOk()
    {
        var promotionId = Guid.NewGuid();
        var response = new BaseResponse<object>
        {
            IsSuccess = true,
            Message = "Promotion deleted"
        };

        _deleteUseCase.Setup(x => x.ExecuteAsync(promotionId))
            .ReturnsAsync(response);

        var result = await _controller.DeletePromotion(promotionId);

        result.Should().BeOfType<OkObjectResult>();
    }
}
