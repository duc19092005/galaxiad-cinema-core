using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Cinema.Application.Dtos.Comments;
using Cinema.Domain.Entities.MovieInfos;
using Cinema.Domain.Entities.UserInfos;

namespace Cinema.Application.Interfaces.Comments;

public interface IMovieCommentRepository
{
    Task<ResMovieCommentsSummaryDto> GetMovieCommentsSummaryAsync(Guid movieId);
    Task<OrderInfoEntity?> FindEligibleViewedOrderAsync(Guid userId, Guid movieId);
    Task<bool> HasFuturePaidTicketAsync(Guid userId, Guid movieId);
    Task<bool> HasAlreadyReviewedAsync(Guid userId, Guid movieId);
    Task<MovieCommentEntity?> GetCommentWithUserAndMovieAsync(Guid commentId);
    Task<List<ResUserNotificationDto>> GetNotificationsByUserIdAsync(Guid userId);
    Task<UserNotificationEntity?> GetNotificationByIdAndUserAsync(Guid notificationId, Guid userId);
    Task<List<ResTrendingMovieDto>> GetTrendingMoviesAsync(DateTime fromDate, Guid? cinemaId, string? city);
    Task<List<ResTrendingMovieDto>> GetTopRatedMoviesAsync(Guid? cinemaId);
    Task<bool> MovieExistsAsync(Guid movieId);
    Task<MovieCommentEntity?> FindCommentAsync(Guid commentId);
    Task CreateNotificationAsync(Guid userId, string title, string message, string type, Guid? relatedCommentId, Guid? relatedMovieId);
}
