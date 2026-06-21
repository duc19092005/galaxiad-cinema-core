using System;
using System.Threading.Tasks;
using Cinema.Application.Dtos;
using Cinema.Application.Dtos.Comments;
using Cinema.Application.Interfaces.Comments;
using Cinema.Application.Interfaces;
using Cinema.Domain.Enums;

namespace Cinema.Application.UseCases.Comments;

public class GetCommentEligibilityUseCase
{
    private readonly IMovieCommentRepository _commentRepository;
    private readonly IUserContextService _userContextService;

    public GetCommentEligibilityUseCase(IMovieCommentRepository commentRepository, IUserContextService userContextService)
    {
        _commentRepository = commentRepository;
        _userContextService = userContextService;
    }

    public async Task<BaseResponse<ResCommentEligibilityDto>> ExecuteAsync(Guid movieId)
    {
        var userId = _userContextService.TryGetUserId();
        if (userId == null)
        {
            return Eligibility(CommentEligibilityStatusEnum.NotLoggedIn, false, "Ban can dang nhap de binh luan.");
        }

        if (!_userContextService.IsInRole("Customer"))
        {
            return Eligibility(CommentEligibilityStatusEnum.NotCustomer, false, "Chi khach hang moi co the binh luan phim.");
        }

        var paidOrder = await _commentRepository.FindEligibleViewedOrderAsync(userId.Value, movieId);
        var hasPaidTicket = paidOrder != null;
        if (!hasPaidTicket)
        {
            var hasFuturePaidTicket = await _commentRepository.HasFuturePaidTicketAsync(userId.Value, movieId);
            return hasFuturePaidTicket
                ? Eligibility(CommentEligibilityStatusEnum.ShowtimeNotFinished, false, "Ban co the binh luan sau khi suat chieu ket thuc.")
                : Eligibility(CommentEligibilityStatusEnum.NoPaidTicket, false, "Ban can mua ve phim nay de binh luan.");
        }

        var alreadyReviewed = await _commentRepository.HasAlreadyReviewedAsync(userId.Value, movieId);

        if (alreadyReviewed)
        {
            return Eligibility(CommentEligibilityStatusEnum.AlreadyReviewed, false, "Ban da danh gia phim nay roi.");
        }

        return Eligibility(CommentEligibilityStatusEnum.Allowed, true, "Ban co the binh luan phim nay.", paidOrder!.OrderId);
    }

    private static BaseResponse<ResCommentEligibilityDto> Eligibility(
        CommentEligibilityStatusEnum status,
        bool canComment,
        string message,
        Guid? orderId = null)
    {
        return new BaseResponse<ResCommentEligibilityDto>
        {
            IsSuccess = true,
            Message = message,
            Data = new ResCommentEligibilityDto
            {
                Status = status,
                CanComment = canComment,
                Message = message,
                OrderId = orderId
            }
        };
    }
}

