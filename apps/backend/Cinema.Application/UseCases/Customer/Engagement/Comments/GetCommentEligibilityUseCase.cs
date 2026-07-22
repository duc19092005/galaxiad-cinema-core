using System;
using System.Threading.Tasks;
using Cinema.Application.Dtos;
using Cinema.Application.Dtos.Comments;
using Cinema.Application.Interfaces.Comments;
using Cinema.Application.Interfaces;
using Cinema.Domain.Enums;

namespace Cinema.Application.UseCases.Customer.Engagement.Comments;

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
            return Eligibility(CommentEligibilityStatusEnum.NotLoggedIn, false, "Bạn cần đăng nhập để bình luận.");
        }

        if (!_userContextService.IsInRole("Customer"))
        {
            return Eligibility(CommentEligibilityStatusEnum.NotCustomer, false, "Chỉ khách hàng mới có thể bình luận phim.");
        }

        var paidOrder = await _commentRepository.FindEligibleViewedOrderAsync(userId.Value, movieId);
        var hasPaidTicket = paidOrder != null;
        if (!hasPaidTicket)
        {
            var hasFuturePaidTicket = await _commentRepository.HasFuturePaidTicketAsync(userId.Value, movieId);
            return hasFuturePaidTicket
                ? Eligibility(CommentEligibilityStatusEnum.ShowtimeNotFinished, false, "Bạn có thể bình luận sau khi suất chiếu kết thúc.")
                : Eligibility(CommentEligibilityStatusEnum.NoPaidTicket, false, "Bạn cần mua vé phim này để bình luận.");
        }

        var alreadyReviewed = await _commentRepository.HasAlreadyReviewedAsync(userId.Value, movieId);

        if (alreadyReviewed)
        {
            return Eligibility(CommentEligibilityStatusEnum.AlreadyReviewed, false, "Bạn đã đánh giá phim này rồi.");
        }

        return Eligibility(CommentEligibilityStatusEnum.Allowed, true, "Bạn có thể bình luận phim này.", paidOrder!.OrderId);
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

