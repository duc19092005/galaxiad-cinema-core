using Cinema.Application.Interfaces;
using Cinema.Domain.Constants;
using Cinema.Infrastructure.Chatbot.Policy;
using FluentAssertions;
using Moq;

namespace Cinema.Tests.UnitTests.Chatbot;

public class ChatPolicyServiceTests
{
    public static IEnumerable<object[]> PublicIntents()
    {
        yield return [ChatbotConstants.Intents.GeneralFAQ];
        yield return [ChatbotConstants.Intents.GetMovies];
        yield return [ChatbotConstants.Intents.GetShowtimes];
        yield return [ChatbotConstants.Intents.GetPromotions];
        yield return [ChatbotConstants.Intents.GetCinemaLocations];
        yield return [ChatbotConstants.Intents.GetAvailableSeats];
        yield return [ChatbotConstants.Intents.SearchMoviesSemantic];
        yield return [ChatbotConstants.Intents.GetTrendingMovies];
    }

    public static IEnumerable<object[]> LoginRequiredIntents()
    {
        yield return [ChatbotConstants.Intents.GetMyBookings];
        yield return [ChatbotConstants.Intents.GetBookingStatus];
    }

    [Theory]
    [MemberData(nameof(PublicIntents))]
    public async Task PublicIntents_AllowGuest(string intent)
    {
        var service = CreateService();

        var result = await service.IsAuthorizedAsync(intent);

        result.Should().BeTrue();
    }

    [Theory]
    [MemberData(nameof(LoginRequiredIntents))]
    public async Task LoginRequiredIntents_DenyGuest(string intent)
    {
        var service = CreateService(userId: Guid.Empty);

        var result = await service.IsAuthorizedAsync(intent);

        result.Should().BeFalse();
    }

    [Theory]
    [MemberData(nameof(LoginRequiredIntents))]
    public async Task LoginRequiredIntents_AllowAuthenticatedUser(string intent)
    {
        var service = CreateService(userId: Guid.NewGuid());

        var result = await service.IsAuthorizedAsync(intent);

        result.Should().BeTrue();
    }

    [Theory]
    [InlineData("TheaterManager")]
    [InlineData("FacilitiesManager")]
    [InlineData("Admin")]
    public async Task CinemaStatistics_AllowsManagerOrAdminRoles(string role)
    {
        var service = CreateService(roles: [role]);

        var result = await service.IsAuthorizedAsync(ChatbotConstants.Intents.GetCinemaStatistics);

        result.Should().BeTrue();
    }

    [Theory]
    [InlineData("")]
    [InlineData("Customer")]
    [InlineData("Cashier")]
    [InlineData("MovieManager")]
    public async Task CinemaStatistics_DeniesOtherRoles(string role)
    {
        var roles = string.IsNullOrWhiteSpace(role) ? Array.Empty<string>() : new[] { role };
        var service = CreateService(roles: roles);

        var result = await service.IsAuthorizedAsync(ChatbotConstants.Intents.GetCinemaStatistics);

        result.Should().BeFalse();
    }

    [Theory]
    [InlineData("TheaterManager")]
    [InlineData("Admin")]
    public async Task ShowtimeRecommendations_AllowsSchedulePlannerRoles(string role)
    {
        var service = CreateService(roles: [role]);

        var result = await service.IsAuthorizedAsync(ChatbotConstants.Intents.GetShowtimeRecommendations);

        result.Should().BeTrue();
    }

    [Theory]
    [InlineData("")]
    [InlineData("Customer")]
    [InlineData("FacilitiesManager")]
    [InlineData("MovieManager")]
    public async Task ShowtimeRecommendations_DeniesOtherRoles(string role)
    {
        var roles = string.IsNullOrWhiteSpace(role) ? Array.Empty<string>() : new[] { role };
        var service = CreateService(roles: roles);

        var result = await service.IsAuthorizedAsync(ChatbotConstants.Intents.GetShowtimeRecommendations);

        result.Should().BeFalse();
    }

    [Fact]
    public async Task SystemAuditLogs_AllowsAdminOnly()
    {
        var adminService = CreateService(roles: ["Admin"]);
        var managerService = CreateService(roles: ["TheaterManager"]);

        var adminResult = await adminService.IsAuthorizedAsync(ChatbotConstants.Intents.GetSystemAuditLogs);
        var managerResult = await managerService.IsAuthorizedAsync(ChatbotConstants.Intents.GetSystemAuditLogs);

        adminResult.Should().BeTrue();
        managerResult.Should().BeFalse();
    }

    [Fact]
    public async Task UnknownIntent_IsDenied()
    {
        var service = CreateService(roles: ["Admin"]);

        var result = await service.IsAuthorizedAsync("UnknownIntent");

        result.Should().BeFalse();
    }

    private static ChatPolicyService CreateService(Guid? userId = null, IReadOnlyCollection<string>? roles = null)
    {
        var userContext = new Mock<IUserContextService>();
        userContext.Setup(x => x.GetUserId()).Returns(userId ?? Guid.Empty);
        userContext.Setup(x => x.IsInRole(It.IsAny<string>()))
            .Returns((string role) => roles?.Contains(role) == true);

        return new ChatPolicyService(userContext.Object);
    }
}
