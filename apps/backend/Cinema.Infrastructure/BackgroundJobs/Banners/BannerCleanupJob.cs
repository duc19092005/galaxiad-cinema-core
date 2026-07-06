using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using Cinema.Domain.Entities.Banners;
using Cinema.Domain.Entities.MovieInfos;
using Cinema.Domain.Entities.Vouchers;
using Cinema.Domain.Enums;
using Cinema.Domain.Interfaces.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Cinema.Infrastructure.BackgroundJobs.Banners;

/// <summary>
/// Cronjob that validates banner content config.
/// - Auto mode banners: no action needed (content fetched live at query time)
/// - Manual mode banners: checks if selected movie/voucher IDs still exist and are valid.
///   If a manually selected item is deleted/outdated, it's removed from the banner's selectedIds.
///   If all selected items are removed, the banner is deactivated.
/// Also auto-deactivates expired banners (past EndDisplayAt).
/// </summary>
public class BannerCleanupJob
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ILogger<BannerCleanupJob> _logger;

    public BannerCleanupJob(IUnitOfWork unitOfWork, ILogger<BannerCleanupJob> logger)
    {
        _unitOfWork = unitOfWork;
        _logger = logger;
    }

    public async Task ExecuteAsync()
    {
        try
        {
            var banners = await _unitOfWork.Repository<BannerEntity>().Query()
                .Where(b => b.IsActive)
                .ToListAsync();

            var now = DateTime.UtcNow;
            var changes = 0;

            // 1. Deactivate expired banners
            foreach (var banner in banners.Where(b => b.EndDisplayAt.HasValue && b.EndDisplayAt.Value <= now))
            {
                banner.IsActive = false;
                banner.UpdatedAt = now;
                changes++;
                _logger.LogInformation("BannerCleanup: Deactivated expired banner {BannerId} ({Title})", banner.BannerId, banner.Title);
            }

            // 2. Validate manual mode banners
            foreach (var banner in banners.Where(b => b.IsActive && !string.IsNullOrEmpty(b.ContentConfig)))
            {
                var config = ParseConfig(banner.ContentConfig);
                if (config.Mode != "manual" || config.SelectedIds.Count == 0) continue;

                List<Guid> validIds;
                switch (banner.ContentType)
                {
                    case BannerContentType.Trending:
                        validIds = await GetValidMovieIds(config.SelectedIds, comingSoonOnly: false);
                        break;
                    case BannerContentType.Upcoming:
                        validIds = await GetValidMovieIds(config.SelectedIds, comingSoonOnly: true);
                        break;
                    case BannerContentType.HotVouchers:
                        validIds = await GetValidVoucherIds(config.SelectedIds);
                        break;
                    default:
                        continue; // Fixed banners don't need validation
                }

                if (validIds.Count == config.SelectedIds.Count) continue; // all valid

                if (validIds.Count == 0)
                {
                    // All selected items are gone → deactivate banner
                    banner.IsActive = false;
                    banner.UpdatedAt = now;
                    changes++;
                    _logger.LogInformation("BannerCleanup: Deactivated banner {BannerId} ({Title}) — all selected items invalid", banner.BannerId, banner.Title);
                }
                else
                {
                    // Some items removed → update config
                    config.SelectedIds = validIds.Select(g => g.ToString()).ToList();
                    banner.ContentConfig = JsonSerializer.Serialize(config);
                    banner.UpdatedAt = now;
                    changes++;
                    _logger.LogInformation("BannerCleanup: Updated banner {BannerId} ({Title}) — {Removed} items removed, {Kept} kept",
                        banner.BannerId, banner.Title, config.SelectedIds.Count - validIds.Count, validIds.Count);
                }
            }

            if (changes > 0)
            {
                await _unitOfWork.SaveChangesAsync();
                _logger.LogInformation("BannerCleanup: Completed with {Changes} changes", changes);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "BannerCleanup: Error during banner cleanup");
            throw;
        }
    }

    private async Task<List<Guid>> GetValidMovieIds(List<string> ids, bool comingSoonOnly)
    {
        var guidIds = ids.Select(id => Guid.TryParse(id, out var g) ? g : Guid.Empty).Where(g => g != Guid.Empty).ToList();
        var query = _unitOfWork.Repository<MovieInfoEntity>().Query()
            .Where(m => guidIds.Contains(m.MovieId) && !m.IsDeleted);

        if (comingSoonOnly)
            query = query.Where(m => m.IsCommingSoon);
        else
            query = query.Where(m => !m.IsCommingSoon);

        return await query.Select(m => m.MovieId.ToString()).ToListAsync()
            .ContinueWith(t => t.Result.Select(id => Guid.Parse(id)).ToList());
    }

    private async Task<List<Guid>> GetValidVoucherIds(List<string> ids)
    {
        var guidIds = ids.Select(id => Guid.TryParse(id, out var g) ? g : Guid.Empty).Where(g => g != Guid.Empty).ToList();
        return await _unitOfWork.Repository<VoucherInfoEntity>().Query()
            .Where(v => guidIds.Contains(v.voucherId) && v.RemainingQuantity > 0)
            .Select(v => v.voucherId)
            .ToListAsync();
    }

    private static BannerCleanupConfig ParseConfig(string? raw)
    {
        if (string.IsNullOrWhiteSpace(raw)) return new BannerCleanupConfig();
        try
        {
            var doc = JsonDocument.Parse(raw);
            var root = doc.RootElement;
            var config = new BannerCleanupConfig
            {
                Mode = root.TryGetProperty("mode", out var m) ? m.GetString() ?? "auto" : "auto",
                MaxItems = root.TryGetProperty("maxItems", out var mi) ? mi.GetInt32() : 5
            };
            if (root.TryGetProperty("selectedIds", out var ids) && ids.ValueKind == JsonValueKind.Array)
            {
                config.SelectedIds = ids.EnumerateArray().Select(x => x.GetString() ?? "").Where(x => !string.IsNullOrEmpty(x)).ToList();
            }
            return config;
        }
        catch { return new BannerCleanupConfig(); }
    }
}

internal class BannerCleanupConfig
{
    public string Mode { get; set; } = "auto";
    public int MaxItems { get; set; } = 5;
    public List<string> SelectedIds { get; set; } = [];
}
