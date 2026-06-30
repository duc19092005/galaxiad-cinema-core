using System.ComponentModel.DataAnnotations;
using Cinema.Domain.Enums;

namespace Cinema.Application.Dtos.Booking;

// ==========================================
// SOCIAL BOOKING - Create Group Session
// ==========================================

public class ReqCreateGroupBookingDto
{
    [Required(ErrorMessage = "Schedule Id is required")]
    public Guid ScheduleId { get; set; }

    [StringLength(200)]
    public string? GroupName { get; set; }

    public int MaxMembers { get; set; } = 8;

    public List<Guid> InviteUserIds { get; set; } = [];

    public List<string> InviteEmails { get; set; } = [];
}

public class ResCreateGroupBookingDto
{
    public Guid GroupSessionId { get; set; }
    public string GroupCode { get; set; } = string.Empty;
    public string InviteLink { get; set; } = string.Empty;
    public string GroupName { get; set; } = string.Empty;
    public string MovieName { get; set; } = string.Empty;
    public string MovieImageUrl { get; set; } = string.Empty;
    public string CinemaName { get; set; } = string.Empty;
    public string AuditoriumNumber { get; set; } = string.Empty;
    public string FormatName { get; set; } = string.Empty;
    public DateTime StartTime { get; set; }
    public DateTime EndedTime { get; set; }
    public int MaxMembers { get; set; }
    public DateTime ExpiresAt { get; set; }
}

// ==========================================
// SOCIAL BOOKING - Join Group
// ==========================================

public class ReqJoinGroupBookingDto
{
    [Required(ErrorMessage = "Group code is required")]
    public string GroupCode { get; set; } = string.Empty;
}

public class ResJoinGroupBookingDto
{
    public Guid GroupSessionId { get; set; }
    public Guid ScheduleId { get; set; }
    public string GroupCode { get; set; } = string.Empty;
    public string GroupName { get; set; } = string.Empty;
    public string MovieName { get; set; } = string.Empty;
    public string MovieImageUrl { get; set; } = string.Empty;
    public string CinemaName { get; set; } = string.Empty;
    public string AuditoriumNumber { get; set; } = string.Empty;
    public string FormatName { get; set; } = string.Empty;
    public DateTime StartTime { get; set; }
    public DateTime EndedTime { get; set; }
    public string HostName { get; set; } = string.Empty;
    public int MemberCount { get; set; }
    public int MaxMembers { get; set; }
    public GroupBookingStatusEnum Status { get; set; }
    public DateTime ExpiresAt { get; set; }
    public List<GroupMemberDto> Members { get; set; } = [];
}

// ==========================================
// SOCIAL BOOKING - Group State (for SSE sync)
// ==========================================

public class ResGroupBookingStateDto
{
    public Guid GroupSessionId { get; set; }
    public Guid ScheduleId { get; set; }
    public string GroupCode { get; set; } = string.Empty;
    public string GroupName { get; set; } = string.Empty;
    public GroupBookingStatusEnum Status { get; set; }
    public string MovieName { get; set; } = string.Empty;
    public string MovieImageUrl { get; set; } = string.Empty;
    public string CinemaName { get; set; } = string.Empty;
    public string AuditoriumNumber { get; set; } = string.Empty;
    public string FormatName { get; set; } = string.Empty;
    public DateTime StartTime { get; set; }
    public DateTime EndedTime { get; set; }
    public int MaxMembers { get; set; }
    public DateTime? PaymentDeadlineAt { get; set; }
    public decimal TotalGroupAmount { get; set; }
    public decimal CollectedAmount { get; set; }
    public List<GroupMemberDto> Members { get; set; } = [];
    public List<GroupSeatDto> AllGroupSeats { get; set; } = [];
}

public class GroupMemberDto
{
    public Guid MemberId { get; set; }
    public Guid UserId { get; set; }
    public string UserName { get; set; } = string.Empty;
    public string? AvatarUrl { get; set; }
    public bool IsHost { get; set; }
    public GroupMemberStatusEnum Status { get; set; }
    public decimal AmountToPay { get; set; }
    public decimal AmountPaid { get; set; }
    public List<GroupSeatDto> SelectedSeats { get; set; } = [];
}

