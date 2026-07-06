using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using Cinema.Application.Dtos.Banners;
using Cinema.Application.Interfaces.Banners;
using Cinema.Domain.Entities.Banners;
using Cinema.Domain.Enums;

namespace Cinema.Application.UseCases.Public;

public class GetActiveBannersUseCase
{
    private readonly IBannerRepository _repository;

    public GetActiveBannersUseCase(IBannerRepository repository)
    {
        _repository = repository;
    }

    public async Task<List<PublicBannerDto>> ExecuteAsync(Guid? cinemaId, string? cinemaCity)
    {
        var banners = await _repository.GetActiveBannersAsync(cinemaId, cinemaCity);
        var result = new List<PublicBannerDto>();

        foreach (var banner in banners)
        {
            var dto = new PublicBannerDto
            {
                BannerId = banner.BannerId,
                Title = banner.Title,
                Subtitle = banner.Subtitle,
                ImageUrl = banner.ImageUrl,
                LinkUrl = banner.LinkUrl,
                ContentType = banner.ContentType,
                ContentTypeDisplay = banner.ContentType.ToString(),
                DisplayOrder = banner.DisplayOrder,
            };

            dto.Items = await ResolveContentItemsAsync(banner);
            result.Add(dto);
        }

        return result;
    }

    private async Task<List<BannerContentItemDto>> ResolveContentItemsAsync(BannerEntity banner)
    {
        var config = ParseConfig(banner.ContentConfig);
        var maxItems = config.MaxItems > 0 ? config.MaxItems : 2;
        var manualIds = config.Mode == "manual" && config.SelectedIds.Count > 0 ? config.SelectedIds : null;

        switch (banner.ContentType)
        {
            case BannerContentType.Fixed:
                return [];

            case BannerContentType.Trending:
                var trending = await _repository.GetTopTrendingMoviesAsync(maxItems, manualIds);
                return trending.Select(m => new BannerContentItemDto
                {
                    Id = m.MovieId.ToString(),
                    Name = m.MovieName,
                    ImageUrl = m.MovieImageUrl,
                    Description = m.MovieDescription?.Length > 100 ? m.MovieDescription[..100] + "..." : m.MovieDescription,
                }).ToList();

            case BannerContentType.Upcoming:
                var upcoming = await _repository.GetTopUpcomingMoviesAsync(maxItems, manualIds);
                return upcoming.Select(m => new BannerContentItemDto
                {
                    Id = m.MovieId.ToString(),
                    Name = m.MovieName,
                    ImageUrl = m.MovieImageUrl,
                    Description = m.MovieDescription?.Length > 100 ? m.MovieDescription[..100] + "..." : m.MovieDescription,
                }).ToList();

            case BannerContentType.HotVouchers:
                var vouchers = await _repository.GetHotVouchersAsync(maxItems, manualIds);
                return vouchers.Select(v => new BannerContentItemDto
                {
                    Id = v.voucherId.ToString(),
                    Name = v.voucherName,
                    Description = v.voucherDescription,
                    Extra = $"{v.voucherDiscountPercent}% off",
                }).ToList();

            default:
                return [];
        }
    }

    private static BannerConfig ParseConfig(string? raw)
    {
        if (string.IsNullOrWhiteSpace(raw)) return new BannerConfig();
        try
        {
            var doc = JsonDocument.Parse(raw);
            var root = doc.RootElement;
            var config = new BannerConfig
            {
                Mode = root.TryGetProperty("mode", out var m) ? m.GetString() ?? "auto" : "auto",
                MaxItems = root.TryGetProperty("maxItems", out var mi) ? mi.GetInt32() : 2
            };
            if (root.TryGetProperty("selectedIds", out var ids) && ids.ValueKind == JsonValueKind.Array)
            {
                config.SelectedIds = ids.EnumerateArray().Select(x => x.GetString() ?? "").Where(x => !string.IsNullOrEmpty(x)).ToList();
            }
            return config;
        }
        catch { return new BannerConfig(); }
    }
}

internal class BannerConfig
{
    public string Mode { get; set; } = "auto";
    public int MaxItems { get; set; } = 2;
    public List<string> SelectedIds { get; set; } = [];
}
