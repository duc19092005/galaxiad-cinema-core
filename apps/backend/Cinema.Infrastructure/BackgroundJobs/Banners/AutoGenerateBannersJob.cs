using System;
using System.Linq;
using System.Threading.Tasks;
using Cinema.Domain.Entities.Banners;
using Cinema.Domain.Entities.CinemaInfos;
using Cinema.Domain.Enums;
using Cinema.Domain.Interfaces.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Cinema.Infrastructure.BackgroundJobs.Banners;

/// <summary>
/// Auto-generates default banners:
/// 1. System-wide banners (Trending, Upcoming, HotVouchers) — fallback for all
/// 2. Per-city banners — for each distinct city
/// Runs on startup + every 6 hours.
/// </summary>
public class AutoGenerateBannersJob
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ILogger<AutoGenerateBannersJob> _logger;

    public AutoGenerateBannersJob(IUnitOfWork unitOfWork, ILogger<AutoGenerateBannersJob> logger)
    {
        _unitOfWork = unitOfWork;
        _logger = logger;
    }

    public async Task ExecuteAsync()
    {
        try
        {
            var types = new[] { BannerContentType.Trending, BannerContentType.Upcoming, BannerContentType.HotVouchers };
            var created = 0;

            // 1. Ensure system-wide banners exist
            var hasSystemBanners = await _unitOfWork.Repository<BannerEntity>().Query()
                .AnyAsync(b => !b.CinemaId.HasValue && b.CinemaCity == null);

            if (!hasSystemBanners)
            {
                var order = 1;
                foreach (var contentType in types)
                {
                    await _unitOfWork.Repository<BannerEntity>().AddAsync(CreateBanner(contentType, order++, null, null));
                    created++;
                }
                _logger.LogInformation("AutoGenerateBanners: Created {Count} system-wide banners", types.Length);
            }

            // 2. Ensure per-city banners exist
            var cities = await _unitOfWork.Repository<CinemaInfoEntity>().Query()
                .Where(c => !c.IsDeleted)
                .Select(c => c.CinemaCity)
                .Distinct()
                .ToListAsync();

            var existingCityBanners = await _unitOfWork.Repository<BannerEntity>().Query()
                .Where(b => b.CinemaCity != null && !b.CinemaId.HasValue)
                .Select(b => b.CinemaCity!)
                .Distinct()
                .ToListAsync();

            var citiesWithBanners = existingCityBanners.ToHashSet();
            var citiesNeedingBanners = cities.Where(c => !string.IsNullOrEmpty(c) && !citiesWithBanners.Contains(c)).ToList();

            foreach (var city in citiesNeedingBanners)
            {
                var order = 1;
                foreach (var contentType in types)
                {
                    await _unitOfWork.Repository<BannerEntity>().AddAsync(CreateBanner(contentType, order++, null, city));
                    created++;
                }
            }

            if (created > 0)
            {
                await _unitOfWork.SaveChangesAsync();
                _logger.LogInformation("AutoGenerateBanners: Total {Count} banners created ({CityCount} cities)", created, citiesNeedingBanners.Count);
            }
            else
            {
                _logger.LogInformation("AutoGenerateBanners: All banners already exist.");
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "AutoGenerateBanners: Error during auto-generation");
            throw;
        }
    }

    private static BannerEntity CreateBanner(BannerContentType contentType, int order, Guid? cinemaId, string? cinemaCity)
    {
        return new BannerEntity
        {
            BannerId = Guid.NewGuid(),
            Title = contentType switch
            {
                BannerContentType.Trending => "Thịnh hành",
                BannerContentType.Upcoming => "Sắp ra mắt",
                BannerContentType.HotVouchers => "Voucher hot",
                _ => contentType.ToString()
            },
            ContentType = contentType,
            ContentConfig = "{\"mode\":\"auto\",\"maxItems\":2,\"selectedIds\":[]}",
            DisplayOrder = order,
            IsActive = true,
            CinemaId = cinemaId,
            CinemaCity = cinemaCity,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
        };
    }
}
