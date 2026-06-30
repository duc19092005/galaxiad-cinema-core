using Cinema.Application.Dtos;
using Cinema.Application.Dtos.Booking;
using Cinema.Application.Exceptions;
using Cinema.Application.Interfaces;
using Cinema.Application.Interfaces.Booking;
using Cinema.Domain.Entities.GroupBooking;
using Cinema.Domain.Interfaces.Persistence;
using Cinema.Domain.Enums;
using Cinema.Domain.Localization;

namespace Cinema.Application.UseCases.Booking.SocialBooking;

public class CreateGroupBookingUseCase
{
    private readonly IGroupBookingRepository _groupBookingRepository;
    private readonly IUserContextService _userContextService;
    private readonly ILogger<CreateGroupBookingUseCase> _logger;
    private readonly IConfiguration _configuration;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ISeatLockerNotificationService _notificationService;

    public CreateGroupBookingUseCase(
        IGroupBookingRepository groupBookingRepository,
        IUserContextService userContextService,
        ILogger<CreateGroupBookingUseCase> logger,
        IConfiguration configuration,
        IUnitOfWork unitOfWork,
        ISeatLockerNotificationService notificationService)
    {
        _groupBookingRepository = groupBookingRepository;
        _userContextService = userContextService;
        _logger = logger;
        _configuration = configuration;
        _unitOfWork = unitOfWork;
        _notificationService = notificationService;
    }

    public async Task<BaseResponse<ResCreateGroupBookingDto>> ExecuteAsync(ReqCreateGroupBookingDto request)
    {
        var userId = _userContextService.GetUserId();

        var schedule = await _groupBookingRepository.GetScheduleByIdAsync(request.ScheduleId);
        if (schedule == null || schedule.MovieInfoEntity == null || !schedule.MovieInfoEntity.IsActive)
            throw new BadRequestException(Messages.Booking.ScheduleNotFoundOrInactive, "GBK01");

        if (schedule.StartTime <= DateTime.UtcNow)
            throw new BadRequestException(Messages.Booking.ShowtimeAlreadyStarted, "GBK02");

        var user = await _groupBookingRepository.FindUserByIdAsync(userId);
        var userName = user?.UserName ?? "Host";

        var groupCode = Guid.NewGuid().ToString("N").Substring(0, 8).ToUpper();

        var session = new GroupBookingSessionEntity
        {
            GroupSessionId = Guid.NewGuid(),
            GroupCode = groupCode,
            CreatedByUserId = userId,
            MovieScheduleId = request.ScheduleId,
            GroupName = request.GroupName.Trim(),
            Status = GroupBookingStatusEnum.Open,
            MaxMembers = Math.Clamp(request.MaxMembers, 2, 8),
            CreatedAt = DateTime.UtcNow,
            ExpiresAt = DateTime.UtcNow.AddMinutes(30),
            TotalGroupAmount = 0,
            CollectedAmount = 0
        };

        var hostMember = new GroupBookingMemberEntity
        {
            MemberId = Guid.NewGuid(),
            GroupSessionId = session.GroupSessionId,
            UserId = userId,
            IsHost = true,
            Status = GroupMemberStatusEnum.Joined,
            AmountToPay = 0,
            AmountPaid = 0,
            JoinedAt = DateTime.UtcNow
        };

        await _groupBookingRepository.AddSessionAsync(session);
        await _groupBookingRepository.AddMemberAsync(hostMember);

        await _unitOfWork.SaveChangesAsync();

        // Save and broadcast join chat message in-memory (after SaveChanges to ensure session exists)
        await _notificationService.NotifyGroupChatMessageAsync(session.GroupSessionId, new ResGroupChatMessageDto
        {
            MessageId = Guid.NewGuid(),
            SenderId = userId,
            SenderName = "System",
            Content = $"[Chủ phòng] {userName} đã tạo nhóm \"{session.GroupName}\"",
            MessageType = GroupChatMessageTypeEnum.SystemEvent,
            CreatedAt = DateTime.UtcNow
        });

        var frontendUrl = _configuration["Frontend:BaseUrl"] ?? "http://localhost:5173";
        var inviteLink = $"{frontendUrl}/group-booking/{groupCode}";

        return new BaseResponse<ResCreateGroupBookingDto>
        {
            IsSuccess = true,
            Data = new ResCreateGroupBookingDto
            {
                GroupSessionId = session.GroupSessionId,
                GroupCode = groupCode,
                InviteLink = inviteLink,
                GroupName = session.GroupName,
                MovieName = schedule.MovieInfoEntity.MovieName,
                MovieImageUrl = schedule.MovieInfoEntity.MovieImageUrl ?? string.Empty,
                CinemaName = schedule.AuditoriumInfoEntities?.CinemaInfoEntity?.CinemaName ?? string.Empty,
                AuditoriumNumber = schedule.AuditoriumInfoEntities?.AuditoriumNumber ?? string.Empty,
                FormatName = schedule.MovieFormatInfoEntity?.MovieFormatName ?? string.Empty,
                StartTime = schedule.StartTime,
                EndedTime = schedule.EndedTime,
                MaxMembers = session.MaxMembers,
                ExpiresAt = session.ExpiresAt ?? DateTime.UtcNow.AddMinutes(30)
            },
            Message = "Group booking session created successfully"
        };
    }

    private static string GenerateGroupCode()
    {
        const string chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        var random = new Random();
        return new string(Enumerable.Repeat(chars, 8)
            .Select(s => s[random.Next(s.Length)]).ToArray());
    }
}
