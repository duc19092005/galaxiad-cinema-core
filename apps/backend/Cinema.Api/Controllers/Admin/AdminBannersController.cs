using System;
using System.Linq;
using System.Threading.Tasks;
using Cinema.Application.Dtos.Banners;
using Cinema.Application.Interfaces;
using Cinema.Application.Interfaces.Banners;
using Cinema.Application.UseCases.Admin.Banners;
using Cinema.Domain.Entities.Banners;
using Cinema.Domain.Entities.CinemaInfos;
using Cinema.Domain.Enums;
using Cinema.Domain.Entities.MovieInfos;
using Cinema.Domain.Entities.Vouchers;
using Cinema.Domain.Interfaces.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Cinema.Api.Controllers.Admin;

public class CopyOverrideRequest
{
    public List<Guid> CinemaIds { get; set; } = [];
}

[ApiController]
[Authorize(Roles = "Admin")]
[Route("api/v1/admin/banners")]
[Tags("Admin - Banners")]
[ApiExplorerSettings(GroupName = "v1-admin")]
public class AdminBannersController : ControllerBase
{
    private readonly GetAllBannersUseCase _getAllBannersUseCase;
    private readonly GetBannerByIdUseCase _getBannerByIdUseCase;
    private readonly CreateBannerUseCase _createBannerUseCase;
    private readonly UpdateBannerUseCase _updateBannerUseCase;
    private readonly DeleteBannerUseCase _deleteBannerUseCase;
    private readonly ToggleBannerUseCase _toggleBannerUseCase;
    private readonly GetBannerScopeUseCase _getBannerScopeUseCase;
    private readonly IBannerRepository _bannerRepository;
    private readonly IUserContextService _userContextService;
    private readonly IUnitOfWork _unitOfWork;

    public AdminBannersController(
        GetAllBannersUseCase getAllBannersUseCase,
        GetBannerByIdUseCase getBannerByIdUseCase,
        CreateBannerUseCase createBannerUseCase,
        UpdateBannerUseCase updateBannerUseCase,
        DeleteBannerUseCase deleteBannerUseCase,
        ToggleBannerUseCase toggleBannerUseCase,
        GetBannerScopeUseCase getBannerScopeUseCase,
        IBannerRepository bannerRepository,
        IUserContextService userContextService,
        IUnitOfWork unitOfWork)
    {
        _getAllBannersUseCase = getAllBannersUseCase;
        _getBannerByIdUseCase = getBannerByIdUseCase;
        _createBannerUseCase = createBannerUseCase;
        _updateBannerUseCase = updateBannerUseCase;
        _deleteBannerUseCase = deleteBannerUseCase;
        _toggleBannerUseCase = toggleBannerUseCase;
        _getBannerScopeUseCase = getBannerScopeUseCase;
        _bannerRepository = bannerRepository;
        _userContextService = userContextService;
        _unitOfWork = unitOfWork;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        return Ok(await _getAllBannersUseCase.ExecuteAsync());
    }

