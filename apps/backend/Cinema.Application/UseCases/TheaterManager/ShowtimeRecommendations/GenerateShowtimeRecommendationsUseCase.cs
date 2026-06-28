using System.Text.Json;
using Cinema.Application.Dtos;
using Cinema.Application.Dtos.TheaterManager.ShowtimeRecommendations;
using Cinema.Application.Exceptions;
using Cinema.Application.Interfaces;
using Cinema.Application.Interfaces.TheaterManager;
using Cinema.Application.Mappers.TheaterManager.ShowtimeRecommendations;
using Cinema.Application.Policies.TheaterManager.ShowtimeRecommendations;
using Cinema.Application.Services.TheaterManager.ShowtimeRecommendations;
using Cinema.Domain.Entities.MovieInfos;
using Cinema.Domain.Interfaces.Persistence;
using Cinema.Domain.Localization;
using Cinema.Domain.Utils;

namespace Cinema.Application.UseCases.TheaterManager.ShowtimeRecommendations;

public class GenerateShowtimeRecommendationsUseCase
{
    private const int DefaultMaxSuggestions = 10;
    private const int MaxAllowedSuggestions = 20;

    private readonly IShowtimeRecommendationRepository _repository;
    private readonly IUserContextService _userContextService;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IAuditLogService _auditLogService;
    private readonly ShowtimeRecommendationAccessGuard _accessGuard;

    public GenerateShowtimeRecommendationsUseCase(
        IShowtimeRecommendationRepository repository,
        IUserContextService userContextService,
        IUnitOfWork unitOfWork,
        IAuditLogService auditLogService,
        ShowtimeRecommendationAccessGuard accessGuard)
    {
        _repository = repository;
        _userContextService = userContextService;
        _unitOfWork = unitOfWork;
        _auditLogService = auditLogService;
        _accessGuard = accessGuard;
    }

    public async Task<BaseResponse<ShowtimeRecommendationBatchDto>> ExecuteAsync(GenerateShowtimeRecommendationsRequest request)
    {
        var userId = _userContextService.GetUserId();
        var isAdmin = _userContextService.IsInRole("Admin");
        await _accessGuard.EnsureCinemaAccessAsync(request.CinemaId, userId, isAdmin);

        var fromUtc = DateTimeHelper.NormalizeIncoming(request.FromDate.Date);
        var toUtc = DateTimeHelper.NormalizeIncoming(request.ToDate.Date.AddDays(1).AddTicks(-1));
        if (toUtc < fromUtc)
        {
            throw new BadRequestException(Messages.ShowtimeRecommendation.DateRangeInvalid, "REC01");
        }

        var maxSuggestions = Math.Clamp(request.MaxSuggestions ?? DefaultMaxSuggestions, 1, MaxAllowedSuggestions);
        var nowUtc = DateTime.UtcNow;
        var lookbackFrom = nowUtc.AddDays(-30);

        var auditoriums = await _repository.GetAuditoriumsAsync(request.CinemaId, request.AuditoriumId);
        if (auditoriums.Count == 0)
        {
            throw new BadRequestException(Messages.ShowtimeRecommendation.NoActiveAuditorium, "REC02");
        }

        var movies = await _repository.GetActiveMoviesForCinemaAsync(request.CinemaId, fromUtc, toUtc);
        if (movies.Count == 0)
        {
            throw new BadRequestException(Messages.ShowtimeRecommendation.NoActiveMovie, "REC03");
        }

        var movieIds = movies.Select(x => x.MovieId).ToList();
        var formats = (await _repository.GetMovieFormatsAsync()).ToDictionary(x => x.MovieFormatId, x => x.MovieFormatName);
        var movieFormats = (await _repository.GetMovieFormatRelationsAsync(movieIds))
            .GroupBy(x => x.MovieId)
            .ToDictionary(x => x.Key, x => x.Select(y => y.FormatId).Distinct().ToList());
        var paidDetails = await _repository.GetPaidOrderDetailsForCinemaAsync(request.CinemaId, lookbackFrom, nowUtc);
        var views = await _repository.GetMovieViewCountsAsync(movieIds, lookbackFrom, nowUtc);
        var ratings = await _repository.GetMovieRatingsAsync(movieIds);
        var existingSchedules = await _repository.GetSchedulesForCinemaAsync(request.CinemaId, fromUtc.AddDays(-1), toUtc.AddDays(1));
        var demandScores = MovieDemandScorer.Score(movies, paidDetails, views, ratings, nowUtc);
        var candidates = ShowtimeRecommendationCandidateBuilder.Build(
            auditoriums,
            movies,
            movieFormats,
            formats,
            demandScores,
            paidDetails,
            existingSchedules,
            fromUtc,
            toUtc,
            nowUtc,
            maxSuggestions);

        var batch = new ShowtimeRecommendationBatchEntity
        {
            BatchId = Guid.NewGuid(),
            CinemaId = request.CinemaId,
            RequestedByUserId = userId,
            FromDate = fromUtc,
            ToDate = toUtc,
            AuditoriumId = request.AuditoriumId,
            MaxSuggestions = maxSuggestions,
            RequestSnapshotJson = JsonSerializer.Serialize(request),
            CreatedAt = nowUtc,
            Items = candidates.Select(candidate => ShowtimeRecommendationMapper.ToEntity(candidate, request.CinemaId)).ToList()
        };

        await _auditLogService.WriteAsync(
            "Generate",
            "ShowtimeRecommendation",
            batch.BatchId,
            $"Recommendation batch {batch.BatchId}",
            Messages.ShowtimeRecommendation.GeneratedAuditDescription(batch.Items.Count),
            request.CinemaId);
        await _repository.AddBatchAsync(batch);
        await _unitOfWork.SaveChangesAsync();

        return new BaseResponse<ShowtimeRecommendationBatchDto>
        {
            IsSuccess = true,
            Data = ShowtimeRecommendationMapper.ToBatchDto(batch),
            Message = Messages.ShowtimeRecommendation.GenerateSuccess
        };
    }
}
