using Cinema.Application.Dtos.Booking;
using Cinema.Application.Exceptions;
using Cinema.Application.Interfaces;
using Cinema.Application.Interfaces.Booking;
using Cinema.Application.UseCases.Booking.SocialBooking;
using Cinema.Domain.Entities.CinemaInfos;
using Cinema.Domain.Entities.GroupBooking;
using Cinema.Domain.Entities.MovieInfos;
using Cinema.Domain.Entities.UserInfos;
using Cinema.Domain.Enums;
using Cinema.Domain.Interfaces.Persistence;
using FluentAssertions;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace Cinema.Tests.Unit.Booking;

public class SocialBookingUseCasesTests
{
    private readonly Mock<IGroupBookingRepository> _repoMock;
    private readonly Mock<IUserContextService> _userContextMock;
    private readonly Mock<IUnitOfWork> _unitOfWorkMock;
    private readonly Mock<ISeatLockerNotificationService> _notificationMock;
    private readonly Mock<IConfiguration> _configMock;

    public SocialBookingUseCasesTests()
    {
        _repoMock = new Mock<IGroupBookingRepository>();
        _userContextMock = new Mock<IUserContextService>();
        _unitOfWorkMock = new Mock<IUnitOfWork>();
        _notificationMock = new Mock<ISeatLockerNotificationService>();
        _configMock = new Mock<IConfiguration>();
        _configMock.Setup(c => c["Frontend:BaseUrl"]).Returns("http://localhost:5173");
    }

    [Fact]
    public async Task CreateGroupBooking_ValidRequest_CreatesSessionAndHostMember()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var scheduleId = Guid.NewGuid();
        _userContextMock.Setup(u => u.GetUserId()).Returns(userId);

        var schedule = new MovieScheduleInfoEntity
        {
            MovieScheduleInfoId = scheduleId,
            StartTime = DateTime.UtcNow.AddHours(2),
            MovieInfoEntity = new MovieInfoEntity
            {
                MovieId = Guid.NewGuid(),
                MovieName = "Interstellar",
                IsActive = true
            }
        };
        _repoMock.Setup(r => r.GetScheduleByIdAsync(scheduleId)).ReturnsAsync(schedule);
        _repoMock.Setup(r => r.FindUserByIdAsync(userId)).ReturnsAsync(new UserInfoEntity
        {
            UserId = userId,
            UserName = "Alice Host"
        });

        GroupBookingSessionEntity? savedSession = null;
        GroupBookingMemberEntity? savedMember = null;

        _repoMock.Setup(r => r.AddSessionAsync(It.IsAny<GroupBookingSessionEntity>()))
            .Callback<GroupBookingSessionEntity>(s => savedSession = s)
            .Returns(Task.CompletedTask);

        _repoMock.Setup(r => r.AddMemberAsync(It.IsAny<GroupBookingMemberEntity>()))
            .Callback<GroupBookingMemberEntity>(m => savedMember = m)
            .Returns(Task.CompletedTask);

        var logger = new Mock<ILogger<CreateGroupBookingUseCase>>();
        var useCase = new CreateGroupBookingUseCase(
            _repoMock.Object,
            _userContextMock.Object,
            logger.Object,
            _configMock.Object,
            _unitOfWorkMock.Object,
            _notificationMock.Object);

        var request = new ReqCreateGroupBookingDto
        {
            ScheduleId = scheduleId,
            GroupName = "Movie Night",
            MaxMembers = 5
        };

        // Act
        var result = await useCase.ExecuteAsync(request);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Data.Should().NotBeNull();
        result.Data!.GroupCode.Should().HaveLength(8);
        result.Data.InviteLink.Should().Contain(result.Data.GroupCode);

        savedSession.Should().NotBeNull();
        savedSession!.GroupName.Should().Be("Movie Night");
        savedSession.MaxMembers.Should().Be(5);
        savedSession.Status.Should().Be(GroupBookingStatusEnum.Open);

