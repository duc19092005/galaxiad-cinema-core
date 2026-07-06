using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Cinema.Domain.Entities.Banners;

namespace Cinema.Application.Interfaces.Banners;

public interface IBannerRepository
{
    Task<List<BannerEntity>> GetAllBannersAsync();
    Task<List<BannerEntity>> GetActiveBannersAsync(Guid? cinemaId, string? cinemaCity);
    Task<BannerEntity?> GetBannerByIdAsync(Guid id);
    Task<BannerEntity?> AddBannerAsync(BannerEntity banner);
    void UpdateBanner(BannerEntity banner);
    void RemoveBanner(BannerEntity banner);
    Task<int> GetMaxDisplayOrderAsync();
    Task<List<string>> GetDistinctCitiesAsync();
    Task<BannerEntity?> FindExistingByScopeAsync(Guid? cinemaId, string? cinemaCity);
    Task<List<BannerEntity>> GetBannersByCinemaIdAsync(Guid cinemaId);
    Task<List<BannerEntity>> GetActiveSystemBannersAsync();
    Task RemoveRangeAsync(IEnumerable<BannerEntity> banners);
    Task<List<Domain.Entities.MovieInfos.MovieInfoEntity>> GetTopTrendingMoviesAsync(int count, List<string>? manualIds);
    Task<List<Domain.Entities.MovieInfos.MovieInfoEntity>> GetTopUpcomingMoviesAsync(int count, List<string>? manualIds);
    Task<List<Domain.Entities.Vouchers.VoucherInfoEntity>> GetHotVouchersAsync(int count, List<string>? manualIds);
}
