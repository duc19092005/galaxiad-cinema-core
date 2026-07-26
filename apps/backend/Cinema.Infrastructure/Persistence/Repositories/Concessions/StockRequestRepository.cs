using Cinema.Application.Interfaces.Concessions;
using Cinema.Domain.Entities.Concessions;
using Cinema.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace Cinema.Infrastructure.Persistence.Repositories.Concessions;

public class StockRequestRepository : IStockRequestRepository
{
    private readonly CinemaDbContext _dbContext;

    public StockRequestRepository(CinemaDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<StockRequestEntity?> GetByIdAsync(Guid stockRequestId)
    {
        return await _dbContext.StockRequestEntity
            .Include(r => r.CinemaInfoEntity)
            .Include(r => r.RequestedByUser)
            .Include(r => r.ApprovedByUser)
            .Include(r => r.ShippedByUser)
            .Include(r => r.ReceivedByUser)
            .FirstOrDefaultAsync(r => r.StockRequestId == stockRequestId);
    }

    public async Task<StockRequestEntity?> GetByIdWithItemsAsync(Guid stockRequestId)
    {
        return await _dbContext.StockRequestEntity
            .Include(r => r.CinemaInfoEntity)
            .Include(r => r.RequestedByUser)
            .Include(r => r.ApprovedByUser)
            .Include(r => r.ShippedByUser)
            .Include(r => r.ReceivedByUser)
            .Include(r => r.Items)
                .ThenInclude(i => i.ConcessionProductEntity)
            .FirstOrDefaultAsync(r => r.StockRequestId == stockRequestId);
    }

    public async Task<List<StockRequestEntity>> GetListAsync(Guid? cinemaId, StockRequestStatus? status)
    {
        var query = _dbContext.StockRequestEntity
            .Include(r => r.CinemaInfoEntity)
            .Include(r => r.RequestedByUser)
            .Include(r => r.ApprovedByUser)
            .Include(r => r.ShippedByUser)
            .Include(r => r.ReceivedByUser)
            .Include(r => r.Items)
                .ThenInclude(i => i.ConcessionProductEntity)
            .AsQueryable();

        if (cinemaId.HasValue && cinemaId.Value != Guid.Empty)
        {
            query = query.Where(r => r.CinemaId == cinemaId.Value);
        }

        if (status.HasValue)
        {
            query = query.Where(r => r.Status == status.Value);
        }

        return await query.OrderByDescending(r => r.CreatedAt).ToListAsync();
    }

    public async Task AddAsync(StockRequestEntity stockRequest)
    {
        await _dbContext.StockRequestEntity.AddAsync(stockRequest);
    }

    public void Update(StockRequestEntity stockRequest)
    {
        _dbContext.StockRequestEntity.Update(stockRequest);
    }
}
