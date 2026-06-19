namespace Cinema.Application.Interfaces.Comments;

public record CommentModerationResult(bool Blocked, string Reason);

public interface ICommentModerationService
{
    Task<CommentModerationResult> ModerateAsync(string content, CancellationToken cancellationToken = default);
}