        savedMember.Should().NotBeNull();
        savedMember!.UserId.Should().Be(userId);
        savedMember.IsHost.Should().BeTrue();
        savedMember.Status.Should().Be(GroupMemberStatusEnum.Joined);

        _unitOfWorkMock.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
        _notificationMock.Verify(n => n.NotifyGroupChatMessageAsync(
            savedSession.GroupSessionId,
            It.Is<ResGroupChatMessageDto>(m => m.MessageType == GroupChatMessageTypeEnum.SystemEvent)), Times.Once);
    }

    [Fact]
    public async Task CreateGroupBooking_ShowtimeInPast_ThrowsBadRequest()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var scheduleId = Guid.NewGuid();
        _userContextMock.Setup(u => u.GetUserId()).Returns(userId);

        var schedule = new MovieScheduleInfoEntity
        {
            MovieScheduleInfoId = scheduleId,
            StartTime = DateTime.UtcNow.AddMinutes(-10), // in the past
            MovieInfoEntity = new MovieInfoEntity { IsActive = true }
        };
        _repoMock.Setup(r => r.GetScheduleByIdAsync(scheduleId)).ReturnsAsync(schedule);

        var logger = new Mock<ILogger<CreateGroupBookingUseCase>>();
        var useCase = new CreateGroupBookingUseCase(
            _repoMock.Object,
            _userContextMock.Object,
            logger.Object,
            _configMock.Object,
            _unitOfWorkMock.Object,
            _notificationMock.Object);

        // Act & Assert
        await Assert.ThrowsAsync<BadRequestException>(() =>
            useCase.ExecuteAsync(new ReqCreateGroupBookingDto { ScheduleId = scheduleId }));
    }

    [Fact]
    public async Task JoinGroupBooking_GroupFull_ThrowsBadRequest()
    {
        // Arrange
        var userId = Guid.NewGuid();
        const string groupCode = "FULL1234";
        _userContextMock.Setup(u => u.GetUserId()).Returns(userId);

        var session = new GroupBookingSessionEntity
        {
            GroupSessionId = Guid.NewGuid(),
            GroupCode = groupCode,
            MaxMembers = 4,
            Status = GroupBookingStatusEnum.Open,
            ExpiresAt = DateTime.UtcNow.AddMinutes(20)
        };
        _repoMock.Setup(r => r.GetSessionByCodeAsync(groupCode)).ReturnsAsync(session);
        _repoMock.Setup(r => r.GetMemberAsync(session.GroupSessionId, userId)).ReturnsAsync((GroupBookingMemberEntity?)null);
        _repoMock.Setup(r => r.GetMemberCountAsync(session.GroupSessionId)).ReturnsAsync(4); // Already 4 members!

        var logger = new Mock<ILogger<JoinGroupBookingUseCase>>();
        var useCase = new JoinGroupBookingUseCase(
            _repoMock.Object,
            _userContextMock.Object,
            logger.Object,
            _unitOfWorkMock.Object,
            null!,
            _notificationMock.Object);

        // Act & Assert
        var ex = await Assert.ThrowsAsync<BadRequestException>(() =>
            useCase.ExecuteAsync(new ReqJoinGroupBookingDto { GroupCode = groupCode }));

        ex.Message.Should().Contain("full");
    }

    [Fact]
    public async Task JoinGroupBooking_ExpiredSession_ThrowsBadRequest()
    {
        // Arrange
        var userId = Guid.NewGuid();
        const string groupCode = "EXPD1234";
        _userContextMock.Setup(u => u.GetUserId()).Returns(userId);

        var session = new GroupBookingSessionEntity
        {
            GroupSessionId = Guid.NewGuid(),
            GroupCode = groupCode,
            MaxMembers = 4,
            Status = GroupBookingStatusEnum.Open,
            ExpiresAt = DateTime.UtcNow.AddMinutes(-5) // Expired 5 min ago
        };
        _repoMock.Setup(r => r.GetSessionByCodeAsync(groupCode)).ReturnsAsync(session);

        var logger = new Mock<ILogger<JoinGroupBookingUseCase>>();
        var useCase = new JoinGroupBookingUseCase(
            _repoMock.Object,
            _userContextMock.Object,
            logger.Object,
            _unitOfWorkMock.Object,
            null!,
            _notificationMock.Object);

        // Act & Assert
        var ex = await Assert.ThrowsAsync<BadRequestException>(() =>
            useCase.ExecuteAsync(new ReqJoinGroupBookingDto { GroupCode = groupCode }));

        ex.Message.Should().Contain("expired");
    }

    [Fact]
    public async Task VoteMovie_ValidVote_RecordsVoteAndReplacesPriorVote()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var sessionId = Guid.NewGuid();
        var oldScheduleId = Guid.NewGuid();
        var newScheduleId = Guid.NewGuid();

        _userContextMock.Setup(u => u.GetUserId()).Returns(userId);

        var member = new GroupBookingMemberEntity
        {
            MemberId = Guid.NewGuid(),
            GroupSessionId = sessionId,
            UserId = userId,
            IsHost = false,
            Status = GroupMemberStatusEnum.Joined
        };

        var initialVotes = new List<TestMovieVote>
        {
            new()
            {
                UserId = userId,
                ScheduleId = oldScheduleId,
                MovieName = "Old Movie",
                MovieImageUrl = "",
                StartTime = DateTime.UtcNow.AddDays(1)
            }
        };

        var session = new GroupBookingSessionEntity
        {
            GroupSessionId = sessionId,
            Members = new List<GroupBookingMemberEntity> { member },
            VotingOptionsJson = System.Text.Json.JsonSerializer.Serialize(initialVotes)
        };

        var newSchedule = new MovieScheduleInfoEntity
        {
            MovieScheduleInfoId = newScheduleId,
            StartTime = DateTime.UtcNow.AddDays(2),
            MovieInfoEntity = new MovieInfoEntity
            {
                MovieId = Guid.NewGuid(),
                MovieName = "Dune 2",
                MovieImageUrl = "http://example.com/dune2.jpg",
                IsActive = true
            }
        };

        _repoMock.Setup(r => r.GetSessionWithMembersAsync(sessionId)).ReturnsAsync(session);
        _repoMock.Setup(r => r.GetScheduleByIdAsync(newScheduleId)).ReturnsAsync(newSchedule);
        _repoMock.Setup(r => r.FindUserByIdAsync(userId)).ReturnsAsync(new UserInfoEntity
        {
            UserId = userId,
            UserName = "Voter Bob"
        });

        var logger = new Mock<ILogger<VoteMovieUseCase>>();
        var useCase = new VoteMovieUseCase(
            _repoMock.Object,
            _userContextMock.Object,
            logger.Object,
            _unitOfWorkMock.Object,
            _notificationMock.Object);

        // Act
        var result = await useCase.ExecuteAsync(sessionId, new ReqVoteMovieDto { VoteScheduleId = newScheduleId });

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Data.Should().NotBeNull();
        result.Data!.Options.Sum(o => o.VoteCount).Should().Be(1);
        result.Data.Options.Should().ContainSingle(o => o.ScheduleId == newScheduleId && o.VoteCount == 1);

        // Verify session voting JSON was updated with new schedule
        var savedVotes = System.Text.Json.JsonSerializer.Deserialize<List<TestMovieVote>>(session.VotingOptionsJson ?? "[]");
        savedVotes.Should().HaveCount(1);
        savedVotes![0].ScheduleId.Should().Be(newScheduleId);
        savedVotes[0].MovieName.Should().Be("Dune 2");

        _unitOfWorkMock.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
        _notificationMock.Verify(n => n.NotifyGroupChatMessageAsync(
            sessionId,
            It.Is<ResGroupChatMessageDto>(m => m.MessageType == GroupChatMessageTypeEnum.VoteEvent)), Times.Once);
    }

    private class TestMovieVote
    {
        public Guid UserId { get; set; }
        public Guid ScheduleId { get; set; }
        public string MovieName { get; set; } = string.Empty;
        public string MovieImageUrl { get; set; } = string.Empty;
        public DateTime StartTime { get; set; }
    }
}
