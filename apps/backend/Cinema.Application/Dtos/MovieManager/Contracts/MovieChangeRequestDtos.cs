namespace Cinema.Application.Dtos.MovieManager.Contracts;

public sealed record CreateMovieChangeRequestDto(string Reason, string ProposedChangesJson);
public sealed record ReviewMovieChangeRequestDto(string Reason);

public sealed record ResMovieChangeRequestDto(
    Guid MovieChangeRequestId,
    Guid MovieId,
    Guid RequestedByUserId,
    string Status,
    string Reason,
    string OriginalSnapshotJson,
    string ProposedChangesJson,
    string? ReviewNote,
    Guid? ReviewedByUserId,
    DateTime CreatedAt,
    DateTime UpdatedAt);
