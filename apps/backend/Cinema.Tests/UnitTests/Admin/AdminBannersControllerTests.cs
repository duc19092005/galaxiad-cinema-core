using Moq;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Cinema.Api.Controllers.Admin;
using Cinema.Application.Dtos;
using Cinema.Application.Dtos.Banners;
using Cinema.Application.UseCases.Banners;

namespace Cinema.Tests.UnitTests.Admin;

public class AdminBannersControllerTests
{
    private readonly Mock<CreateBannerUseCase> _createUseCase;
    private readonly Mock<GetAllBannersUseCase> _getAllUseCase;
    private readonly Mock<UpdateBannerUseCase> _updateUseCase;
    private readonly Mock<DeleteBannerUseCase> _deleteUseCase;
    private readonly AdminBannersController _controller;

    public AdminBannersControllerTests()
    {
        _createUseCase = new Mock<CreateBannerUseCase>();
        _getAllUseCase = new Mock<GetAllBannersUseCase>();
        _updateUseCase = new Mock<UpdateBannerUseCase>();
        _deleteUseCase = new Mock<DeleteBannerUseCase>();
        _controller = new AdminBannersController(
            _createUseCase.Object,
            _getAllUseCase.Object,
            _updateUseCase.Object,
            _deleteUseCase.Object);
    }

    [Fact]
    public async Task CreateBanner_ValidData_ReturnsOk()
    {
        var request = new ReqCreateBannerDto
        {
            Title = "Summer Blockbuster",
            ImageUrl = "https://cloudinary.com/banner.jpg",
            MovieId = Guid.NewGuid()
        };

        var response = new BaseResponse<object>
        {
            IsSuccess = true,
            Data = new { BannerId = Guid.NewGuid() }
        };

        _createUseCase.Setup(x => x.ExecuteAsync(It.IsAny<ReqCreateBannerDto>()))
            .ReturnsAsync(response);

        var result = await _controller.CreateBanner(request);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task GetAllBanners_ReturnsList()
    {
        var response = new BaseResponse<object>
        {
            IsSuccess = true,
            Data = new[]
            {
                new { BannerId = "b1", Title = "Banner 1", IsActive = true },
                new { BannerId = "b2", Title = "Banner 2", IsActive = false }
            }
        };

        _getAllUseCase.Setup(x => x.ExecuteAsync())
            .ReturnsAsync(response);

        var result = await _controller.GetAllBanners();

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task UpdateBanner_ValidData_ReturnsOk()
    {
        var bannerId = Guid.NewGuid();
        var request = new ReqUpdateBannerDto { Title = "Updated Banner" };
        var response = new BaseResponse<object>
        {
            IsSuccess = true,
            Message = "Banner updated"
        };

        _updateUseCase.Setup(x => x.ExecuteAsync(bannerId, It.IsAny<ReqUpdateBannerDto>()))
            .ReturnsAsync(response);

        var result = await _controller.UpdateBanner(bannerId, request);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task DeleteBanner_ValidId_ReturnsOk()
    {
        var bannerId = Guid.NewGuid();
        var response = new BaseResponse<object>
        {
            IsSuccess = true,
            Message = "Banner deleted"
        };

        _deleteUseCase.Setup(x => x.ExecuteAsync(bannerId))
            .ReturnsAsync(response);

        var result = await _controller.DeleteBanner(bannerId);

        result.Should().BeOfType<OkObjectResult>();
    }
}
