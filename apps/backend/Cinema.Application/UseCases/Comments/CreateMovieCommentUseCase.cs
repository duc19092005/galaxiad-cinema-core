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

namespace Cinema.Application.UseCases.Comments;

public class CreateMovieCommentUseCase
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMovieCommentRepository _commentRepository;
    private readonly IUserContextService _userContextService;

    public CreateMovieCommentUseCase(
        IUnitOfWork unitOfWork,
        IMovieCommentRepository commentRepository,
        IUserContextService userContextService)
    {
        _unitOfWork = unitOfWork;
        _commentRepository = commentRepository;
        _userContextService = userContextService;
    }

    public async Task<BaseResponse<ResMovieCommentDto>> ExecuteAsync(Guid movieId, ReqCreateMovieCommentDto request)
    {
        var userId = _userContextService.GetUserId();
        if (!_userContextService.IsInRole("Customer"))
        {
            throw new ForbiddenException();
        }

        var order = await _commentRepository.FindEligibleViewedOrderAsync(userId, movieId);
        if (order == null)
        {
            if (await _commentRepository.HasFuturePaidTicketAsync(userId, movieId))
            {
                throw new BadRequestException("Ban co the binh luan sau khi suat chieu ket thuc.", "CommentShowtimeNotFinished");
            }

            throw new BadRequestException("Ban can mua ve phim nay de binh luan.", "CommentNoPaidTicket");
        }

        var alreadyReviewed = await _commentRepository.HasAlreadyReviewedAsync(userId, movieId);
        if (alreadyReviewed)
        {
            throw new BadRequestException("Ban da danh gia phim nay roi.", "CommentAlreadyReviewed");
        }

        var comment = new MovieCommentEntity
        {
            CommentId = Guid.NewGuid(),
            MovieId = movieId,
            UserId = userId,
            OrderId = order.OrderId,
            Rating = request.Rating,
            Content = request.Content.Trim(),
            Status = MovieCommentStatusEnum.PendingModeration,
            CreatedAt = DateTime.UtcNow
        };

        await _unitOfWork.Repository<MovieCommentEntity>().AddAsync(comment);
        await _unitOfWork.SaveChangesAsync();

        var saved = await _commentRepository.GetCommentWithUserAndMovieAsync(comment.CommentId);
        if (saved == null)
        {
            throw new NotFoundException("Loi khi luu binh luan.");
        }

        return new BaseResponse<ResMovieCommentDto>
        {
            IsSuccess = true,
            Message = "Binh luan dang duoc kiem duyet.",
            Data = MovieCommentHelper.MapComment(saved)
        };
    }
}
