using System.Text.Json;
using Cinema.Application.Dtos;
using Cinema.Application.Dtos.Booking;
using Cinema.Application.Infrastructure.Booking;
using Cinema.Application.UseCases.Booking.SocialBooking;
using Cinema.Api.Hubs;

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
    private readonly VotePaymentMethodUseCase _votePaymentMethodUseCase;
    private readonly GetPaymentMethodVoteStateUseCase _getPaymentMethodVoteStateUseCase;
    private readonly CreatePairUseCase _createPairUseCase;
    private readonly RespondPairUseCase _respondPairUseCase;
    private readonly GetGroupPairsUseCase _getGroupPairsUseCase;
    private readonly VotePaymentFailureUseCase _votePaymentFailureUseCase;
    private readonly RaiseHandUseCase _raiseHandUseCase;
    private readonly GroupBookingWsManager _wsManager;
    private readonly ILogger<GroupBookingController> _logger;

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
        VotePaymentMethodUseCase votePaymentMethodUseCase,
        GetPaymentMethodVoteStateUseCase getPaymentMethodVoteStateUseCase,
        CreatePairUseCase createPairUseCase,
        RespondPairUseCase respondPairUseCase,
        GetGroupPairsUseCase getGroupPairsUseCase,
        VotePaymentFailureUseCase votePaymentFailureUseCase,
        RaiseHandUseCase raiseHandUseCase,
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
        _votePaymentMethodUseCase = votePaymentMethodUseCase;
        _getPaymentMethodVoteStateUseCase = getPaymentMethodVoteStateUseCase;
        _createPairUseCase = createPairUseCase;
        _respondPairUseCase = respondPairUseCase;
        _getGroupPairsUseCase = getGroupPairsUseCase;
        _votePaymentFailureUseCase = votePaymentFailureUseCase;
        _raiseHandUseCase = raiseHandUseCase;
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
            try
            {
                var state = await _getGroupBookingStateUseCase.ExecuteAsync(result.Data.GroupSessionId);
                if (state.IsSuccess && state.Data != null)
                {
                    await _wsManager.BroadcastAsync(result.Data.GroupSessionId, new { type = "group-update", state = state.Data });
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to fetch/broadcast group state after join for {GroupSessionId}", result.Data.GroupSessionId);
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
            try
            {
                var state = await _getGroupBookingStateUseCase.ExecuteAsync(groupSessionId);
                if (state.IsSuccess && state.Data != null)
                {
                    await _wsManager.BroadcastAsync(groupSessionId, new { type = "group-update", state = state.Data });
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to fetch/broadcast group state after seat selection for {GroupSessionId}", groupSessionId);
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
            try
            {
                var state = await _getGroupBookingStateUseCase.ExecuteAsync(groupSessionId);
                if (state.IsSuccess && state.Data != null)
                {
                    await _wsManager.BroadcastAsync(groupSessionId, new { type = "group-update", state = state.Data });
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to fetch/broadcast group state after confirm for {GroupSessionId}", groupSessionId);
            }
        }
        return Ok(result);
    }

    [HttpPost("pay/{groupSessionId}")]
    public async Task<IActionResult> PayGroup(Guid groupSessionId, [FromQuery] Guid? failedMemberId)
    {
        var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "127.0.0.1";
        var result = await _payGroupBookingUseCase.ExecuteAsync(groupSessionId, ipAddress, failedMemberId);
        return Ok(result);
    }

    [HttpPost("chat/{groupSessionId}")]
    public async Task<IActionResult> SendChat(Guid groupSessionId, [FromBody] ReqSendGroupChatDto request)
    {
        var result = await _sendGroupChatMessageUseCase.ExecuteAsync(groupSessionId, request);
        if (result.IsSuccess)
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
            try
            {
                await _wsManager.BroadcastAsync(groupSessionId, new { type = "payment-action", paymentAction = result.Data });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to broadcast payment action for {GroupSessionId}", groupSessionId);
            }
        }
        return Ok(result);
    }

    [HttpPost("leave/{groupSessionId}")]
    public async Task<IActionResult> LeaveGroup(Guid groupSessionId)
    {
        var result = await _leaveGroupBookingUseCase.ExecuteAsync(groupSessionId);
        return Ok(result);
    }

    [HttpPost("vote-payment-method/{groupSessionId}")]
    public async Task<IActionResult> VotePaymentMethod(Guid groupSessionId, [FromBody] ReqVotePaymentMethodDto request)
    {
        var result = await _votePaymentMethodUseCase.ExecuteAsync(groupSessionId, request);
        if (result.IsSuccess && result.Data != null)
        {
            try
            {
                var state = await _getGroupBookingStateUseCase.ExecuteAsync(groupSessionId);
                if (state.IsSuccess && state.Data != null)
                {
                    await _wsManager.BroadcastAsync(groupSessionId, new { type = "group-update", state = state.Data });
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to broadcast group state after payment method vote for {GroupSessionId}", groupSessionId);
            }
        }
        return Ok(result);
    }

    [HttpGet("payment-method-vote/{groupSessionId}")]
    public async Task<IActionResult> GetPaymentMethodVoteState(Guid groupSessionId)
    {
        var result = await _getPaymentMethodVoteStateUseCase.ExecuteAsync(groupSessionId);
        return Ok(result);
    }

    [HttpPost("pair/{groupSessionId}")]
    public async Task<IActionResult> CreatePair(Guid groupSessionId, [FromBody] ReqCreatePairDto request)
    {
        var result = await _createPairUseCase.ExecuteAsync(groupSessionId, request);
        if (result.IsSuccess)
        {
            try
            {
                await _wsManager.BroadcastAsync(groupSessionId, new { type = "pair-update", pair = result.Data });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to broadcast pair request for {GroupSessionId}", groupSessionId);
            }
        }
        return Ok(result);
    }

    [HttpPost("pair/{groupSessionId}/respond/{pairId}")]
    public async Task<IActionResult> RespondPair(Guid groupSessionId, string pairId, [FromBody] ReqRespondPairDto request)
    {
        var result = await _respondPairUseCase.ExecuteAsync(groupSessionId, pairId, request);
        if (result.IsSuccess)
        {
            try
            {
                var state = await _getGroupBookingStateUseCase.ExecuteAsync(groupSessionId);
                if (state.IsSuccess && state.Data != null)
                {
                    await _wsManager.BroadcastAsync(groupSessionId, new { type = "group-update", state = state.Data });
                }
                await _wsManager.BroadcastAsync(groupSessionId, new { type = "pair-update" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to broadcast pair response for {PairId}", pairId);
            }
        }
        return Ok(result);
    }

    [HttpGet("pairs/{groupSessionId}")]
    public async Task<IActionResult> GetGroupPairs(Guid groupSessionId)
    {
        var result = await _getGroupPairsUseCase.ExecuteAsync(groupSessionId);
        return Ok(result);
    }

    [HttpPost("vote-payment-failure/{groupSessionId}")]
    public async Task<IActionResult> VotePaymentFailure(Guid groupSessionId, [FromBody] ReqVotePaymentFailureDto request)
    {
        var result = await _votePaymentFailureUseCase.ExecuteAsync(groupSessionId, request);
        if (result.IsSuccess && result.Data != null)
        {
            try
            {
                await _wsManager.BroadcastAsync(groupSessionId, new { type = "payment-failure-vote-update", failureVoteState = result.Data });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to broadcast failure vote for {GroupSessionId}", groupSessionId);
            }
        }
        return Ok(result);
    }

    [HttpPost("raise-hand/{groupSessionId}")]
    public async Task<IActionResult> RaiseHand(Guid groupSessionId, [FromBody] ReqRaiseHandDto request)
    {
        var result = await _raiseHandUseCase.ExecuteAsync(groupSessionId, request);
        if (result.IsSuccess && result.Data != null)
        {
            try
            {
                await _wsManager.BroadcastAsync(groupSessionId, new { type = "raise-hand-update", raiseHands = result.Data });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to broadcast raise hand for {GroupSessionId}", groupSessionId);
            }
        }
        return Ok(result);
    }

    [HttpPost("vote-failure-option/{groupSessionId}")]
    public async Task<IActionResult> VoteFailureOption(Guid groupSessionId, [FromBody] ReqVoteFailureOptionDto request)
    {
        var result = await _votePaymentFailureUseCase.VoteFailureOptionAsync(groupSessionId, request);
        return Ok(result);
    }
}
