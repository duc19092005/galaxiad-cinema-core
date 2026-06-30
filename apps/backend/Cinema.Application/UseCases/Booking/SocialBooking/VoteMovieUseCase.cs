using Cinema.Application.Dtos;
using Cinema.Application.Dtos.Booking;
using Cinema.Application.Exceptions;
using Cinema.Application.Interfaces;
using Cinema.Application.Interfaces.Booking;
using Cinema.Domain.Entities.GroupBooking;
using Cinema.Domain.Interfaces.Persistence;
using Cinema.Domain.Enums;

namespace Cinema.Application.UseCases.Booking.SocialBooking;

public class VoteMovieUseCase
{
    private readonly IGroupBookingRepository _groupBookingRepository;
    private readonly IUserContextService _userContextService;
    private readonly ILogger<VoteMovieUseCase> _logger;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ISeatLockerNotificationService _notificationService;

    public VoteMovieUseCase(
        IGroupBookingRepository groupBookingRepository,
        IUserContextService userContextService,
        ILogger<VoteMovieUseCase> logger,
        IUnitOfWork unitOfWork,
        ISeatLockerNotificationService notificationService)
    {
        _groupBookingRepository = groupBookingRepository;
        _userContextService = userContextService;
        _logger = logger;
        _unitOfWork = unitOfWork;
        _notificationService = notificationService;
    }

    public async Task<BaseResponse<ResMovieVoteStateDto>> ExecuteAsync(Guid groupSessionId, ReqVoteMovieDto request)
    {
        var userId = _userContextService.GetUserId();

        var session = await _groupBookingRepository.GetSessionWithMembersAsync(groupSessionId);
        if (session == null)
            throw new NotFoundException("Group booking session not found");

        var member = session.Members.FirstOrDefault(m => m.UserId == userId && m.Status != GroupMemberStatusEnum.Removed);
        if (member == null)
            throw new BadRequestException("You are not a member of this group", "GBK51");

        var schedule = await _groupBookingRepository.GetScheduleByIdAsync(request.VoteScheduleId);
        if (schedule == null || schedule.MovieInfoEntity == null || !schedule.MovieInfoEntity.IsActive)
            throw new BadRequestException("Invalid movie schedule for voting", "GBK52");

        var voteOptionsJson = session.VotingOptionsJson ?? "[]";
        var votes = System.Text.Json.JsonSerializer.Deserialize<List<MovieVote>>(voteOptionsJson) ?? [];

        var existingVote = votes.FirstOrDefault(v => v.UserId == userId);
        if (existingVote != null)
        {
            votes.Remove(existingVote);
        }

        votes.Add(new MovieVote
        {
            UserId = userId,
            ScheduleId = request.VoteScheduleId,
            MovieName = schedule.MovieInfoEntity.MovieName,
            MovieImageUrl = schedule.MovieInfoEntity.MovieImageUrl ?? string.Empty,
            StartTime = schedule.StartTime
        });

        session.VotingOptionsJson = System.Text.Json.JsonSerializer.Serialize(votes);
        _groupBookingRepository.UpdateSession(session);

        var user = await _groupBookingRepository.FindUserByIdAsync(userId);
        var roleLabel = session.Members.FirstOrDefault(m => m.UserId == userId)?.IsHost == true ? "[Chủ phòng]" : "[Thành viên]";

        await _unitOfWork.SaveChangesAsync();

        await _notificationService.NotifyGroupChatMessageAsync(session.GroupSessionId, new ResGroupChatMessageDto
        {
            MessageId = Guid.NewGuid(),
            SenderId = userId,
            SenderName = "System",
            Content = $"{roleLabel} {user?.UserName ?? "Member"} đã vote phim \"{schedule.MovieInfoEntity.MovieName}\"",
            MessageType = GroupChatMessageTypeEnum.VoteEvent,
            CreatedAt = DateTime.UtcNow
        });

        return new BaseResponse<ResMovieVoteStateDto>
        {
            IsSuccess = true,
            Data = BuildVoteState(votes),
            Message = "Vote recorded"
        };
    }

    private static ResMovieVoteStateDto BuildVoteState(List<MovieVote> votes)
    {
        var grouped = votes
            .GroupBy(v => v.ScheduleId)
            .Select(g => new MovieVoteOptionDto
            {
                ScheduleId = g.Key,
                MovieName = g.First().MovieName,
                MovieImageUrl = g.First().MovieImageUrl,
                StartTime = g.First().StartTime,
                VoteCount = g.Count(),
                VoterNames = g.Select(v => v.UserId.ToString()).ToList()
            })
            .OrderByDescending(o => o.VoteCount)
            .ToList();

        var totalVotes = grouped.Sum(o => o.VoteCount);
        var winner = grouped.Count > 1 && grouped[0].VoteCount > totalVotes / 2
            ? grouped[0].ScheduleId.ToString()
            : null;

        return new ResMovieVoteStateDto
        {
            Options = grouped,
            WinnerScheduleId = winner
        };
    }

    private class MovieVote
    {
        public Guid UserId { get; set; }
        public Guid ScheduleId { get; set; }
        public string MovieName { get; set; } = string.Empty;
        public string MovieImageUrl { get; set; } = string.Empty;
        public DateTime StartTime { get; set; }
    }
}
