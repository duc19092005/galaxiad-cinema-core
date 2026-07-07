using Cinema.Application.Constants;
using Cinema.Application.Dtos.Chatbot;
using Cinema.Application.Interfaces;
using Cinema.Application.Interfaces.Chatbot;
using Cinema.Application.UseCases.Chatbot;
using Cinema.Domain.Constants;
using FluentAssertions;
using Moq;

namespace Cinema.Tests.UnitTests.Chatbot;

public class ChatbotOrchestratorAuthorizationTests
{
    [Fact]
    public async Task ExecuteAsync_WhenGuestRequestsMyBookings_ReturnsLoginRequiredAndSkipsProviderAndLlm()
    {
        var fixture = CreateFixture(
            intent: ChatbotConstants.Intents.GetMyBookings,
            isAuthorized: false,
            userId: Guid.Empty);

        var result = await fixture.Orchestrator.ExecuteAsync(new ChatbotRequestDto
        {
            Message = "Cho tôi xem vé đã mua"
        });

        result.IsSuccess.Should().BeTrue();
        result.Data.Should().NotBeNull();
        result.Data!.Intent.Should().Be(ChatbotConstants.Intents.GetMyBookings);
        result.Data.IsAuthorized.Should().BeFalse();
        result.Data.Response.Should().Be(ChatbotResponseMessages.Refusals.RequireLogin);
        result.Data.ProcessingPath.Should().Be("policyDenied");
        fixture.Registry.Verify(x => x.GetProvider(It.IsAny<string>()), Times.Never);
        fixture.Llm.Verify(x => x.SendChatRequestAsync(
            It.IsAny<string>(),
            It.IsAny<string>(),
            It.IsAny<string>(),
            It.IsAny<string>(),
            It.IsAny<string>()), Times.Never);
    }

    [Fact]
    public async Task ExecuteAsync_WhenCustomerRequestsAuditLogs_ReturnsUnauthorizedAndSkipsProviderAndLlm()
    {
        var fixture = CreateFixture(
            intent: ChatbotConstants.Intents.GetSystemAuditLogs,
            isAuthorized: false,
            userId: Guid.NewGuid());

        var result = await fixture.Orchestrator.ExecuteAsync(new ChatbotRequestDto
        {
            Message = "Cho tôi xem audit log"
        });

        result.IsSuccess.Should().BeTrue();
        result.Data.Should().NotBeNull();
        result.Data!.Intent.Should().Be(ChatbotConstants.Intents.GetSystemAuditLogs);
        result.Data.IsAuthorized.Should().BeFalse();
        result.Data.Response.Should().Be(ChatbotResponseMessages.Refusals.Unauthorized);
        result.Data.ProcessingPath.Should().Be("policyDenied");
        fixture.Registry.Verify(x => x.GetProvider(It.IsAny<string>()), Times.Never);
        fixture.Llm.Verify(x => x.SendChatRequestAsync(
            It.IsAny<string>(),
            It.IsAny<string>(),
            It.IsAny<string>(),
            It.IsAny<string>(),
            It.IsAny<string>()), Times.Never);
    }

    [Fact]
    public async Task ExecuteAsync_WhenPolicyAllowsIntent_ExecutesProviderAndLlm()
    {
        var fixture = CreateFixture(
            intent: ChatbotConstants.Intents.GetMovies,
            isAuthorized: true,
            userId: Guid.Empty);

        var result = await fixture.Orchestrator.ExecuteAsync(new ChatbotRequestDto
        {
            Message = "Hôm nay có phim gì?"
        });

        result.IsSuccess.Should().BeTrue();
        result.Data.Should().NotBeNull();
        result.Data!.Intent.Should().Be(ChatbotConstants.Intents.GetMovies);
        result.Data.IsAuthorized.Should().BeTrue();
        result.Data.Response.Should().Be("Đây là danh sách phim.");
        result.Data.ProcessingPath.Should().Be("llmPath");
        fixture.Registry.Verify(x => x.GetProvider(ChatbotConstants.Intents.GetMovies), Times.Once);
        fixture.Provider.Verify(x => x.ExecuteAsync(It.IsAny<Dictionary<string, string>>()), Times.Once);
        fixture.Llm.Verify(x => x.SendChatRequestAsync(
            It.IsAny<string>(),
            It.Is<string>(value =>
                value.Contains("deterministicContext") &&
                value.Contains("movie-1") &&
                value.Contains("Joker")),
            It.IsAny<string>(),
            It.IsAny<string>(),
            It.IsAny<string>()), Times.Once);
    }

    private static ChatbotFixture CreateFixture(string intent, bool isAuthorized, Guid userId)
    {
        var classifier = new Mock<IChatIntentClassifier>();
        classifier.Setup(x => x.ClassifyIntentAsync(It.IsAny<string>()))
            .ReturnsAsync(new ChatIntentResult
            {
                Intent = intent,
                Parameters = []
            });

        var policy = new Mock<IChatPolicyService>();
        policy.Setup(x => x.IsAuthorizedAsync(intent)).ReturnsAsync(isAuthorized);

        var provider = new Mock<IChatContextProvider>();
        provider.SetupGet(x => x.IntentName).Returns(intent);
        provider.Setup(x => x.ExecuteAsync(It.IsAny<Dictionary<string, string>>()))
            .ReturnsAsync("{\"movies\":[{\"movieId\":\"movie-1\",\"movieName\":\"Joker\"}]}");

        var registry = new Mock<IChatContextProviderRegistry>();
        registry.Setup(x => x.GetProvider(intent)).Returns(provider.Object);

        var llm = new Mock<IChatLlmClient>();
        llm.Setup(x => x.CheckMessageSafetyAsync(It.IsAny<string>()))
            .ReturnsAsync(new ChatGuardResult(false, string.Empty));
        llm.Setup(x => x.SendChatRequestAsync(
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>()))
            .ReturnsAsync("Đây là danh sách phim.");

        var userContext = new Mock<IUserContextService>();
        userContext.Setup(x => x.GetUserId()).Returns(userId);
        userContext.Setup(x => x.GetEmail()).Returns("tester@galaxiad.local");
        userContext.Setup(x => x.GetUserName()).Returns("Tester");
        userContext.Setup(x => x.IsInRole(It.IsAny<string>())).Returns(false);

        return new ChatbotFixture(
            new ChatbotOrchestrator(
                classifier.Object,
                policy.Object,
                registry.Object,
                llm.Object,
                userContext.Object),
            registry,
            provider,
            llm);
    }

    private sealed record ChatbotFixture(
        ChatbotOrchestrator Orchestrator,
        Mock<IChatContextProviderRegistry> Registry,
        Mock<IChatContextProvider> Provider,
        Mock<IChatLlmClient> Llm);
}
