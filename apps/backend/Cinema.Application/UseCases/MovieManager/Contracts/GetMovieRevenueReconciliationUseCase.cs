using Cinema.Application.Dtos.MovieManager.Contracts;
using Cinema.Application.Exceptions;
using Cinema.Application.Interfaces;
using Cinema.Application.Interfaces.Contracts;

namespace Cinema.Application.UseCases.MovieManager.Contracts;

public class GetMovieRevenueReconciliationUseCase
{
    private readonly IContractRepository _repository;
    private readonly IUserContextService _userContext;

    public GetMovieRevenueReconciliationUseCase(IContractRepository repository, IUserContextService userContext)
    {
        _repository = repository;
        _userContext = userContext;
    }

    public async Task<ResMovieRevenueReportDto> ExecuteAsync(DateTime? from, DateTime? to, CancellationToken ct)
    {
        if (!_userContext.IsInRole("Admin"))
            throw new AppException("Chỉ Admin mới có quyền xem báo cáo doanh thu.", 403, "FORBIDDEN");

        var start = from.HasValue ? ToUtc(from.Value) : DateTime.UtcNow.AddDays(-30);
        var end = to.HasValue ? ToUtc(to.Value) : DateTime.UtcNow;

        var rows = await _repository.GetMovieRevenueReportRowsAsync(start, end, ct);
        var totalRevenue = rows.Sum(x => x.TicketRevenue);
        var totalCinemaShare = rows.Sum(x => x.CinemaShare);

        var movies = rows.Select(x => new ResMovieRevenueItemDto(
            x.MovieId,
            x.MovieName,
            x.ContractId,
            x.InternalCode,
            x.DistributorName,
            x.Tickets,
            x.TicketRevenue,
            x.RevenueBasis,
            x.CinemaShare,
            x.DistributorShare,
            totalRevenue == 0 ? 0 : decimal.Round(x.TicketRevenue * 100 / totalRevenue, 2),
            totalCinemaShare == 0 ? 0 : decimal.Round(x.CinemaShare * 100 / totalCinemaShare, 2),
            x.RevenueBasis == 0 ? 0 : decimal.Round(x.CinemaShare * 100 / x.RevenueBasis, 2)
        )).ToList();

        return new ResMovieRevenueReportDto(start, end, totalRevenue, totalCinemaShare, movies);
    }

    private static DateTime ToUtc(DateTime dt) => dt.Kind == DateTimeKind.Utc ? dt : dt.ToUniversalTime();
}
