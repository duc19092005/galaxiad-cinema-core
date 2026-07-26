using Cinema.Application.Interfaces.Concessions;
using Cinema.Domain.Entities.Concessions;
using Cinema.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace Cinema.Infrastructure.Persistence.Repositories.Concessions;

public class WasteReportRepository : IWasteReportRepository
{
    private readonly CinemaDbContext _dbContext;

    public WasteReportRepository(CinemaDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<WasteReportEntity?> GetByIdAsync(Guid wasteReportId)
    {
        return await _dbContext.WasteReportEntity
            .Include(w => w.CinemaInfoEntity)
            .Include(w => w.ConcessionProductEntity)
            .Include(w => w.ReportedByUser)
            .Include(w => w.ReviewedByUser)
            .FirstOrDefaultAsync(w => w.WasteReportId == wasteReportId);
    }

    public async Task<List<WasteReportEntity>> GetListAsync(Guid? cinemaId, WasteReportStatus? status)
    {
        var query = _dbContext.WasteReportEntity
            .Include(w => w.CinemaInfoEntity)
            .Include(w => w.ConcessionProductEntity)
            .Include(w => w.ReportedByUser)
            .Include(w => w.ReviewedByUser)
            .AsQueryable();

        if (cinemaId.HasValue && cinemaId.Value != Guid.Empty)
        {
            query = query.Where(w => w.CinemaId == cinemaId.Value);
        }

        if (status.HasValue)
        {
            query = query.Where(w => w.Status == status.Value);
        }

        return await query.OrderByDescending(w => w.CreatedAt).ToListAsync();
    }

    public async Task AddAsync(WasteReportEntity wasteReport)
    {
        await _dbContext.WasteReportEntity.AddAsync(wasteReport);
    }

    public void Update(WasteReportEntity wasteReport)
    {
        _dbContext.WasteReportEntity.Update(wasteReport);
    }
}
