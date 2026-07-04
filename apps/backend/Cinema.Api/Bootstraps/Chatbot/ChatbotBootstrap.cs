using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Cinema.Application.Interfaces.Chatbot;
using Cinema.Application.UseCases.Chatbot;
using Cinema.Infrastructure.Chatbot.Policy;
using Cinema.Infrastructure.Chatbot.Registry;
using Cinema.Infrastructure.Chatbot.ContextProviders;
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

        // Predefined Chatbot Context Providers (original)
        services.AddScoped<IChatContextProvider, GetMoviesContextProvider>();
        services.AddScoped<IChatContextProvider, GetShowtimesContextProvider>();
        services.AddScoped<IChatContextProvider, GetMyBookingsContextProvider>();
        services.AddScoped<IChatContextProvider, GetCinemaStatisticsContextProvider>();
        services.AddScoped<IChatContextProvider, GetShowtimeRecommendationsContextProvider>();
        services.AddScoped<IChatContextProvider, GetSystemAuditLogsContextProvider>();

        // Additional context providers
        services.AddScoped<IChatContextProvider, GetPromotionsContextProvider>();
        services.AddScoped<IChatContextProvider, GetBookingStatusContextProvider>();
        services.AddScoped<IChatContextProvider, GetCinemaLocationsContextProvider>();
        services.AddScoped<IChatContextProvider, GetAvailableSeatsContextProvider>();
        services.AddScoped<IChatContextProvider, SearchMoviesSemanticContextProvider>();
        services.AddScoped<IChatContextProvider, GetTrendingMoviesContextProvider>();

        // AI Semantic Search Client (for SearchMoviesSemanticContextProvider → Python /recommend)
        services.AddScoped<IAiSemanticSearchClient, AiSemanticSearchClient>();

        // Context Provider Registry
        services.AddScoped<IChatContextProviderRegistry, ChatContextProviderRegistry>();

        // Chatbot Orchestrator
        services.AddScoped<ChatbotOrchestrator>();

        return services;
    }
}
