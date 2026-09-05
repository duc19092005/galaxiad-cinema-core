using Cinema.Application.Constants;
using Cinema.Application.Dtos.Chatbot;
using Cinema.Application.Interfaces;
using Cinema.Application.Interfaces.Chatbot;
using Cinema.Application.UseCases.Chatbot;
using Cinema.Domain.Constants;
using FluentAssertions;
using Moq;
using Xunit;

namespace Cinema.Tests.Unit.Chatbot;

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

    private static Fixture CreateFixture(string intent, bool isAuthorized, Guid userId)
    {
        var classifier = new Mock<IChatIntentClassifier>();
        var userContext = new Mock<IUserContextService>();
        var policy = new Mock<IChatPolicyService>();
        var registry = new Mock<IChatContextProviderRegistry>();
        var llm = new Mock<IChatLlmClient>();
        llm.Setup(x => x.CheckMessageSafetyAsync(It.IsAny<string>()))
            .ReturnsAsync(new ChatGuardResult(false, string.Empty));

        classifier.Setup(x => x.ClassifyIntentAsync(It.IsAny<string>()))
            .ReturnsAsync(new ChatIntentResult
            {
                Intent = intent,
                Parameters = new Dictionary<string, string>()
            });

        userContext.Setup(x => x.GetUserId()).Returns(userId);
        userContext.Setup(x => x.IsInRole(It.IsAny<string>())).Returns((string r) => r == "Customer");
        policy.Setup(x => x.IsAuthorizedAsync(intent)).ReturnsAsync(isAuthorized);

        var orchestrator = new ChatbotOrchestrator(
            classifier.Object,
            policy.Object,
            registry.Object,
            llm.Object,
            userContext.Object);

        return new Fixture(orchestrator, registry, llm);
    }

    private record Fixture(
        ChatbotOrchestrator Orchestrator,
        Mock<IChatContextProviderRegistry> Registry,
        Mock<IChatLlmClient> Llm);
}
