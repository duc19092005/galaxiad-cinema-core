using System.Text.Json;
using System.Net.WebSockets;
using System.Text;
using Cinema.Application.Dtos;
using Cinema.Application.Dtos.Booking;
using Cinema.Application.Infrastructure.Booking;
using Cinema.Application.UseCases.Booking.SocialBooking;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;


namespace Cinema.Api.Controllers.Customer.Booking;

[ApiController]
[Route("api/v1/booking/group")]
[Tags("Booking - Social Group")]
[ApiExplorerSettings(GroupName = "v1-user")]
[Authorize]
public class GroupBookingController : ControllerBase
{
    private readonly CreateGroupBookingUseCase _createGroupBookingUseCase;
    private readonly JoinGroupBookingUseCase _joinGroupBookingUseCase;
    private readonly GetGroupBookingStateUseCase _getGroupBookingStateUseCase;
    private readonly SelectGroupSeatsUseCase _selectGroupSeatsUseCase;
    private readonly ConfirmGroupMemberSeatsUseCase _confirmGroupMemberSeatsUseCase;
    private readonly PayGroupBookingUseCase _payGroupBookingUseCase;
    private readonly SendGroupChatMessageUseCase _sendGroupChatMessageUseCase;
    private readonly GetGroupChatMessagesUseCase _getGroupChatMessagesUseCase;
    private readonly VoteMovieUseCase _voteMovieUseCase;
    private readonly HandleGroupPaymentFailureUseCase _handleGroupPaymentFailureUseCase;
    private readonly LeaveGroupBookingUseCase _leaveGroupBookingUseCase;
    private readonly GroupBookingWsManager _wsManager;
    private readonly ILogger<GroupBookingController> _logger;

