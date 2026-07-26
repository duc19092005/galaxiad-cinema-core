using Cinema.Application.Interfaces.Concessions;
using Cinema.Domain.Entities.Concessions;
using Cinema.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace Cinema.Infrastructure.Persistence.Repositories.Concessions;

public class InventoryRepository : IInventoryRepository
{
    private readonly CinemaDbContext _dbContext;

    public InventoryRepository(CinemaDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<ConcessionInventoryEntity?> GetInventoryAsync(Guid productId)
    {
        return await _dbContext.Set<ConcessionInventoryEntity>()
            .FirstOrDefaultAsync(i => i.ProductId == productId);
    }

    public async Task<List<ConcessionInventoryEntity>> GetInventoriesAsync(IEnumerable<Guid> productIds)
    {
        var ids = productIds.Distinct().ToList();
        return await _dbContext.Set<ConcessionInventoryEntity>()
            .Where(i => ids.Contains(i.ProductId))
            .ToListAsync();
    }

    public async Task<List<ConcessionInventoryEntity>> GetLowStockInventoriesAsync(Guid cinemaId)
    {
        return await _dbContext.Set<ConcessionInventoryEntity>()
            .Include(i => i.ConcessionProductEntity)
            .Where(i => i.ConcessionProductEntity.CinemaId == cinemaId
                        && i.ConcessionProductEntity.IsActive
                        && (i.QuantityOnHand - i.QuantityReserved) <= i.ConcessionProductEntity.LowStockThreshold)
            .ToListAsync();
    }

    public async Task AddTransactionAsync(InventoryTransactionEntity transaction)
    {
        await _dbContext.Set<InventoryTransactionEntity>().AddAsync(transaction);
    }

    public async Task<List<InventoryTransactionEntity>> GetTransactionHistoryAsync(
        Guid cinemaId,
        Guid? productId,
        InventoryTransactionType? type,
        DateTime? fromDate,
        DateTime? toDate,
        int page,
        int pageSize)
    {
        var query = BuildHistoryQuery(cinemaId, productId, type, fromDate, toDate);
        return await query
            .OrderByDescending(t => t.OccurredAt)
            .Skip(Math.Max(0, (page - 1) * pageSize))
            .Take(pageSize)
            .ToListAsync();
    }

    public async Task<int> CountTransactionHistoryAsync(
        Guid cinemaId,
        Guid? productId,
        InventoryTransactionType? type,
        DateTime? fromDate,
        DateTime? toDate)
    {
        return await BuildHistoryQuery(cinemaId, productId, type, fromDate, toDate).CountAsync();
    }

    private IQueryable<InventoryTransactionEntity> BuildHistoryQuery(
        Guid cinemaId,
        Guid? productId,
        InventoryTransactionType? type,
        DateTime? fromDate,
        DateTime? toDate)
    {
        var query = _dbContext.Set<InventoryTransactionEntity>()
            .Include(t => t.ConcessionProductEntity)
            .Where(t => t.CinemaId == cinemaId);

        if (productId.HasValue) query = query.Where(t => t.ProductId == productId.Value);
        if (type.HasValue) query = query.Where(t => t.TransactionType == type.Value);
        if (fromDate.HasValue) query = query.Where(t => t.OccurredAt >= fromDate.Value);
        if (toDate.HasValue) query = query.Where(t => t.OccurredAt <= toDate.Value);

        return query;
    }

    public async Task<List<OrderConcessionDetailEntity>> GetOrderConcessionDetailsAsync(Guid orderId)
    {
        return await _dbContext.Set<OrderConcessionDetailEntity>()
            .Include(d => d.ConcessionProductEntity)
            .Where(d => d.OrderId == orderId)
            .ToListAsync();
    }

    public async Task AddOrderConcessionDetailsAsync(IEnumerable<OrderConcessionDetailEntity> details)
    {
        await _dbContext.Set<OrderConcessionDetailEntity>().AddRangeAsync(details);
    }
}
