using System;
using System.Threading.Tasks;
using Cinema.Domain.Entities.MovieInfos;
using Cinema.Application.Interfaces.Comments;
using Cinema.Application.Interfaces.IThirdPersonServices;
using Cinema.Domain.Enums;
using Cinema.Domain.Interfaces.Persistence;

namespace Cinema.Application.UseCases.Comments;

public class ModerateMovieCommentUseCase
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMovieCommentRepository _commentRepository;
    private readonly ICommentModerationService _moderationService;
    private readonly ISseNotificationService _sseNotificationService;

    public ModerateMovieCommentUseCase(
        IUnitOfWork unitOfWork,
        IMovieCommentRepository commentRepository,
        ICommentModerationService moderationService,
        ISseNotificationService sseNotificationService)
    {
        _unitOfWork = unitOfWork;
        _commentRepository = commentRepository;
        _moderationService = moderationService;
        _sseNotificationService = sseNotificationService;
    }


    public async Task ExecuteAsync(Guid commentId)
    {
        var comment = await _commentRepository.GetCommentWithUserAndMovieAsync(commentId);
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

            await MovieCommentHelper.CreateNotificationAsync(
                _unitOfWork,
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

        bool notifyParent = comment.ParentCommentId.HasValue && comment.ParentComment != null && comment.ParentComment.UserId != comment.UserId;

        if (notifyParent)
        {
            var movieName = comment.MovieInfoEntity?.MovieName ?? "phim";
            await MovieCommentHelper.CreateNotificationAsync(
                _unitOfWork,
                comment.ParentComment!.UserId,
                "Co nguoi phan hoi binh luan cua ban",
                $"{comment.UserInfoEntity.UserName} da phan hoi binh luan cua ban ve {movieName}.",
                "CommentReply",
                comment.CommentId,
                comment.MovieId);
        }

        await _unitOfWork.SaveChangesAsync();

        if (notifyParent)
        {
            await _sseNotificationService.SendNotificationAsync(
                comment.ParentComment!.UserId,
                "Co nguoi phan hoi binh luan cua ban",
                $"{comment.UserInfoEntity.UserName} da phan hoi binh luan cua ban.",
                "CommentReply");
        }
    }
}