    private static readonly JsonSerializerOptions _jsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        Converters = { new System.Text.Json.Serialization.JsonStringEnumConverter() }
    };

    public GroupBookingController(
        CreateGroupBookingUseCase createGroupBookingUseCase,
        JoinGroupBookingUseCase joinGroupBookingUseCase,
        GetGroupBookingStateUseCase getGroupBookingStateUseCase,
        SelectGroupSeatsUseCase selectGroupSeatsUseCase,
        ConfirmGroupMemberSeatsUseCase confirmGroupMemberSeatsUseCase,
        PayGroupBookingUseCase payGroupBookingUseCase,
        SendGroupChatMessageUseCase sendGroupChatMessageUseCase,
        GetGroupChatMessagesUseCase getGroupChatMessagesUseCase,
        VoteMovieUseCase voteMovieUseCase,
        HandleGroupPaymentFailureUseCase handleGroupPaymentFailureUseCase,
        LeaveGroupBookingUseCase leaveGroupBookingUseCase,
        GroupBookingWsManager wsManager,
        ILogger<GroupBookingController> logger)
    {
        _createGroupBookingUseCase = createGroupBookingUseCase;
        _joinGroupBookingUseCase = joinGroupBookingUseCase;
        _getGroupBookingStateUseCase = getGroupBookingStateUseCase;
        _selectGroupSeatsUseCase = selectGroupSeatsUseCase;
        _confirmGroupMemberSeatsUseCase = confirmGroupMemberSeatsUseCase;
        _payGroupBookingUseCase = payGroupBookingUseCase;
        _sendGroupChatMessageUseCase = sendGroupChatMessageUseCase;
        _getGroupChatMessagesUseCase = getGroupChatMessagesUseCase;
        _voteMovieUseCase = voteMovieUseCase;
        _handleGroupPaymentFailureUseCase = handleGroupPaymentFailureUseCase;
        _leaveGroupBookingUseCase = leaveGroupBookingUseCase;
        _wsManager = wsManager;
        _logger = logger;
    }

    [HttpPost("create")]
    public async Task<IActionResult> CreateGroup([FromBody] ReqCreateGroupBookingDto request)
    {
        var result = await _createGroupBookingUseCase.ExecuteAsync(request);
        return Ok(result);
    }

    [HttpPost("join")]
    public async Task<IActionResult> JoinGroup([FromBody] ReqJoinGroupBookingDto request)
    {
        var result = await _joinGroupBookingUseCase.ExecuteAsync(request);
        if (result.IsSuccess && result.Data != null)
        {
            var state = await _getGroupBookingStateUseCase.ExecuteAsync(result.Data.GroupSessionId);
            if (state.IsSuccess && state.Data != null)
            {
                await _wsManager.BroadcastAsync(result.Data.GroupSessionId, new { type = "group-update", state = state.Data });
            }
        }
        return Ok(result);
    }

    [HttpGet("state/{groupSessionId}")]
    public async Task<IActionResult> GetGroupState(Guid groupSessionId)
    {
        var result = await _getGroupBookingStateUseCase.ExecuteAsync(groupSessionId);
        return Ok(result);
    }

    [HttpPost("seats/{groupSessionId}")]
    public async Task<IActionResult> SelectSeats(Guid groupSessionId, [FromBody] ReqSelectGroupSeatsDto request)
    {
        var result = await _selectGroupSeatsUseCase.ExecuteAsync(groupSessionId, request);
        if (result.IsSuccess)
        {
            var state = await _getGroupBookingStateUseCase.ExecuteAsync(groupSessionId);
            if (state.IsSuccess && state.Data != null)
            {
                await _wsManager.BroadcastAsync(groupSessionId, new { type = "group-update", state = state.Data });
            }
        }
        return Ok(result);
    }

    [HttpPost("confirm/{groupSessionId}")]
    public async Task<IActionResult> ConfirmSeats(Guid groupSessionId, [FromBody] ReqConfirmGroupSeatsDto request)
    {
        var result = await _confirmGroupMemberSeatsUseCase.ExecuteAsync(groupSessionId, request);
        if (result.IsSuccess)
        {
            var state = await _getGroupBookingStateUseCase.ExecuteAsync(groupSessionId);
            if (state.IsSuccess && state.Data != null)
            {
                await _wsManager.BroadcastAsync(groupSessionId, new { type = "group-update", state = state.Data });
            }
        }
        return Ok(result);
    }

    [HttpPost("pay/{groupSessionId}")]
    public async Task<IActionResult> PayGroup(Guid groupSessionId)
    {
        var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "127.0.0.1";
        var result = await _payGroupBookingUseCase.ExecuteAsync(groupSessionId, ipAddress);
        return Ok(result);
    }

    [HttpPost("chat/{groupSessionId}")]
    public async Task<IActionResult> SendChat(Guid groupSessionId, [FromBody] ReqSendGroupChatDto request)
    {
        var result = await _sendGroupChatMessageUseCase.ExecuteAsync(groupSessionId, request);
        if (result.IsSuccess && result.Data != null)
        {
            await _wsManager.BroadcastAsync(groupSessionId, new { type = "chat-message", chatMessage = result.Data });
        }
        return Ok(result);
    }

    [HttpGet("chat/{groupSessionId}")]
    public async Task<IActionResult> GetChatMessages(Guid groupSessionId, [FromQuery] int limit = 50, [FromQuery] DateTime? before = null)
    {
        var result = await _getGroupChatMessagesUseCase.ExecuteAsync(groupSessionId, limit, before);
        return Ok(result);
    }

    [HttpPost("vote/{groupSessionId}")]
    public async Task<IActionResult> VoteMovie(Guid groupSessionId, [FromBody] ReqVoteMovieDto request)
    {
        var result = await _voteMovieUseCase.ExecuteAsync(groupSessionId, request);
        if (result.IsSuccess && result.Data != null)
        {
            await _wsManager.BroadcastAsync(groupSessionId, new { type = "vote-update", voteState = result.Data });
        }
        return Ok(result);
    }

    [HttpPost("payment-action/{groupSessionId}")]
    public async Task<IActionResult> HandlePaymentAction(Guid groupSessionId, [FromBody] ReqGroupPaymentActionDto request)
    {
        var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "127.0.0.1";
        var result = await _handleGroupPaymentFailureUseCase.ExecuteAsync(groupSessionId, request, ipAddress);
        if (result.IsSuccess && result.Data != null)
        {
            await _wsManager.BroadcastAsync(groupSessionId, new { type = "payment-action", paymentAction = result.Data });
        }
        return Ok(result);
    }

    [HttpPost("leave/{groupSessionId}")]
    public async Task<IActionResult> LeaveGroup(Guid groupSessionId)
    {
        var result = await _leaveGroupBookingUseCase.ExecuteAsync(groupSessionId);
        return Ok(result);
    }

    [AllowAnonymous]
    [HttpGet("ws/{groupSessionId}")]
    public async Task GetWebSocket(Guid groupSessionId)
    {
        if (HttpContext.WebSockets.IsWebSocketRequest)
        {
            using var webSocket = await HttpContext.WebSockets.AcceptWebSocketAsync();
            var connectionId = Guid.NewGuid().ToString();
            _wsManager.AddConnection(groupSessionId, connectionId, webSocket);

            var state = await _getGroupBookingStateUseCase.ExecuteAsync(groupSessionId);
            if (state.IsSuccess && state.Data != null)
            {
                var payload = JsonSerializer.Serialize(new { type = "initial-state", state = state.Data }, _jsonOptions);
                var bytes = Encoding.UTF8.GetBytes(payload);
                await webSocket.SendAsync(new ArraySegment<byte>(bytes), WebSocketMessageType.Text, true, CancellationToken.None);
            }

            var buffer = new byte[1024 * 4];
            try
            {
                while (webSocket.State == WebSocketState.Open)
                {
                    var result = await webSocket.ReceiveAsync(new ArraySegment<byte>(buffer), CancellationToken.None);
                    if (result.MessageType == WebSocketMessageType.Close)
                    {
                        break;
                    }
                }
            }
            catch
            {
                // Ignore connection drops
            }
            finally
            {
                _wsManager.RemoveConnection(groupSessionId, connectionId);
                if (webSocket.State != WebSocketState.Closed && webSocket.State != WebSocketState.Aborted)
                {
                    try
                    {
                        await webSocket.CloseAsync(WebSocketCloseStatus.NormalClosure, "Closed by server", CancellationToken.None);
                    }
                    catch { }
                }
            }
        }
        else
        {
            HttpContext.Response.StatusCode = StatusCodes.Status400BadRequest;
        }
    }
}
