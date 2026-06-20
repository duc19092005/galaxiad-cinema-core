using Microsoft.Extensions.DependencyInjection;
using Cinema.Application.Interfaces.Chatbot;
using Cinema.Application.UseCases.Chatbot;
using Cinema.Application.UseCases.Chatbot.Policy;
using Cinema.Application.UseCases.Chatbot.Registry;
using Cinema.Application.UseCases.Chatbot.Tools;
using Cinema.Infrastructure.Services;

namespace Cinema.Api.Bootstraps.Chatbot;

public static class ChatbotBootstrap
{
    public static IServiceCollection AddChatbotServices(this IServiceCollection services)
    {
        // LLM Client & Intent Classifier
        services.AddScoped<IChatLlmClient, DeepSeekChatLlmClient>();
        services.AddScoped<IChatIntentClassifier, DeepSeekChatIntentClassifier>();

        // Policy Service
        services.AddScoped<IChatPolicyService, ChatPolicyService>();

        // Predefined Chatbot Tools
        services.AddScoped<IChatTool, GetMoviesTool>();
        services.AddScoped<IChatTool, GetShowtimesTool>();
        services.AddScoped<IChatTool, GetMyBookingsTool>();
        services.AddScoped<IChatTool, GetCinemaStatisticsTool>();
        services.AddScoped<IChatTool, GetSystemAuditLogsTool>();

        // Tool Registry
        services.AddScoped<IChatToolRegistry, ChatToolRegistry>();

        // Chatbot Orchestrator
        services.AddScoped<ChatbotOrchestrator>();

        return services;
    }
}
