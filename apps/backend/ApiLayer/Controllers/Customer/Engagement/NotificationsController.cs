using System.Security.Claims;
using BusinessLayer.Interfaces.IThirdPersonServices;
using BusinessLayer.Services.Comments;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ApiLayer.Controllers.Customer.Engagement;

[ApiController]
[Authorize]
[Route("api/v1/notifications")]
[Tags("Customer - Notifications")]
[ApiExplorerSettings(GroupName = "v1-user")]
public class NotificationsController : ControllerBase
{
    private readonly MovieCommentService _movieCommentService;
    private readonly ISseNotificationService _sseNotificationService;

    public NotificationsController(
        MovieCommentService movieCommentService,
        ISseNotificationService sseNotificationService)
    {
        _movieCommentService = movieCommentService;
        _sseNotificationService = sseNotificationService;
    }

    [HttpGet]
    public async Task<IActionResult> GetMyNotifications()
    {
        var result = await _movieCommentService.GetMyNotifications();
        return Ok(result);
    }

    [HttpPatch("{notificationId}/read")]
    public async Task<IActionResult> MarkAsRead(Guid notificationId)
    {
        var result = await _movieCommentService.MarkNotificationAsRead(notificationId);
        return Ok(result);
    }

    [HttpGet("sse")]
    public async Task GetNotificationsSse()
    {
        var userId = GetCurrentUserId();

        Response.Headers.Append("Content-Type", "text/event-stream");
        Response.Headers.Append("Cache-Control", "no-cache");
        Response.Headers.Append("Connection", "keep-alive");

        var tcs = new TaskCompletionSource();

        Func<string, Task> onMessage = async msg =>
        {
            try
            {
                await Response.WriteAsync($"data: {msg}\n\n");
                await Response.Body.FlushAsync();
            }
            catch
            {
                tcs.TrySetResult();
            }
        };

        _sseNotificationService.Subscribe(userId, onMessage, () => tcs.TrySetResult());
        await onMessage(System.Text.Json.JsonSerializer.Serialize(new { status = "connected", timestamp = DateTime.UtcNow }));

        HttpContext.RequestAborted.Register(() =>
        {
            _sseNotificationService.Unsubscribe(userId, onMessage);
            tcs.TrySetResult();
        });

        await tcs.Task;
        _sseNotificationService.Unsubscribe(userId, onMessage);
    }

    private Guid GetCurrentUserId()
    {
        var sid = User.FindFirstValue(ClaimTypes.Sid);
        if (string.IsNullOrEmpty(sid) || !Guid.TryParse(sid, out var userId))
        {
            throw new UnauthorizedAccessException("Khong xac dinh duoc danh tinh nguoi dung.");
        }

        return userId;
    }
}

