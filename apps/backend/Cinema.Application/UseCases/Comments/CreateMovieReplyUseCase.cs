using System;
using System.Threading.Tasks;
using Cinema.Application.Dtos;
using Cinema.Application.Dtos.Comments;
using Cinema.Domain.Entities.MovieInfos;
using Cinema.Application.Interfaces.Comments;
using Cinema.Application.Interfaces;
using Cinema.Domain.Enums;
using Cinema.Domain.Exceptions;
using Cinema.Domain.Interfaces.Persistence;

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
            throw new NotFoundException("Khong tim thay binh luan cha.");
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
                throw new BadRequestException("Ban co the binh luan sau khi suat chieu ket thuc.", "CommentShowtimeNotFinished");
            }

            throw new BadRequestException("Ban can mua ve phim nay de binh luan.", "CommentNoPaidTicket");
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
            throw new NotFoundException("Loi khi luu phan hoi.");
        }

        return new BaseResponse<ResMovieCommentDto>
        {
            IsSuccess = true,
            Message = "Phan hoi dang duoc kiem duyet.",
            Data = MovieCommentHelper.MapComment(saved)
        };
    }
}
