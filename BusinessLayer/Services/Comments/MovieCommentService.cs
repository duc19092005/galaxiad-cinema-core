using BusinessLayer.Dtos;
using BusinessLayer.Dtos.Comments;
using BusinessLayer.Entities.MovieInfos;
using BusinessLayer.Entities.UserInfos;
using BusinessLayer.Interfaces.IThirdPersonServices;
using BusinessLayer.Services.IdentityAccess;
using Microsoft.EntityFrameworkCore;
using Shared.Enums;
using Shared.Exceptions;
using Shared.Interfaces.Persistence;

namespace BusinessLayer.Services.Comments;

public class MovieCommentService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IUserContextService _userContextService;
    private readonly DeepSeekModerationService _moderationService;
    private readonly ISseNotificationService _sseNotificationService;

    public MovieCommentService(
        IUnitOfWork unitOfWork,
        IUserContextService userContextService,
        DeepSeekModerationService moderationService,
        ISseNotificationService sseNotificationService)
    {
        _unitOfWork = unitOfWork;
        _userContextService = userContextService;
        _moderationService = moderationService;
        _sseNotificationService = sseNotificationService;
    }

    public async Task<BaseResponse<ResMovieCommentsSummaryDto>> GetMovieComments(Guid movieId)
    {
        var comments = await _unitOfWork.Repository<MovieCommentEntity>().Query()
            .Where(x => x.MovieId == movieId && x.Status == MovieCommentStatusEnum.Visible)
            .Include(x => x.UserInfoEntity)
            .OrderByDescending(x => x.CreatedAt)
            .AsNoTracking()
            .ToListAsync();

        var rootComments = comments
            .Where(x => x.ParentCommentId == null)
            .OrderByDescending(x => x.CreatedAt)
            .Select(x => MapCommentTree(x, comments))
            .ToList();

        var rootReviews = comments.Where(x => x.ParentCommentId == null && x.Rating.HasValue).ToList();

        return new BaseResponse<ResMovieCommentsSummaryDto>
        {
            IsSuccess = true,
            Message = "Lay danh sach binh luan thanh cong.",
            Data = new ResMovieCommentsSummaryDto
            {
                AverageRating = rootReviews.Count == 0 ? 0 : Math.Round(rootReviews.Average(x => x.Rating!.Value), 1),
                ReviewCount = rootReviews.Count,
                Comments = rootComments
            }
        };
    }

    public async Task<BaseResponse<ResCommentEligibilityDto>> GetEligibility(Guid movieId)
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

        var paidOrder = await FindEligibleViewedOrder(userId.Value, movieId);
        var hasPaidTicket = paidOrder != null;
        if (!hasPaidTicket)
        {
            var hasFuturePaidTicket = await HasFuturePaidTicket(userId.Value, movieId);
            return hasFuturePaidTicket
                ? Eligibility(CommentEligibilityStatusEnum.ShowtimeNotFinished, false, "Ban co the binh luan sau khi suat chieu ket thuc.")
                : Eligibility(CommentEligibilityStatusEnum.NoPaidTicket, false, "Ban can mua ve phim nay de binh luan.");
        }

        var alreadyReviewed = await _unitOfWork.Repository<MovieCommentEntity>().Query()
            .AnyAsync(x => x.MovieId == movieId
                           && x.UserId == userId.Value
                           && x.ParentCommentId == null
                           && x.Status != MovieCommentStatusEnum.Deleted
                           && x.Status != MovieCommentStatusEnum.Rejected);

        if (alreadyReviewed)
        {
            return Eligibility(CommentEligibilityStatusEnum.AlreadyReviewed, false, "Ban da danh gia phim nay roi.");
        }

        return Eligibility(CommentEligibilityStatusEnum.Allowed, true, "Ban co the binh luan phim nay.", paidOrder!.OrderId);
    }

    public async Task<BaseResponse<ResMovieCommentDto>> CreateComment(Guid movieId, ReqCreateMovieCommentDto request)
    {
        var validation = await ValidateCustomerCanComment(movieId, requireNoRootReview: true);

        var comment = new MovieCommentEntity
        {
            CommentId = Guid.NewGuid(),
            MovieId = movieId,
            UserId = validation.UserId,
            OrderId = validation.OrderId,
            Rating = request.Rating,
            Content = request.Content.Trim(),
            Status = MovieCommentStatusEnum.PendingModeration,
            CreatedAt = DateTime.UtcNow
        };

        await _unitOfWork.Repository<MovieCommentEntity>().AddAsync(comment);
        await _unitOfWork.SaveChangesAsync();

        var saved = await LoadComment(comment.CommentId);
        return new BaseResponse<ResMovieCommentDto>
        {
            IsSuccess = true,
            Message = "Binh luan dang duoc kiem duyet.",
            Data = MapComment(saved)
        };
    }

    public async Task<BaseResponse<ResMovieCommentDto>> CreateReply(Guid parentCommentId, ReqCreateMovieReplyDto request)
    {
        var parent = await _unitOfWork.Repository<MovieCommentEntity>().Query()
            .Include(x => x.UserInfoEntity)
            .FirstOrDefaultAsync(x => x.CommentId == parentCommentId && x.Status == MovieCommentStatusEnum.Visible);

        if (parent == null)
        {
            throw new NotFoundException("Khong tim thay binh luan cha.");
        }

        var validation = await ValidateCustomerCanComment(parent.MovieId, requireNoRootReview: false);

        var reply = new MovieCommentEntity
        {
            CommentId = Guid.NewGuid(),
            MovieId = parent.MovieId,
            UserId = validation.UserId,
            OrderId = validation.OrderId,
            ParentCommentId = parentCommentId,
            Content = request.Content.Trim(),
            Status = MovieCommentStatusEnum.PendingModeration,
            CreatedAt = DateTime.UtcNow
        };

        await _unitOfWork.Repository<MovieCommentEntity>().AddAsync(reply);
        await _unitOfWork.SaveChangesAsync();

        var saved = await LoadComment(reply.CommentId);
        return new BaseResponse<ResMovieCommentDto>
        {
            IsSuccess = true,
            Message = "Phan hoi dang duoc kiem duyet.",
            Data = MapComment(saved)
        };
    }

    public async Task ModerateCommentAsync(Guid commentId)
    {
        var comment = await _unitOfWork.Repository<MovieCommentEntity>().Query()
            .Include(x => x.UserInfoEntity)
            .Include(x => x.MovieInfoEntity)
            .Include(x => x.ParentComment)
            .FirstOrDefaultAsync(x => x.CommentId == commentId);

        if (comment == null || comment.Status != MovieCommentStatusEnum.PendingModeration)
        {
            return;
        }

        var moderation = await _moderationService.ModerateAsync(comment.Content);
        if (moderation.Blocked)
        {
            comment.Status = MovieCommentStatusEnum.Rejected;
            comment.ModerationReason = moderation.Reason;
            comment.UpdatedAt = DateTime.UtcNow;
            _unitOfWork.Repository<MovieCommentEntity>().Update(comment);

            await CreateNotification(
                comment.UserId,
                "Binh luan da bi go",
                moderation.Reason,
                "CommentRejected",
                comment.CommentId,
                comment.MovieId);

            await _unitOfWork.SaveChangesAsync();
            await _sseNotificationService.SendNotificationAsync(comment.UserId, "Binh luan da bi go", moderation.Reason, "CommentRejected");
            return;
        }

        comment.Status = MovieCommentStatusEnum.Visible;
        comment.UpdatedAt = DateTime.UtcNow;
        _unitOfWork.Repository<MovieCommentEntity>().Update(comment);

        if (comment.ParentCommentId.HasValue && comment.ParentComment != null && comment.ParentComment.UserId != comment.UserId)
        {
            var movieName = comment.MovieInfoEntity?.MovieName ?? "phim";
            await CreateNotification(
                comment.ParentComment.UserId,
                "Co nguoi phan hoi binh luan cua ban",
                $"{comment.UserInfoEntity.UserName} da phan hoi binh luan cua ban ve {movieName}.",
                "CommentReply",
                comment.CommentId,
                comment.MovieId);
        }

        await _unitOfWork.SaveChangesAsync();

        if (comment.ParentCommentId.HasValue && comment.ParentComment != null && comment.ParentComment.UserId != comment.UserId)
        {
            await _sseNotificationService.SendNotificationAsync(
                comment.ParentComment.UserId,
                "Co nguoi phan hoi binh luan cua ban",
                $"{comment.UserInfoEntity.UserName} da phan hoi binh luan cua ban.",
                "CommentReply");
        }
    }

    public async Task<BaseResponse<bool>> DeleteOwnComment(Guid commentId)
    {
        var userId = _userContextService.GetUserId();
        var comment = await _unitOfWork.Repository<MovieCommentEntity>().FindAsync(commentId);
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

    public async Task<BaseResponse<List<ResUserNotificationDto>>> GetMyNotifications()
    {
        var userId = _userContextService.GetUserId();
        var notifications = await _unitOfWork.Repository<UserNotificationEntity>().Query()
            .Where(x => x.UserId == userId)
            .OrderByDescending(x => x.CreatedAt)
            .Take(50)
            .Select(x => new ResUserNotificationDto
            {
                NotificationId = x.NotificationId,
                Title = x.Title,
                Message = x.Message,
                Type = x.Type,
                RelatedCommentId = x.RelatedCommentId,
                RelatedMovieId = x.RelatedMovieId,
                IsRead = x.IsRead,
                CreatedAt = x.CreatedAt
            })
            .AsNoTracking()
            .ToListAsync();

        return new BaseResponse<List<ResUserNotificationDto>>
        {
            IsSuccess = true,
            Message = "Lay thong bao thanh cong.",
            Data = notifications
        };
    }

    public async Task<BaseResponse<bool>> MarkNotificationAsRead(Guid notificationId)
    {
        var userId = _userContextService.GetUserId();
        var notification = await _unitOfWork.Repository<UserNotificationEntity>().Query()
            .FirstOrDefaultAsync(x => x.NotificationId == notificationId && x.UserId == userId);

        if (notification == null)
        {
            throw new NotFoundException("Khong tim thay thong bao.");
        }

        notification.IsRead = true;
        _unitOfWork.Repository<UserNotificationEntity>().Update(notification);
        await _unitOfWork.SaveChangesAsync();

        return new BaseResponse<bool>
        {
            IsSuccess = true,
            Message = "Da doc thong bao.",
            Data = true
        };
    }

    public async Task<BaseResponse<List<ResTrendingMovieDto>>> GetTrendingMovies(int days = 30, int take = 10)
    {
        days = Math.Clamp(days, 1, 365);
        take = Math.Clamp(take, 1, 30);
        var from = DateTime.UtcNow.AddDays(-days);

        var movies = await _unitOfWork.Repository<MovieInfoEntity>().Query()
            .Where(x => !x.IsDeleted && x.IsActive)
            .Select(x => new ResTrendingMovieDto
            {
                MovieId = x.MovieId,
                MovieName = x.MovieName,
                MovieImageUrl = x.MovieImageUrl,
                MovieDescription = x.MovieDescription,
                MovieDuration = x.MovieDuration,
                MovieRequiredAgeSymbol = x.MovieRequiredAgeEntity.MovieRequiredAgeSymbol.Trim()
            })
            .AsNoTracking()
            .ToListAsync();

        var paidTicketCounts = await _unitOfWork.Repository<OrderDetailsInfo>().Query()
            .Where(x => x.OrderInfoEntity.OrderDate >= from
                        && (x.OrderInfoEntity.OrderStatus == OrderStatusEnum.Booked
                            || x.OrderInfoEntity.OrderStatus == OrderStatusEnum.Completed))
            .GroupBy(x => x.MovieScheduleInfoEntity.MovieId)
            .Select(x => new { MovieId = x.Key, Count = x.Count() })
            .ToDictionaryAsync(x => x.MovieId, x => x.Count);

        var viewCounts = await _unitOfWork.Repository<MovieViewEntity>().Query()
            .Where(x => x.ViewedAt >= from)
            .GroupBy(x => x.MovieId)
            .Select(x => new { MovieId = x.Key, Count = x.Count() })
            .ToDictionaryAsync(x => x.MovieId, x => x.Count);

        var ratingAverages = await _unitOfWork.Repository<MovieCommentEntity>().Query()
            .Where(x => x.ParentCommentId == null
                        && x.Rating.HasValue
                        && x.Status == MovieCommentStatusEnum.Visible)
            .GroupBy(x => x.MovieId)
            .Select(x => new { MovieId = x.Key, Average = x.Average(c => c.Rating!.Value) })
            .ToDictionaryAsync(x => x.MovieId, x => Math.Round(x.Average, 1));

        var result = movies
            .Select(movie =>
            {
                movie.PaidTicketCount = paidTicketCounts.GetValueOrDefault(movie.MovieId);
                movie.ViewCount = viewCounts.GetValueOrDefault(movie.MovieId);
                movie.AverageRating = ratingAverages.GetValueOrDefault(movie.MovieId);
                movie.TrendingScore = Math.Round(movie.PaidTicketCount * 3 + movie.ViewCount + movie.AverageRating * 10, 1);
                return movie;
            })
            .Where(x => x.TrendingScore > 0)
            .OrderByDescending(x => x.TrendingScore)
            .ThenByDescending(x => x.PaidTicketCount)
            .Take(take)
            .ToList();

        return new BaseResponse<List<ResTrendingMovieDto>>
        {
            IsSuccess = true,
            Message = "Lay phim thinh hanh thanh cong.",
            Data = result
        };
    }

    public async Task TrackMovieView(Guid movieId)
    {
        var exists = await _unitOfWork.Repository<MovieInfoEntity>().Query()
            .AnyAsync(x => x.MovieId == movieId && !x.IsDeleted);

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

    private async Task<(Guid UserId, Guid OrderId)> ValidateCustomerCanComment(Guid movieId, bool requireNoRootReview)
    {
        var userId = _userContextService.GetUserId();
        if (!_userContextService.IsInRole("Customer"))
        {
            throw new ForbiddenException();
        }

        var order = await FindEligibleViewedOrder(userId, movieId);
        if (order == null)
        {
            if (await HasFuturePaidTicket(userId, movieId))
            {
                throw new BadRequestException("Ban co the binh luan sau khi suat chieu ket thuc.", "CommentShowtimeNotFinished");
            }

            throw new BadRequestException("Ban can mua ve phim nay de binh luan.", "CommentNoPaidTicket");
        }

        if (requireNoRootReview)
        {
            var alreadyReviewed = await _unitOfWork.Repository<MovieCommentEntity>().Query()
                .AnyAsync(x => x.MovieId == movieId
                               && x.UserId == userId
                               && x.ParentCommentId == null
                               && x.Status != MovieCommentStatusEnum.Deleted
                               && x.Status != MovieCommentStatusEnum.Rejected);

            if (alreadyReviewed)
            {
                throw new BadRequestException("Ban da danh gia phim nay roi.", "CommentAlreadyReviewed");
            }
        }

        return (userId, order.OrderId);
    }

    private async Task<OrderInfoEntity?> FindEligibleViewedOrder(Guid userId, Guid movieId)
    {
        var now = DateTime.Now;
        return await _unitOfWork.Repository<OrderInfoEntity>().Query()
            .Include(x => x.OrderDetailsInfo)
            .ThenInclude(x => x.MovieScheduleInfoEntity)
            .Where(x => x.UserId == userId
                        && (x.OrderStatus == OrderStatusEnum.Booked || x.OrderStatus == OrderStatusEnum.Completed)
                        && x.OrderDetailsInfo.Any(d => d.MovieScheduleInfoEntity.MovieId == movieId
                                                       && d.MovieScheduleInfoEntity.EndedTime <= now))
            .OrderByDescending(x => x.OrderDate)
            .FirstOrDefaultAsync();
    }

    private async Task<bool> HasFuturePaidTicket(Guid userId, Guid movieId)
    {
        var now = DateTime.Now;
        return await _unitOfWork.Repository<OrderInfoEntity>().Query()
            .AnyAsync(x => x.UserId == userId
                           && (x.OrderStatus == OrderStatusEnum.Booked || x.OrderStatus == OrderStatusEnum.Completed)
                           && x.OrderDetailsInfo.Any(d => d.MovieScheduleInfoEntity.MovieId == movieId
                                                          && d.MovieScheduleInfoEntity.EndedTime > now));
    }

    private async Task<MovieCommentEntity> LoadComment(Guid commentId)
    {
        return await _unitOfWork.Repository<MovieCommentEntity>().Query()
            .Include(x => x.UserInfoEntity)
            .FirstAsync(x => x.CommentId == commentId);
    }

    private async Task CreateNotification(
        Guid userId,
        string title,
        string message,
        string type,
        Guid? relatedCommentId,
        Guid? relatedMovieId)
    {
        await _unitOfWork.Repository<UserNotificationEntity>().AddAsync(new UserNotificationEntity
        {
            NotificationId = Guid.NewGuid(),
            UserId = userId,
            Title = title,
            Message = message,
            Type = type,
            RelatedCommentId = relatedCommentId,
            RelatedMovieId = relatedMovieId,
            CreatedAt = DateTime.UtcNow
        });
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

    private static ResMovieCommentDto MapCommentTree(MovieCommentEntity comment, List<MovieCommentEntity> allComments)
    {
        var dto = MapComment(comment);
        dto.Replies = allComments
            .Where(x => x.ParentCommentId == comment.CommentId)
            .OrderBy(x => x.CreatedAt)
            .Select(x => MapCommentTree(x, allComments))
            .ToList();
        return dto;
    }

    private static ResMovieCommentDto MapComment(MovieCommentEntity comment)
    {
        return new ResMovieCommentDto
        {
            CommentId = comment.CommentId,
            MovieId = comment.MovieId,
            UserId = comment.UserId,
            UserName = comment.UserInfoEntity.UserName,
            UserAvatarUrl = comment.UserInfoEntity.PortraitImageUrl,
            ParentCommentId = comment.ParentCommentId,
            Rating = comment.Rating,
            Content = comment.Content,
            Status = comment.Status,
            CreatedAt = comment.CreatedAt,
            UpdatedAt = comment.UpdatedAt
        };
    }
}
