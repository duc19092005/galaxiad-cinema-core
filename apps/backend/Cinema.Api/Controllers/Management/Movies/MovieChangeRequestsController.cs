using System.Text.Json;
using Cinema.Application.Interfaces;
using Cinema.Domain.Entities.Contracts;
using Cinema.Domain.Enums;
using Cinema.Infrastructure;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Cinema.Api.Controllers.Management.Movies;

[ApiController]
[Authorize(Roles = "Admin,MovieManager")]
[Tags("Movie change requests")]
public sealed class MovieChangeRequestsController : ControllerBase
{
    private static readonly HashSet<string> AllowedMetadata = new(StringComparer.OrdinalIgnoreCase)
        { "movieDescription", "movieImageUrl", "movieBannerUrl", "trailerUrl", "director", "actors" };
    private readonly CinemaDbContext _db;
    private readonly IUserContextService _user;
    public MovieChangeRequestsController(CinemaDbContext db, IUserContextService user) { _db = db; _user = user; }

    [HttpPost("api/movies/{movieId:guid}/change-requests")]
    public async Task<IActionResult> Create(Guid movieId, CreateMovieChangeRequest request, CancellationToken ct)
    {
        var movie = await _db.MovieInfoEntity.AsNoTracking().SingleOrDefaultAsync(x => x.MovieId == movieId, ct);
        if (movie == null) return NotFound();
        if (!_user.IsInRole("Admin") && movie.MovieManagerId != _user.GetUserId()) return NotFound();
        var fields = Parse(request.ProposedChangesJson);
        var denied = fields.Keys.Where(x => !AllowedMetadata.Contains(x)).ToList();
        if (denied.Count > 0) return BadRequest(new { isSuccess = false, errorCode = "CONTRACT_CHANGE_REQUIRED", message = "Thời hạn, phạm vi, tỷ lệ, tên, thời lượng và phân loại phải thay đổi qua hợp đồng/phụ lục.", fields = denied });
        var item = new MovieChangeRequestEntity
        {
            MovieChangeRequestId = Guid.NewGuid(), MovieId = movieId, RequestedByUserId = _user.GetUserId(),
            Reason = request.Reason.Trim(), ProposedChangesJson = JsonSerializer.Serialize(fields),
            OriginalSnapshotJson = JsonSerializer.Serialize(new { movie.MovieDescription, movie.MovieImageUrl, movie.MovieBannerUrl, movie.TrailerUrl, movie.Director, movie.Actors })
        };
        _db.MovieChangeRequestEntity.Add(item); await _db.SaveChangesAsync(ct);
        return Ok(new { isSuccess = true, data = item });
    }

    [HttpGet("api/movies/{movieId:guid}/change-requests")]
    public async Task<IActionResult> List(Guid movieId, CancellationToken ct)
    {
        var query = _db.MovieChangeRequestEntity.AsNoTracking().Where(x => x.MovieId == movieId);
        if (!_user.IsInRole("Admin")) query = query.Where(x => x.RequestedByUserId == _user.GetUserId());
        return Ok(new { isSuccess = true, data = await query.OrderByDescending(x => x.UpdatedAt).ToListAsync(ct) });
    }

    [HttpPost("api/movie-change-requests/{id:guid}/submit")]
    public async Task<IActionResult> Submit(Guid id, CancellationToken ct)
    {
        var item = await Owned(id, ct); if (item == null) return NotFound();
        if (item.Status is not (MovieChangeRequestStatus.Draft or MovieChangeRequestStatus.Returned)) return Conflict();
        item.Status = MovieChangeRequestStatus.PendingReview; item.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct); return Ok(new { isSuccess = true, data = new { status = "PendingReview" } });
    }

    [HttpPost("api/movie-change-requests/{id:guid}/return")]
    public Task<IActionResult> Return(Guid id, ReviewMovieChangeRequest request, CancellationToken ct) => Review(id, request, MovieChangeRequestStatus.Returned, ct);

    [HttpPost("api/movie-change-requests/{id:guid}/reject")]
    public Task<IActionResult> Reject(Guid id, ReviewMovieChangeRequest request, CancellationToken ct) => Review(id, request, MovieChangeRequestStatus.Rejected, ct);

    [HttpPost("api/movie-change-requests/{id:guid}/approve")]
    public async Task<IActionResult> Approve(Guid id, CancellationToken ct)
    {
        if (!_user.IsInRole("Admin")) return Forbid();
        await using var tx = await _db.Database.BeginTransactionAsync(ct);
        var item = await _db.MovieChangeRequestEntity.SingleOrDefaultAsync(x => x.MovieChangeRequestId == id, ct);
        if (item == null) return NotFound();
        if (item.Status != MovieChangeRequestStatus.PendingReview) return Conflict();
        var movie = await _db.MovieInfoEntity.SingleAsync(x => x.MovieId == item.MovieId, ct);
        var changes = Parse(item.ProposedChangesJson);
        foreach (var (field, value) in changes)
        {
            var text = value.ValueKind == JsonValueKind.Null ? "" : value.GetString() ?? "";
            switch (field.ToLowerInvariant())
            {
                case "moviedescription": movie.MovieDescription = text; break;
                case "movieimageurl": movie.MovieImageUrl = text; break;
                case "moviebannerurl": movie.MovieBannerUrl = text; break;
                case "trailerurl": movie.TrailerUrl = text; break;
                case "director": movie.Director = text; break;
                case "actors": movie.Actors = text; break;
            }
        }
        movie.UpdatedAt = DateTime.UtcNow; movie.UpdatedByUserId = _user.GetUserId();
        item.Status = MovieChangeRequestStatus.Approved; item.ReviewedByUserId = _user.GetUserId(); item.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct); await tx.CommitAsync(ct);
        return Ok(new { isSuccess = true, data = new { status = "Approved" } });
    }

    private async Task<IActionResult> Review(Guid id, ReviewMovieChangeRequest request, MovieChangeRequestStatus status, CancellationToken ct)
    {
        if (!_user.IsInRole("Admin")) return Forbid();
        if (string.IsNullOrWhiteSpace(request.Reason)) return BadRequest();
        var item = await _db.MovieChangeRequestEntity.FindAsync([id], ct); if (item == null) return NotFound();
        if (item.Status != MovieChangeRequestStatus.PendingReview) return Conflict();
        item.Status = status; item.ReviewNote = request.Reason; item.ReviewedByUserId = _user.GetUserId(); item.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct); return Ok(new { isSuccess = true, data = new { status = status.ToString() } });
    }

    private Task<MovieChangeRequestEntity?> Owned(Guid id, CancellationToken ct) => _db.MovieChangeRequestEntity.SingleOrDefaultAsync(x => x.MovieChangeRequestId == id && (_user.IsInRole("Admin") || x.RequestedByUserId == _user.GetUserId()), ct);
    private static Dictionary<string, JsonElement> Parse(string json)
    {
        try { return JsonSerializer.Deserialize<Dictionary<string, JsonElement>>(json, new JsonSerializerOptions(JsonSerializerDefaults.Web)) ?? []; }
        catch { return []; }
    }
}

public sealed record CreateMovieChangeRequest(string Reason, string ProposedChangesJson);
public sealed record ReviewMovieChangeRequest(string Reason);
