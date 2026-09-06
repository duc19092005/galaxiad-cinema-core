using System.Text.Json;
using Cinema.Application.Dtos.MovieManager.Contracts;
using Cinema.Application.Exceptions;
using Cinema.Application.Interfaces;
using Cinema.Application.Interfaces.Contracts;
using Cinema.Domain.Entities.Contracts;

namespace Cinema.Application.UseCases.MovieManager.MovieChangeRequests;

public class CreateMovieChangeRequestUseCase
{
    private static readonly HashSet<string> AllowedMetadata = new(StringComparer.OrdinalIgnoreCase)
    {
        "movieDescription", "movieImageUrl", "movieBannerUrl", "trailerUrl", "director", "actors"
    };
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    private readonly IContractRepository _repository;
    private readonly IUserContextService _userContext;

    public CreateMovieChangeRequestUseCase(IContractRepository repository, IUserContextService userContext)
    {
        _repository = repository;
        _userContext = userContext;
    }

    public async Task<ResMovieChangeRequestDto> ExecuteAsync(Guid movieId, CreateMovieChangeRequestDto request, CancellationToken ct)
    {
        var userId = _userContext.GetUserId();
        var isAdmin = _userContext.IsInRole("Admin");

        var movie = await _repository.GetMovieByIdAsync(movieId, ct);
        if (movie == null)
            throw new AppException("Không tìm thấy phim.", 404, "MOVIE_NOT_FOUND");

        if (!isAdmin && movie.MovieManagerId != userId)
            throw new AppException("Không tìm thấy phim trong phạm vi quản lý.", 404, "MOVIE_NOT_FOUND");

        var fields = Parse(request.ProposedChangesJson);
        var denied = fields.Keys.Where(x => !AllowedMetadata.Contains(x)).ToList();
        if (denied.Count > 0)
            throw new AppException("Thời hạn, phạm vi, tỷ lệ, tên, thời lượng và phân loại phải thay đổi qua hợp đồng/phụ lục.", 400, "CONTRACT_CHANGE_REQUIRED");

        var item = new MovieChangeRequestEntity
        {
            MovieChangeRequestId = Guid.NewGuid(),
            MovieId = movieId,
            RequestedByUserId = userId,
            Reason = request.Reason.Trim(),
            ProposedChangesJson = JsonSerializer.Serialize(fields, JsonOptions),
            OriginalSnapshotJson = JsonSerializer.Serialize(new
            {
                movie.MovieDescription,
                movie.MovieImageUrl,
                movie.MovieBannerUrl,
                movie.TrailerUrl,
                movie.Director,
                movie.Actors
            }, JsonOptions)
        };

        await _repository.AddMovieChangeRequestAsync(item, ct);

        return new ResMovieChangeRequestDto(
            item.MovieChangeRequestId,
            item.MovieId,
            item.RequestedByUserId,
            item.Status.ToString(),
            item.Reason,
            item.OriginalSnapshotJson,
            item.ProposedChangesJson,
            item.ReviewNote,
            item.ReviewedByUserId,
            item.CreatedAt,
            item.UpdatedAt);
    }

    private static Dictionary<string, JsonElement> Parse(string json)
    {
        try
        {
            return JsonSerializer.Deserialize<Dictionary<string, JsonElement>>(json, JsonOptions) ?? [];
        }
        catch
        {
            return [];
        }
    }
}
