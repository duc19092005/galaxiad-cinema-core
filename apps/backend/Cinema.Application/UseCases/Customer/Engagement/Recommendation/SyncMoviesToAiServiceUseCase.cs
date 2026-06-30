using System.Threading;
using System.Threading.Tasks;
using Cinema.Application.Dtos;
using Cinema.Application.Interfaces.IThirdPersonServices;

namespace Cinema.Application.UseCases.Customer.Engagement.Recommendation;

public class SyncMoviesToAiServiceUseCase
{
    private readonly IAiMovieEmbeddingSyncService _aiMovieEmbeddingSyncService;

    public SyncMoviesToAiServiceUseCase(IAiMovieEmbeddingSyncService aiMovieEmbeddingSyncService)
    {
        _aiMovieEmbeddingSyncService = aiMovieEmbeddingSyncService;
    }

    public async Task<BaseResponse<object>> ExecuteAsync(CancellationToken cancellationToken)
    {
        var result = await _aiMovieEmbeddingSyncService.SyncAllActiveMoviesAsync(cancellationToken);

        return new BaseResponse<object>
        {
            IsSuccess = result.IsSuccess,
            Data = null,
            Message = result.IsSuccess ? $"Synced {result.MovieCount} movies" : "Sync failed"
        };
    }
}

