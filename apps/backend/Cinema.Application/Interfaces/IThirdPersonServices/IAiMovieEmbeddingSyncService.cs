using System;
using System.Threading;
using System.Threading.Tasks;

namespace Cinema.Application.Interfaces.IThirdPersonServices;

public class AiMovieEmbeddingSyncResultDto
{
    public bool IsSuccess { get; set; }
    public int MovieCount { get; set; }
    public string Message { get; set; } = string.Empty;
}

public interface IAiMovieEmbeddingSyncService
{
    Task<AiMovieEmbeddingSyncResultDto> EnsureMoviesSyncedAsync(CancellationToken cancellationToken = default);
    Task<AiMovieEmbeddingSyncResultDto> SyncAllActiveMoviesAsync(CancellationToken cancellationToken = default);
    Task<AiMovieEmbeddingSyncResultDto> SyncMovieAsync(Guid movieId, CancellationToken cancellationToken = default);
    Task<AiMovieEmbeddingSyncResultDto> DeleteMovieAsync(Guid movieId, CancellationToken cancellationToken = default);
}
