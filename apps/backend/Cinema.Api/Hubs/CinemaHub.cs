using Cinema.Application.Infrastructure.Booking;
using Cinema.Application.UseCases.Booking.SocialBooking;

namespace Cinema.Api.Hubs;

/// <summary>
/// Unified SignalR Hub for all real-time notifications.
/// Clients connect with query params: groupType=seats|payment|group
/// </summary>
public class CinemaHub : Hub
{
    private readonly SeatLockManager _seatLockManager;
    private readonly GetGroupBookingStateUseCase _getGroupBookingStateUseCase;
    private readonly ILogger<CinemaHub> _logger;

    public CinemaHub(
        SeatLockManager seatLockManager,
        GetGroupBookingStateUseCase getGroupBookingStateUseCase,
        ILogger<CinemaHub> logger)
    {
        _seatLockManager = seatLockManager;
        _getGroupBookingStateUseCase = getGroupBookingStateUseCase;
        _logger = logger;
    }

    public Task<SeatLockHubResponse> LockSeat(string scheduleId, string seatId, string userName, string clientId)
    {
        var (success, message, lockedSeats) = _seatLockManager.LockSeat(scheduleId, seatId, userName, clientId);
        return Task.FromResult(new SeatLockHubResponse(success, message, lockedSeats));
    }

    public Task<SeatLockHubResponse> UnlockSeat(string scheduleId, string seatId, string? clientId = null)
    {
        var (success, message, lockedSeats) = _seatLockManager.UnlockSeat(scheduleId, seatId, clientId);
        return Task.FromResult(new SeatLockHubResponse(success, message, lockedSeats));
    }

    public override async Task OnConnectedAsync()
    {
        var httpContext = Context.GetHttpContext();
        if (httpContext == null)
        {
            await base.OnConnectedAsync();
            return;
        }

        var groupType = httpContext.Request.Query["groupType"].FirstOrDefault();

        switch (groupType)
        {
            case "seats":
                await HandleSeatConnection(httpContext);
                break;
            case "payment":
                await HandlePaymentConnection(httpContext);
                break;
            case "group":
                await HandleGroupConnection(httpContext);
                break;
            default:
                _logger.LogWarning("Unknown groupType '{GroupType}' from connection {ConnectionId}", groupType, Context.ConnectionId);
                break;
        }

        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        var httpContext = Context.GetHttpContext();
        var groupType = httpContext?.Request.Query["groupType"].FirstOrDefault();

        if (groupType == "seats")
        {
            var clientId = httpContext?.Request.Query["clientId"].FirstOrDefault();
            if (!string.IsNullOrEmpty(clientId))
            {
                _seatLockManager.ReleaseSeatsByClient(clientId);
            }
        }

        await base.OnDisconnectedAsync(exception);
    }

    private async Task HandleSeatConnection(HttpContext httpContext)
    {
        var scheduleId = httpContext.Request.Query["scheduleId"].FirstOrDefault();
        var clientId = httpContext.Request.Query["clientId"].FirstOrDefault()
            ?? Context.ConnectionId;

        if (string.IsNullOrEmpty(scheduleId))
        {
            _logger.LogWarning("Seat connection missing scheduleId");
            return;
        }

        var groupName = $"seats-{scheduleId}";
        await Groups.AddToGroupAsync(Context.ConnectionId, groupName);

        // Send initial state
        var lockedSeats = _seatLockManager.GetCurrentLockedSeats(scheduleId);
        await Clients.Caller.SendAsync("initial-state", new { lockedSeats });
    }

    private async Task HandlePaymentConnection(HttpContext httpContext)
    {
        if (!IsAuthenticated())
        {
            _logger.LogWarning("Unauthenticated payment hub connection {ConnectionId}", Context.ConnectionId);
            Context.Abort();
            return;
        }

        var orderIdStr = httpContext.Request.Query["orderId"].FirstOrDefault();
        if (string.IsNullOrEmpty(orderIdStr) || !Guid.TryParse(orderIdStr, out var orderId))
        {
            _logger.LogWarning("Payment connection missing or invalid orderId");
            return;
        }

        var groupName = $"payment-{orderId}";
        await Groups.AddToGroupAsync(Context.ConnectionId, groupName);
    }

    private async Task HandleGroupConnection(HttpContext httpContext)
    {
        if (!IsAuthenticated())
        {
            _logger.LogWarning("Unauthenticated group hub connection {ConnectionId}", Context.ConnectionId);
            Context.Abort();
            return;
        }

        var groupSessionIdStr = httpContext.Request.Query["groupSessionId"].FirstOrDefault();
        if (string.IsNullOrEmpty(groupSessionIdStr) || !Guid.TryParse(groupSessionIdStr, out var groupSessionId))
        {
            _logger.LogWarning("Group connection missing or invalid groupSessionId");
            return;
        }

        var groupName = $"group-{groupSessionId}";
        await Groups.AddToGroupAsync(Context.ConnectionId, groupName);

        // Send initial state
        var state = await _getGroupBookingStateUseCase.ExecuteAsync(groupSessionId);
        if (state.IsSuccess && state.Data != null)
        {
            await Clients.Caller.SendAsync("initial-state", new { state = state.Data });
        }
    }

    private bool IsAuthenticated() =>
        Context.User?.Identity?.IsAuthenticated == true;

    public sealed record SeatLockHubResponse(bool Success, string? Message, Dictionary<string, string> LockedSeats);
}
