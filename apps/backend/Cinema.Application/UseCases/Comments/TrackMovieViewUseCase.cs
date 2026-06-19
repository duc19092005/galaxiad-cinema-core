using System;
using System.Threading.Tasks;
using Cinema.Domain.Entities.MovieInfos;
using Cinema.Application.Interfaces.Comments;
using Cinema.Application.Interfaces;
using Cinema.Domain.Interfaces.Persistence;

namespace Cinema.Application.UseCases.Comments;

public class TrackMovieViewUseCase
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMovieCommentRepository _commentRepository;
    private readonly IUserContextService _userContextService;

    public TrackMovieViewUseCase(
        IUnitOfWork unitOfWork,
        IMovieCommentRepository commentRepository,
        IUserContextService userContextService)
    {
        _unitOfWork = unitOfWork;
        _commentRepository = commentRepository;
        _userContextService = userContextService;
    }

    public async Task ExecuteAsync(Guid movieId)
    {
        var exists = await _commentRepository.MovieExistsAsync(movieId);
        if (!exists)
        {
            return;
        }

        await _unitOfWork.Repository<MovieViewEntity>().AddAsync(new MovieViewEntity
        {
            MovieViewId = Guid.NewGuid(),
            MovieId = movieId,
            UserId = _userContextService.TryGetUserId(),
            ViewedAt = DateTime.UtcNow
        });
        await _unitOfWork.SaveChangesAsync();
    }
}
