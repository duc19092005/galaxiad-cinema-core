using Cinema.Application.Interfaces.Concessions;
using Cinema.Domain.Entities.Concessions;
using Cinema.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace Cinema.Infrastructure.Persistence.Repositories.Concessions;

public class ConcessionRepository : IConcessionRepository
{
    private readonly CinemaDbContext _dbContext;

    public ConcessionRepository(CinemaDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<ConcessionProductEntity?> GetProductByIdAsync(Guid productId)
    {
        return await _dbContext.Set<ConcessionProductEntity>()
            .FirstOrDefaultAsync(p => p.ProductId == productId);
    }

    public async Task<ConcessionProductEntity?> GetProductWithInventoryAsync(Guid productId)
    {
        return await _dbContext.Set<ConcessionProductEntity>()
            .Include(p => p.Inventory)
            .FirstOrDefaultAsync(p => p.ProductId == productId);
    }

    public async Task<ConcessionProductEntity?> GetProductWithComboItemsAsync(Guid productId)
    {
        return await _dbContext.Set<ConcessionProductEntity>()
            .Include(p => p.ComboItems)
                .ThenInclude(ci => ci.ComponentProduct)
                    .ThenInclude(cp => cp.Inventory)
            .FirstOrDefaultAsync(p => p.ProductId == productId);
    }

    public async Task<List<ConcessionProductEntity>> GetProductsByIdsWithInventoryAsync(IEnumerable<Guid> productIds)
    {
        var ids = productIds.Distinct().ToList();
        return await _dbContext.Set<ConcessionProductEntity>()
            .Include(p => p.Inventory)
            .Include(p => p.ComboItems)
                .ThenInclude(ci => ci.ComponentProduct)
                    .ThenInclude(cp => cp.Inventory)
            .Where(p => ids.Contains(p.ProductId))
            .ToListAsync();
    }

    public async Task<bool> SkuExistsAsync(Guid cinemaId, string sku)
    {
        return await _dbContext.Set<ConcessionProductEntity>()
            .AnyAsync(p => p.CinemaId == cinemaId && p.Sku == sku);
    }

    public async Task<List<ConcessionProductEntity>> GetCinemaMenuAsync(Guid cinemaId, bool onlineOnly)
    {
        var query = _dbContext.Set<ConcessionProductEntity>()
            .Include(p => p.Inventory)
            .Include(p => p.ComboItems)
                .ThenInclude(ci => ci.ComponentProduct)
                    .ThenInclude(component => component.Inventory)
            .Where(p => p.CinemaId == cinemaId && p.IsActive);

        if (onlineOnly)
        {
            query = query.Where(p => p.IsAvailableOnline);
        }

        return await query.OrderByDescending(p => p.IsHot).ThenBy(p => p.Category).ThenBy(p => p.ProductName).ToListAsync();
    }

    public async Task<List<ConcessionProductEntity>> GetCinemaProductsAsync(Guid cinemaId)
    {
        return await _dbContext.Set<ConcessionProductEntity>()
            .Include(p => p.Inventory)
            .Include(p => p.ComboItems)
                .ThenInclude(ci => ci.ComponentProduct)
            .Where(p => p.CinemaId == cinemaId)
            .OrderBy(p => p.Category).ThenBy(p => p.ProductName)
            .ToListAsync();
    }

    public async Task AddProductAsync(ConcessionProductEntity product)
    {
        await _dbContext.Set<ConcessionProductEntity>().AddAsync(product);
    }

    public void UpdateProduct(ConcessionProductEntity product)
    {
        _dbContext.Set<ConcessionProductEntity>().Update(product);
    }

    public async Task AddComboItemsAsync(IEnumerable<ConcessionComboItemEntity> comboItems)
    {
        await _dbContext.Set<ConcessionComboItemEntity>().AddRangeAsync(comboItems);
    }

    public async Task<List<ConcessionComboItemEntity>> GetComboItemsAsync(Guid comboProductId)
    {
        return await _dbContext.Set<ConcessionComboItemEntity>()
            .Include(ci => ci.ComponentProduct)
                .ThenInclude(cp => cp.Inventory)
            .Where(ci => ci.ComboProductId == comboProductId)
            .ToListAsync();
    }

    public async Task<List<ConcessionProductEntity>> GetSubstituteCandidatesAsync(Guid cinemaId, ConcessionCategory category, Guid excludeProductId, int take = 3)
    {
        return await _dbContext.Set<ConcessionProductEntity>()
            .Include(p => p.Inventory)
            .Where(p => p.CinemaId == cinemaId
                        && p.IsActive
                        && p.IsAvailableOnline
                        && p.Category == category
                        && p.ProductId != excludeProductId
                        && p.Inventory != null
                        && (p.Inventory.QuantityOnHand - p.Inventory.QuantityReserved) > 0)
            .OrderByDescending(p => p.Inventory!.QuantityOnHand - p.Inventory.QuantityReserved)
            .Take(take)
            .ToListAsync();
    }
}
