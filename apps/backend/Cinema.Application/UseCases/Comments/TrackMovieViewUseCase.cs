using System;
using System.Threading.Tasks;
using Cinema.Application.Interfaces.Comments;
using Cinema.Application.Interfaces;

namespace Cinema.Application.UseCases.Comments;

public class TrackMovieViewUseCase
{
    private readonly IMovieViewBuffer _movieViewBuffer;
    private readonly IUserContextService _userContextService;

    public TrackMovieViewUseCase(
        IMovieViewBuffer movieViewBuffer,
        IUserContextService userContextService)
    {
        _movieViewBuffer = movieViewBuffer;
        _userContextService = userContextService;
    }

    public async Task ExecuteAsync(Guid movieId)
    {
        var userId = _userContextService.TryGetUserId();
        await _movieViewBuffer.QueueMovieViewAsync(movieId, userId, DateTime.UtcNow);
    }
}
