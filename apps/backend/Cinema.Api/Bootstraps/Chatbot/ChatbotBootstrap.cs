using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Cinema.Application.Interfaces.Chatbot;
using Cinema.Application.UseCases.Chatbot;
using Cinema.Infrastructure.Chatbot.Policy;
using Cinema.Infrastructure.Chatbot.Registry;
using Cinema.Infrastructure.Chatbot.Tools;
using Cinema.Infrastructure.ExternalServices.Ai;
using Grpc.Net.Client;
using Aiservice;

namespace Cinema.Api.Bootstraps.Chatbot;

public static class ChatbotBootstrap
{
    public static IServiceCollection AddChatbotServices(this IServiceCollection services)
    {
        // gRPC channel (singleton) and client (scoped)
        services.AddSingleton<GrpcChannel>(sp =>
        {
            var config = sp.GetRequiredService<IConfiguration>();
            var grpcUrl = config["AiService:GrpcUrl"] ?? "http://cinema-ai-service:50051";
            return GrpcChannel.ForAddress(grpcUrl);
        });
        services.AddScoped<AiService.AiServiceClient>(sp =>
        {
            var channel = sp.GetRequiredService<GrpcChannel>();
            return new AiService.AiServiceClient(channel);
        });

        // LLM Client & Intent Classifier
        services.AddScoped<IChatLlmClient, DeepSeekChatLlmClient>();
        services.AddScoped<IChatIntentClassifier, DeepSeekChatIntentClassifier>();

        // Policy Service
        services.AddScoped<IChatPolicyService, ChatPolicyService>();

        // Predefined Chatbot Tools (original)
        services.AddScoped<IChatTool, GetMoviesTool>();
        services.AddScoped<IChatTool, GetShowtimesTool>();
        services.AddScoped<IChatTool, GetMyBookingsTool>();
        services.AddScoped<IChatTool, GetCinemaStatisticsTool>();
        services.AddScoped<IChatTool, GetShowtimeRecommendationsTool>();
        services.AddScoped<IChatTool, GetSystemAuditLogsTool>();

        // New tools
        services.AddScoped<IChatTool, GetPromotionsTool>();
        services.AddScoped<IChatTool, GetBookingStatusTool>();
        services.AddScoped<IChatTool, GetCinemaLocationsTool>();
        services.AddScoped<IChatTool, GetAvailableSeatsTool>();
        services.AddScoped<IChatTool, SearchMoviesSemanticTool>();
        services.AddScoped<IChatTool, GetTrendingMoviesTool>();

        // AI Semantic Search Client (for SearchMoviesSemanticTool → Python /recommend)
        services.AddScoped<IAiSemanticSearchClient, AiSemanticSearchClient>();

        // Tool Registry
        services.AddScoped<IChatToolRegistry, ChatToolRegistry>();

        // Chatbot Orchestrator
        services.AddScoped<ChatbotOrchestrator>();

        return services;
    }
}
