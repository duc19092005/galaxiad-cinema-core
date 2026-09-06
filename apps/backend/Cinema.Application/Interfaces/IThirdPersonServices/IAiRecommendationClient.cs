using Cinema.Application.Dtos.Public.Responses;

namespace Cinema.Application.Interfaces.IThirdPersonServices;

public interface IAiRecommendationClient
{
    Task<AiRecommendResponse?> RecommendAsync(AiRecommendRequest request, CancellationToken cancellationToken = default);
    Task<AiRecommendResponse?> RecommendByIdAsync(AiRecommendByIdRequest request, CancellationToken cancellationToken = default);
}
