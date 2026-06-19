using System;
using System.Threading.Tasks;
using Cinema.Application.Dtos;
using Cinema.Domain.Entities.MovieInfos;
using Cinema.Application.Interfaces.Comments;
using Cinema.Application.Interfaces;
using Cinema.Domain.Enums;
using Cinema.Domain.Exceptions;
using Cinema.Domain.Interfaces.Persistence;

namespace Cinema.Application.UseCases.Comments;

public class DeleteOwnCommentUseCase
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMovieCommentRepository _commentRepository;
    private readonly IUserContextService _userContextService;

    public DeleteOwnCommentUseCase(
        IUnitOfWork unitOfWork,
        IMovieCommentRepository commentRepository,
        IUserContextService userContextService)
    {
        _unitOfWork = unitOfWork;
        _commentRepository = commentRepository;
        _userContextService = userContextService;
    }

    public async Task<BaseResponse<bool>> ExecuteAsync(Guid commentId)
    {
        var userId = _userContextService.GetUserId();
        var comment = await _commentRepository.FindCommentAsync(commentId);
        if (comment == null)
        {
            throw new NotFoundException("Khong tim thay binh luan.");
        }

        if (comment.UserId != userId && !_userContextService.IsInRole("Admin"))
        {
            throw new ForbiddenException();
        }

        comment.Status = MovieCommentStatusEnum.Deleted;
        comment.UpdatedAt = DateTime.UtcNow;
        _unitOfWork.Repository<MovieCommentEntity>().Update(comment);
        await _unitOfWork.SaveChangesAsync();

        return new BaseResponse<bool>
        {
            IsSuccess = true,
            Message = "Da xoa binh luan.",
            Data = true
        };
    }
}
