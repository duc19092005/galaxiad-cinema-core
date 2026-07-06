using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Cinema.Application.Interfaces.Banners;
using Cinema.Domain.Entities.Banners;
using Cinema.Domain.Entities.CinemaInfos;
using Cinema.Domain.Entities.MovieInfos;
using Cinema.Domain.Entities.Vouchers;

namespace Cinema.Infrastructure.Persistence.Repositories.Banners;

public class BannerRepository : IBannerRepository
{
    private readonly CinemaDbContext _dbContext;

    public BannerRepository(CinemaDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<List<BannerEntity>> GetAllBannersAsync()
    {
        return await _dbContext.Set<BannerEntity>()
            .OrderBy(x => x.DisplayOrder)
            .ThenByDescending(x => x.CreatedAt)
            .AsNoTracking()
            .ToListAsync();
    }

    public async Task<List<BannerEntity>> GetActiveBannersAsync(Guid? cinemaId, string? cinemaCity)
    {
        var now = DateTime.UtcNow;
        var query = _dbContext.Set<BannerEntity>()
            .Where(x => x.IsActive
                        && (!x.StartDisplayAt.HasValue || x.StartDisplayAt <= now)
                        && (!x.EndDisplayAt.HasValue || x.EndDisplayAt >= now));

        // Scope filtering: specific cinema > city > system-wide
        if (cinemaId.HasValue)
        {
            // Get the cinema's city
            var cinema = await _dbContext.Set<CinemaInfoEntity>()
                .FirstOrDefaultAsync(c => c.CinemaId == cinemaId.Value);

            if (cinema != null)
            {
                var city = cinema.CinemaCity;
                query = query.Where(x =>
                    (x.CinemaId.HasValue && x.CinemaId == cinemaId.Value)
                    || (!x.CinemaId.HasValue && x.CinemaCity != null && x.CinemaCity == city)
                    || (!x.CinemaId.HasValue && x.CinemaCity == null));
            }
            else
            {
                // Cinema not found, show only system-wide banners
                query = query.Where(x => !x.CinemaId.HasValue && x.CinemaCity == null);
            }
        }
        else if (!string.IsNullOrEmpty(cinemaCity))
        {
            // Filter by city + system-wide
            query = query.Where(x =>
                (x.CinemaCity != null && x.CinemaCity == cinemaCity)
                || (!x.CinemaId.HasValue && x.CinemaCity == null));
        }
        else
        {
            // System-wide only
            query = query.Where(x => !x.CinemaId.HasValue && x.CinemaCity == null);
        }

        return await query
            .OrderBy(x => x.DisplayOrder)
            .AsNoTracking()
            .ToListAsync();
    }

    public async Task<BannerEntity?> GetBannerByIdAsync(Guid id)
    {
        return await _dbContext.Set<BannerEntity>()
            .FirstOrDefaultAsync(x => x.BannerId == id);
    }

    public async Task<BannerEntity?> AddBannerAsync(BannerEntity banner)
    {
        await _dbContext.Set<BannerEntity>().AddAsync(banner);
        return banner;
    }

    public void UpdateBanner(BannerEntity banner)
    {
        _dbContext.Set<BannerEntity>().Update(banner);
    }

    public void RemoveBanner(BannerEntity banner)
    {
        _dbContext.Set<BannerEntity>().Remove(banner);
    }

    public async Task<int> GetMaxDisplayOrderAsync()
    {
        if (!await _dbContext.Set<BannerEntity>().AnyAsync())
            return 0;
        return await _dbContext.Set<BannerEntity>().MaxAsync(x => x.DisplayOrder);
    }

    public async Task<List<string>> GetDistinctCitiesAsync()
    {
        return await _dbContext.Set<CinemaInfoEntity>()
            .Where(x => !x.IsDeleted)
            .Select(x => x.CinemaCity)
            .Distinct()
            .OrderBy(x => x)
            .ToListAsync();
    }

    public async Task<BannerEntity?> FindExistingByScopeAsync(Guid? cinemaId, string? cinemaCity)
    {
        if (cinemaId.HasValue)
        {
            return await _dbContext.Set<BannerEntity>()
                .FirstOrDefaultAsync(x => x.CinemaId == cinemaId.Value);
        }
        if (!string.IsNullOrEmpty(cinemaCity))
        {
            return await _dbContext.Set<BannerEntity>()
                .FirstOrDefaultAsync(x => !x.CinemaId.HasValue && x.CinemaCity == cinemaCity);
        }
        // System-wide
        return await _dbContext.Set<BannerEntity>()
            .FirstOrDefaultAsync(x => !x.CinemaId.HasValue && x.CinemaCity == null);
    }

    public async Task<List<BannerEntity>> GetBannersByCinemaIdAsync(Guid cinemaId)
    {
        return await _dbContext.Set<BannerEntity>()
            .Where(x => x.CinemaId == cinemaId)
            .AsNoTracking()
            .ToListAsync();
    }

    public async Task<List<BannerEntity>> GetActiveSystemBannersAsync()
    {
        var now = DateTime.UtcNow;
        return await _dbContext.Set<BannerEntity>()
            .Where(x => x.IsActive
                        && !x.CinemaId.HasValue
                        && x.CinemaCity == null
                        && (!x.StartDisplayAt.HasValue || x.StartDisplayAt <= now)
                        && (!x.EndDisplayAt.HasValue || x.EndDisplayAt >= now))
            .AsNoTracking()
            .ToListAsync();
    }

    public async Task RemoveRangeAsync(IEnumerable<BannerEntity> banners)
    {
        _dbContext.Set<BannerEntity>().RemoveRange(banners);
        await Task.CompletedTask;
    }

    public async Task<List<MovieInfoEntity>> GetTopTrendingMoviesAsync(int count, List<string>? manualIds)
    {
        var query = _dbContext.Set<MovieInfoEntity>()
            .Where(m => !m.IsDeleted && !m.IsCommingSoon);

        if (manualIds != null && manualIds.Count > 0)
        {
            var ids = manualIds.Select(id => Guid.TryParse(id, out var g) ? g : Guid.Empty).Where(g => g != Guid.Empty).ToList();
            query = query.Where(m => ids.Contains(m.MovieId));
        }
        else
        {
            query = query.OrderByDescending(m => m.InterestCount).ThenByDescending(m => m.CreatedAt);
        }

        return await query.Take(count).AsNoTracking().ToListAsync();
    }

    public async Task<List<MovieInfoEntity>> GetTopUpcomingMoviesAsync(int count, List<string>? manualIds)
    {
        var query = _dbContext.Set<MovieInfoEntity>()
            .Where(m => !m.IsDeleted && m.IsCommingSoon);

        if (manualIds != null && manualIds.Count > 0)
        {
            var ids = manualIds.Select(id => Guid.TryParse(id, out var g) ? g : Guid.Empty).Where(g => g != Guid.Empty).ToList();
            query = query.Where(m => ids.Contains(m.MovieId));
        }
        else
        {
            query = query.OrderByDescending(m => m.InterestCount).ThenByDescending(m => m.CreatedAt);
        }

        return await query.Take(count).AsNoTracking().ToListAsync();
    }

    public async Task<List<VoucherInfoEntity>> GetHotVouchersAsync(int count, List<string>? manualIds)
    {
        var query = _dbContext.Set<VoucherInfoEntity>()
            .Where(v => v.RemainingQuantity > 0);

        if (manualIds != null && manualIds.Count > 0)
        {
            var ids = manualIds.Select(id => Guid.TryParse(id, out var g) ? g : Guid.Empty).Where(g => g != Guid.Empty).ToList();
            query = query.Where(v => ids.Contains(v.voucherId));
        }
        else
        {
            query = query.OrderByDescending(v => v.VoucherQuantity).ThenByDescending(v => v.ValidFrom);
        }

        return await query.Take(count).AsNoTracking().ToListAsync();
    }
}