    [HttpGet("scope")]
    public async Task<IActionResult> GetScope()
    {
        return Ok(await _getBannerScopeUseCase.ExecuteAsync());
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        return Ok(await _getBannerByIdUseCase.ExecuteAsync(id));
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] BannerUpsertDto dto)
    {
        var result = await _createBannerUseCase.ExecuteAsync(dto);
        return Ok(result);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] BannerUpsertDto dto)
    {
        return Ok(await _updateBannerUseCase.ExecuteAsync(id, dto));
    }

    [HttpPatch("{id:guid}/toggle")]
    public async Task<IActionResult> Toggle(Guid id)
    {
        return Ok(await _toggleBannerUseCase.ExecuteAsync(id));
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        await _deleteBannerUseCase.ExecuteAsync(id);
        return NoContent();
    }

    /// <summary>
    /// Get banner overview: system-wide banners + all cinemas grouped by city with their banner status
    /// </summary>
    [HttpGet("overview")]
    public async Task<IActionResult> GetOverview()
    {
        var allBanners = await _getAllBannersUseCase.ExecuteAsync();
        var systemBanners = allBanners.Where(b => b.CinemaId == null && b.CinemaCity == null).ToList();

        var cinemas = await _unitOfWork.Repository<CinemaInfoEntity>().Query()
            .Where(c => !c.IsDeleted)
            .OrderBy(c => c.CinemaCity).ThenBy(c => c.CinemaName)
            .Select(c => new { c.CinemaId, c.CinemaName, c.CinemaCity })
            .AsNoTracking()
            .ToListAsync();

        var allCinemas = cinemas.Select(c =>
        {
            var cinemaBanners = allBanners.Where(b => b.CinemaId == c.CinemaId).ToList();
            var hasOverride = systemBanners.Any(); // system-wide banners apply to all cinemas
            return new
            {
                c.CinemaId,
                c.CinemaName,
                c.CinemaCity,
                bannerCount = cinemaBanners.Count,
                banners = cinemaBanners,
                hasOverride
            };
        }).ToList();

        var cinemasByCity = allCinemas
            .GroupBy(c => c.CinemaCity)
            .ToDictionary(g => g.Key, g => g.ToList());

        return Ok(new { systemBanners, cinemasByCity, allCinemas });
    }

    /// <summary>
    /// Copy system-wide banners to specific local cinemas (skip if same contentType exists)
    /// </summary>
    [HttpPost("copy-to-local")]
    public async Task<IActionResult> CopySystemToLocal([FromBody] CopyOverrideRequest request)
    {
        var systemBanners = await _bannerRepository.GetActiveSystemBannersAsync();
        if (systemBanners.Count == 0)
            return BadRequest(new { message = "Không có banner toàn hệ thống để copy." });

        var userId = TryGetUserId();
        var copied = 0;

        foreach (var cinemaId in request.CinemaIds)
        {
            var localBanners = await _bannerRepository.GetBannersByCinemaIdAsync(cinemaId);
            var localTypes = localBanners.Select(b => b.ContentType).ToHashSet();

            foreach (var sys in systemBanners)
            {
                if (localTypes.Contains(sys.ContentType)) continue; // skip if already exists

                var banner = new BannerEntity
                {
                    BannerId = Guid.NewGuid(),
                    Title = sys.Title, Subtitle = sys.Subtitle,
                    ImageUrl = sys.ImageUrl, LinkUrl = sys.LinkUrl,
                    ContentType = sys.ContentType, ContentConfig = sys.ContentConfig,
                    DisplayOrder = sys.DisplayOrder, IsActive = true,
                    CinemaId = cinemaId, CinemaCity = null,
                    StartDisplayAt = sys.StartDisplayAt, EndDisplayAt = sys.EndDisplayAt,
                    CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow,
                    CreatedBy = userId, UpdatedBy = userId,
                };
                await _bannerRepository.AddBannerAsync(banner);
                copied++;
            }
        }

        await _unitOfWork.SaveChangesAsync();
        return Ok(new { message = $"Đã copy {copied} banner." });
    }

    /// <summary>
    /// Override local cinema banners with system-wide banners (delete old, copy new)
    /// </summary>
    [HttpPost("override-local")]
    public async Task<IActionResult> OverrideLocal([FromBody] CopyOverrideRequest request)
    {
        var systemBanners = await _bannerRepository.GetActiveSystemBannersAsync();
        if (systemBanners.Count == 0)
            return BadRequest(new { message = "Không có banner toàn hệ thống để ghi đè." });

        var userId = TryGetUserId();
        var overridden = 0;

        foreach (var cinemaId in request.CinemaIds)
        {
            // Delete existing local banners
            var localBanners = await _bannerRepository.GetBannersByCinemaIdAsync(cinemaId);
            if (localBanners.Count > 0)
                await _bannerRepository.RemoveRangeAsync(localBanners);

            // Copy system banners
            foreach (var sys in systemBanners)
            {
                var banner = new BannerEntity
                {
                    BannerId = Guid.NewGuid(),
                    Title = sys.Title, Subtitle = sys.Subtitle,
                    ImageUrl = sys.ImageUrl, LinkUrl = sys.LinkUrl,
                    ContentType = sys.ContentType, ContentConfig = sys.ContentConfig,
                    DisplayOrder = sys.DisplayOrder, IsActive = true,
                    CinemaId = cinemaId, CinemaCity = null,
                    StartDisplayAt = sys.StartDisplayAt, EndDisplayAt = sys.EndDisplayAt,
                    CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow,
                    CreatedBy = userId, UpdatedBy = userId,
                };
                await _bannerRepository.AddBannerAsync(banner);
                overridden++;
            }
        }

        await _unitOfWork.SaveChangesAsync();
        return Ok(new { message = $"Đã ghi đè {overridden} banner cho {request.CinemaIds.Count} rạp." });
    }

    private Guid? TryGetUserId()
    {
        try { return _userContextService.GetUserId(); }
        catch { return null; }
    }

    /// <summary>
    /// Get movie list for admin manual picker
    /// </summary>
    [HttpGet("picker/movies")]
    public async Task<IActionResult> GetMoviesForPicker([FromQuery] string? status)
    {
        var query = _unitOfWork.Repository<MovieInfoEntity>().Query()
            .Where(m => !m.IsDeleted);

        if (status == "trending")
        {
            query = query.Where(m => !m.IsCommingSoon)
                         .OrderByDescending(m => m.CreatedAt);
        }
        else if (status == "upcoming")
        {
            query = query.Where(m => m.IsCommingSoon)
                         .OrderByDescending(m => m.CreatedAt);
        }
        else
        {
            query = query.OrderByDescending(m => m.CreatedAt);
        }

        var movies = await query
            .Take(50)
            .Select(m => new { movieId = m.MovieId, movieName = m.MovieName, movieImageUrl = m.MovieImageUrl, isComingSoon = m.IsCommingSoon })
            .AsNoTracking()
            .ToListAsync();

        return Ok(movies);
    }

    /// <summary>
    /// Get voucher list for admin manual picker
    /// </summary>
    [HttpGet("picker/vouchers")]
    public async Task<IActionResult> GetVouchersForPicker()
    {
        var vouchers = await _unitOfWork.Repository<VoucherInfoEntity>().Query()
            .Where(v => v.RemainingQuantity > 0)
            .OrderByDescending(v => v.ValidFrom)
            .Take(50)
            .Select(v => new { voucherId = v.voucherId, voucherName = v.voucherName, discountPercent = v.voucherDiscountPercent, pointsCost = v.VoucherPointsCost, stock = v.RemainingQuantity })
            .AsNoTracking()
            .ToListAsync();

        return Ok(vouchers);
    }

    /// <summary>
    /// Auto-generate banners for all cinemas that don't have banners yet.
    /// Creates 3 banners per cinema: Trending (2), Upcoming (2), HotVouchers (2) — auto mode.
    /// </summary>
    [HttpPost("auto-all")]
    public async Task<IActionResult> AutoGenerateAll()
    {
        var cinemas = await _unitOfWork.Repository<CinemaInfoEntity>().Query()
            .Where(c => !c.IsDeleted)
            .OrderBy(c => c.CinemaCity).ThenBy(c => c.CinemaName)
            .Select(c => new { c.CinemaId, c.CinemaName, c.CinemaCity })
            .AsNoTracking()
            .ToListAsync();

        var existingBanners = await _bannerRepository.GetAllBannersAsync();
        var cinemasWithBanners = existingBanners
            .Where(b => b.CinemaId.HasValue)
            .Select(b => b.CinemaId!.Value)
            .ToHashSet();

        var userId = TryGetUserId();
        var created = 0;

        foreach (var cinema in cinemas)
        {
            if (cinemasWithBanners.Contains(cinema.CinemaId)) continue; // skip cinemas that already have banners

            var types = new[] { BannerContentType.Trending, BannerContentType.Upcoming, BannerContentType.HotVouchers };
            var order = 1;

            foreach (var contentType in types)
            {
                var banner = new BannerEntity
                {
                    BannerId = Guid.NewGuid(),
                    Title = contentType.ToString(),
                    ContentType = contentType,
                    ContentConfig = "{\"mode\":\"auto\",\"maxItems\":2,\"selectedIds\":[]}",
                    DisplayOrder = order++,
                    IsActive = true,
                    CinemaId = cinema.CinemaId,
                    CinemaCity = null,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow,
                    CreatedBy = userId,
                    UpdatedBy = userId,
                };
                await _bannerRepository.AddBannerAsync(banner);
                created++;
            }
        }

        await _unitOfWork.SaveChangesAsync();
        return Ok(new { message = $"Đã tạo {created} banner cho {cinemas.Count(c => !cinemasWithBanners.Contains(c.CinemaId))} rạp." });
    }
}
