using System;
using System.Threading.Tasks;
using Cinema.Application.Dtos;
using Cinema.Application.Dtos.Comments;
using Cinema.Domain.Entities.MovieInfos;
using Cinema.Application.Interfaces.Comments;
using Cinema.Application.Interfaces;
using Cinema.Domain.Enums;
using Cinema.Application.Exceptions;
using Cinema.Domain.Interfaces.Persistence;
using Cinema.Domain.Localization;

namespace Cinema.Application.UseCases.Comments;

public class CreateMovieReplyUseCase
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMovieCommentRepository _commentRepository;
    private readonly IUserContextService _userContextService;

    public CreateMovieReplyUseCase(
        IUnitOfWork unitOfWork,
        IMovieCommentRepository commentRepository,
        IUserContextService userContextService)
    {
        _unitOfWork = unitOfWork;
        _commentRepository = commentRepository;
        _userContextService = userContextService;
    }

    public async Task<BaseResponse<ResMovieCommentDto>> ExecuteAsync(Guid parentCommentId, ReqCreateMovieReplyDto request)
    {
        var parent = await _commentRepository.GetCommentWithUserAndMovieAsync(parentCommentId);
        if (parent == null || parent.Status != MovieCommentStatusEnum.Visible)
        {
            throw new NotFoundException(Messages.Comment.ParentCommentNotFound);
        }

        var userId = _userContextService.GetUserId();
        if (!_userContextService.IsInRole("Customer"))
        {
            throw new ForbiddenException();
        }

        var order = await _commentRepository.FindEligibleViewedOrderAsync(userId, parent.MovieId);
        if (order == null)
        {
            if (await _commentRepository.HasFuturePaidTicketAsync(userId, parent.MovieId))
            {
                throw new BadRequestException(Messages.Comment.ShowtimeNotFinished, "CommentShowtimeNotFinished");
            }

            throw new BadRequestException(Messages.Comment.NoPaidTicket, "CommentNoPaidTicket");
        }

        var reply = new MovieCommentEntity
        {
            CommentId = Guid.NewGuid(),
            MovieId = parent.MovieId,
            UserId = userId,
            OrderId = order.OrderId,
            ParentCommentId = parentCommentId,
            Content = request.Content.Trim(),
            Status = MovieCommentStatusEnum.PendingModeration,
            CreatedAt = DateTime.UtcNow
        };

        await _unitOfWork.Repository<MovieCommentEntity>().AddAsync(reply);
        await _unitOfWork.SaveChangesAsync();

        var saved = await _commentRepository.GetCommentWithUserAndMovieAsync(reply.CommentId);
        if (saved == null)
        {
            throw new NotFoundException(Messages.Comment.ReplySaveFailed);
        }

        return new BaseResponse<ResMovieCommentDto>
        {
            IsSuccess = true,
            Message = Messages.Comment.ReplyUnderModeration,
            Data = MovieCommentHelper.MapComment(saved)
        };
    }
}

