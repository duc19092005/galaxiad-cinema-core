using System;
using System.Threading.Tasks;
using Cinema.Application.Dtos;
using Cinema.Domain.Entities.MovieInfos;
using Cinema.Application.Interfaces.Comments;
using Cinema.Application.Interfaces;
using Cinema.Domain.Enums;
using Cinema.Application.Exceptions;
using Cinema.Domain.Interfaces.Persistence;
using Cinema.Domain.Localization;
using Cinema.Application.Interfaces.IThirdPersonServices;

namespace Cinema.Application.UseCases.Comments;

public class DeleteOwnCommentUseCase
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMovieCommentRepository _commentRepository;
    private readonly IUserContextService _userContextService;
    private readonly IMovieCacheService _cacheService;

    public DeleteOwnCommentUseCase(
        IUnitOfWork unitOfWork,
        IMovieCommentRepository commentRepository,
        IUserContextService userContextService,
        IMovieCacheService cacheService)
    {
        _unitOfWork = unitOfWork;
        _commentRepository = commentRepository;
        _userContextService = userContextService;
        _cacheService = cacheService;
    }

    public async Task<BaseResponse<bool>> ExecuteAsync(Guid commentId)
    {
        var userId = _userContextService.GetUserId();
        var comment = await _commentRepository.FindCommentAsync(commentId);
        if (comment == null)
        {
            throw new NotFoundException(Messages.Comment.CommentNotFound);
        }

        if (comment.UserId != userId && !_userContextService.IsInRole("Admin"))
        {
            throw new ForbiddenException();
        }

        comment.Status = MovieCommentStatusEnum.Deleted;
        comment.UpdatedAt = DateTime.UtcNow;
        _unitOfWork.Repository<MovieCommentEntity>().Update(comment);
        await _unitOfWork.SaveChangesAsync();

        try
        {
            await _cacheService.ClearMovieDetailCacheAsync(comment.MovieId);
        }
        catch
        {
        }

        return new BaseResponse<bool>
        {
            IsSuccess = true,
            Message = Messages.Comment.CommentDeleted,
            Data = true
        };
    }
}

