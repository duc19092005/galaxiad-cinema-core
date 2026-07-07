using Moq;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Cinema.Api.Controllers.Customer.Engagement;
using Cinema.Application.Dtos;
using Cinema.Application.UseCases.Customer.Engagement.Comments;

namespace Cinema.Tests.UnitTests.Engagement;

public class NotificationsControllerTests
{
    private readonly Mock<GetMyNotificationsUseCase> _getNotificationsUseCase;
    private readonly Mock<MarkNotificationAsReadUseCase> _markReadUseCase;
    private readonly NotificationsController _controller;

    public NotificationsControllerTests()
    {
        _getNotificationsUseCase = new Mock<GetMyNotificationsUseCase>();
        _markReadUseCase = new Mock<MarkNotificationAsReadUseCase>();
        _controller = new NotificationsController(
            _getNotificationsUseCase.Object,
            _markReadUseCase.Object);
    }

    [Fact]
    public async Task GetNotifications_ReturnsList()
    {
        var response = new BaseResponse<object>
        {
            IsSuccess = true,
            Data = new[]
            {
                new { NotificationId = "n1", Title = "Shift Approved", IsRead = false },
                new { NotificationId = "n2", Title = "New Movie", IsRead = true }
            }
        };

        _getNotificationsUseCase.Setup(x => x.ExecuteAsync(It.IsAny<Guid>()))
            .ReturnsAsync(response);

        var result = await _controller.GetNotifications();

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task MarkAsRead_ValidId_ReturnsOk()
    {
        var notificationId = Guid.NewGuid();
        var response = new BaseResponse<object>
        {
            IsSuccess = true,
            Message = "Marked as read"
        };

        _markReadUseCase.Setup(x => x.ExecuteAsync(notificationId, It.IsAny<Guid>()))
            .ReturnsAsync(response);

        var result = await _controller.MarkAsRead(notificationId);

        result.Should().BeOfType<OkObjectResult>();
    }
}