public class GroupSeatDto
{
    public Guid SeatId { get; set; }
    public string SeatNumber { get; set; } = string.Empty;
    public int ColIndex { get; set; }
    public int RowIndex { get; set; }
    public decimal PriceEach { get; set; }
    public bool IsConfirmed { get; set; }
    public Guid? MemberId { get; set; }
    public string? MemberName { get; set; }
}

// ==========================================
// SOCIAL BOOKING - Select Seats
// ==========================================

public class ReqSelectGroupSeatsDto
{
    [Required(ErrorMessage = "Seat selections are required")]
    public List<GroupSeatSelectionDto> SeatSelections { get; set; } = [];
}

public class GroupSeatSelectionDto
{
    [Required(ErrorMessage = "Seat Id is required")]
    public Guid SeatId { get; set; }

    [Required(ErrorMessage = "User Segment Id is required")]
    public Guid UserSegmentId { get; set; }
}

// ==========================================
// SOCIAL BOOKING - Confirm Seats
// ==========================================

public class ReqConfirmGroupSeatsDto
{
    public List<Guid> SeatIds { get; set; } = [];
}

public class ResConfirmGroupMemberSeatsDto
{
    public bool IsAllConfirmed { get; set; }
    public int ConfirmedCount { get; set; }
    public int TotalMembers { get; set; }
    public GroupBookingStatusEnum SessionStatus { get; set; }
}

// ==========================================
// SOCIAL BOOKING - Pay Group Booking
// ==========================================

public class ResPayGroupBookingDto
{
    public string PaymentUrl { get; set; } = string.Empty;
    public decimal Amount { get; set; }
}

// ==========================================
// SOCIAL BOOKING - Chat Message
// ==========================================

public class ReqSendGroupChatDto
{
    [Required(ErrorMessage = "Message content is required")]
    [StringLength(2000, ErrorMessage = "Message too long")]
    public string Content { get; set; } = string.Empty;
}

public class ResGroupChatMessageDto
{
    public Guid MessageId { get; set; }
    public Guid? SenderId { get; set; }
    public string SenderName { get; set; } = string.Empty;
    public string? SenderAvatarUrl { get; set; }
    public string Content { get; set; } = string.Empty;
    public GroupChatMessageTypeEnum MessageType { get; set; }
    public DateTime CreatedAt { get; set; }
}

// ==========================================
// SOCIAL BOOKING - Movie Vote
// ==========================================

public class ReqVoteMovieDto
{
    [Required(ErrorMessage = "Schedule Id to vote is required")]
    public Guid VoteScheduleId { get; set; }
}

public class ResMovieVoteStateDto
{
    public List<MovieVoteOptionDto> Options { get; set; } = [];
    public string? WinnerScheduleId { get; set; }
}

public class MovieVoteOptionDto
{
    public Guid ScheduleId { get; set; }
    public string MovieName { get; set; } = string.Empty;
    public string MovieImageUrl { get; set; } = string.Empty;
    public DateTime StartTime { get; set; }
    public int VoteCount { get; set; }
    public List<string> VoterNames { get; set; } = [];
}

// ==========================================
// SOCIAL BOOKING - Payment Actions
// ==========================================

public class ReqGroupPaymentActionDto
{
    [Required]
    public GroupPaymentActionEnum Action { get; set; }
}

public class ResGroupPaymentActionDto
{
    public GroupPaymentActionEnum Action { get; set; }
    public string Message { get; set; } = string.Empty;
    public string? PaymentUrl { get; set; }
    public decimal Amount { get; set; }
    public bool IsSuccess { get; set; }
}

// ==========================================
// SOCIAL BOOKING - SSE Events
// ==========================================

public class GroupBookingSseEventDto
{
    public string EventType { get; set; } = string.Empty;
    public string? GroupCode { get; set; }
    public GroupBookingStatusEnum? Status { get; set; }
    public GroupMemberDto? Member { get; set; }
    public GroupSeatDto? Seat { get; set; }
    public ResGroupChatMessageDto? ChatMessage { get; set; }
    public ResMovieVoteStateDto? VoteState { get; set; }
    public ResGroupPaymentActionDto? PaymentAction { get; set; }
    public decimal? TotalGroupAmount { get; set; }
    public decimal? CollectedAmount { get; set; }
    public DateTime? PaymentDeadlineAt { get; set; }
}
