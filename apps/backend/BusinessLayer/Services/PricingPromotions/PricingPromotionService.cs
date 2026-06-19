using System.Text.Json;
using System.Text.RegularExpressions;
using BusinessLayer.Dtos.PricingPromotions;
using BusinessLayer.Entities.CinemaInfos;
using BusinessLayer.Entities.MovieInfos;
using BusinessLayer.Entities.Promotions;
using BusinessLayer.Entities.UserInfos;
using BusinessLayer.Services.IdentityAccess;
using Microsoft.EntityFrameworkCore;
using Shared.Enums;
using Shared.Exceptions;
using Shared.Interfaces.Persistence;
using Shared.Utils;

namespace BusinessLayer.Services.PricingPromotions;

public class PricingPromotionCalculationResult
{
    public decimal BasePrice { get; set; }
    public decimal FinalPrice { get; set; }
    public decimal TotalAdjustmentAmount { get; set; }
    public List<AppliedPricingPromotionDto> AppliedPromotions { get; set; } = [];
    public string SnapshotJson => JsonSerializer.Serialize(AppliedPromotions);
}

public class PricingPromotionService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IUserContextService _userContextService;

    public PricingPromotionService(IUnitOfWork unitOfWork, IUserContextService userContextService)
    {
        _unitOfWork = unitOfWork;
        _userContextService = userContextService;
    }

    public async Task<List<PricingPromotionDto>> GetAllAsync()
    {
        var promotions = await QueryPromotions()
            .OrderByDescending(x => x.UpdatedAt)
            .ToListAsync();

        return promotions.Select(MapPromotion).ToList();
    }

    public async Task<List<PricingPromotionDto>> GetActivePublicAsync()
    {
        var now = DateTime.UtcNow;
        var promotions = await QueryPromotions()
            .Where(x => x.IsActive
                        && (!x.StartDate.HasValue || x.StartDate <= now)
                        && (!x.EndDate.HasValue || x.EndDate >= now))
            .OrderByDescending(x => x.UpdatedAt)
            .ToListAsync();

        return promotions.Select(MapPromotion).ToList();
    }

    public async Task<PricingPromotionDto> GetByIdAsync(Guid id)
    {
        var promotion = await QueryPromotions()
            .FirstOrDefaultAsync(x => x.PricingPromotionId == id);

        if (promotion == null)
        {
            throw new NotFoundException("Pricing promotion not found.");
        }

        return MapPromotion(promotion);
    }

    public async Task<PricingPromotionDto> GetBySlugAsync(string slug)
    {
        var now = DateTime.UtcNow;
        var promotion = await QueryPromotions()
            .FirstOrDefaultAsync(x => x.Slug == slug
                                      && x.IsActive
                                      && (!x.StartDate.HasValue || x.StartDate <= now)
                                      && (!x.EndDate.HasValue || x.EndDate >= now));

        if (promotion == null)
        {
            throw new NotFoundException("Pricing promotion not found.");
        }

        return MapPromotion(promotion);
    }

    public async Task<PricingPromotionDto> CreateAsync(PricingPromotionUpsertDto dto)
    {
        var userId = TryGetUserId();
        var slug = await BuildUniqueSlugAsync(dto.Slug, dto.Title);
        var promotion = new PricingPromotionEntity
        {
            PricingPromotionId = Guid.NewGuid(),
            Name = dto.Name.Trim(),
            Slug = slug,
            Title = dto.Title.Trim(),
            ShortDescription = dto.ShortDescription.Trim(),
            Description = dto.Description.Trim(),
            TermsAndConditions = dto.TermsAndConditions.Trim(),
            ImageUrl = string.IsNullOrWhiteSpace(dto.ImageUrl) ? null : dto.ImageUrl.Trim(),
            IsActive = dto.IsActive,
            ExcludeHolidays = dto.ExcludeHolidays,
            StartDate = DateTimeHelper.NormalizeIncoming(dto.StartDate),
            EndDate = DateTimeHelper.NormalizeIncoming(dto.EndDate),
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            CreatedBy = userId,
            UpdatedBy = userId,
            Rules = dto.Rules.Select(BuildRule).ToList()
        };

        await _unitOfWork.Repository<PricingPromotionEntity>().AddAsync(promotion);
        await _unitOfWork.SaveChangesAsync();
        return await GetByIdAsync(promotion.PricingPromotionId);
    }

    public async Task<PricingPromotionDto> UpdateAsync(Guid id, PricingPromotionUpsertDto dto)
    {
        var promotion = await _unitOfWork.Repository<PricingPromotionEntity>().Query()
            .Include(x => x.Rules)
            .FirstOrDefaultAsync(x => x.PricingPromotionId == id);

        if (promotion == null)
        {
            throw new NotFoundException("Pricing promotion not found.");
        }

        promotion.Name = dto.Name.Trim();
        promotion.Slug = await BuildUniqueSlugAsync(dto.Slug, dto.Title, id);
        promotion.Title = dto.Title.Trim();
        promotion.ShortDescription = dto.ShortDescription.Trim();
        promotion.Description = dto.Description.Trim();
        promotion.TermsAndConditions = dto.TermsAndConditions.Trim();
        promotion.ImageUrl = string.IsNullOrWhiteSpace(dto.ImageUrl) ? null : dto.ImageUrl.Trim();
        promotion.IsActive = dto.IsActive;
        promotion.ExcludeHolidays = dto.ExcludeHolidays;
        promotion.StartDate = DateTimeHelper.NormalizeIncoming(dto.StartDate);
        promotion.EndDate = DateTimeHelper.NormalizeIncoming(dto.EndDate);
        promotion.UpdatedAt = DateTime.UtcNow;
        promotion.UpdatedBy = TryGetUserId();

        _unitOfWork.Repository<PricingPromotionRuleEntity>().RemoveRange(promotion.Rules);
        promotion.Rules = dto.Rules.Select(BuildRule).ToList();

        _unitOfWork.Repository<PricingPromotionEntity>().Update(promotion);
        await _unitOfWork.SaveChangesAsync();
        return await GetByIdAsync(id);
    }

    public async Task<PricingPromotionDto> ToggleAsync(Guid id)
    {
        var promotion = await _unitOfWork.Repository<PricingPromotionEntity>().Query()
            .FirstOrDefaultAsync(x => x.PricingPromotionId == id);

        if (promotion == null)
        {
            throw new NotFoundException("Pricing promotion not found.");
        }

        promotion.IsActive = !promotion.IsActive;
        promotion.UpdatedAt = DateTime.UtcNow;
        promotion.UpdatedBy = TryGetUserId();
        _unitOfWork.Repository<PricingPromotionEntity>().Update(promotion);
        await _unitOfWork.SaveChangesAsync();
        return await GetByIdAsync(id);
    }

    public async Task DeleteAsync(Guid id)
    {
        var promotion = await _unitOfWork.Repository<PricingPromotionEntity>().Query()
            .Include(x => x.Rules)
            .FirstOrDefaultAsync(x => x.PricingPromotionId == id);

        if (promotion == null)
        {
            throw new NotFoundException("Pricing promotion not found.");
        }

        _unitOfWork.Repository<PricingPromotionRuleEntity>().RemoveRange(promotion.Rules);
        _unitOfWork.Repository<PricingPromotionEntity>().Remove(promotion);
        await _unitOfWork.SaveChangesAsync();
    }

    public async Task<PricingPromotionOptionsDto> GetOptionsAsync()
    {
        var formats = await _unitOfWork.Repository<MovieFormatInfoEntity>().Query()
            .OrderBy(x => x.MovieFormatName)
            .Select(x => new PricingPromotionOptionDto { Id = x.MovieFormatId, Name = x.MovieFormatName })
            .ToListAsync();

        var cinemas = await _unitOfWork.Repository<CinemaInfoEntity>().Query()
            .Where(x => !x.IsDeleted)
            .OrderBy(x => x.CinemaName)
            .Select(x => new PricingPromotionOptionDto { Id = x.CinemaId, Name = x.CinemaName })
            .ToListAsync();

        var auditoriums = await _unitOfWork.Repository<AuditoriumInfoEntities>().Query()
            .Where(x => !x.IsDeleted)
            .OrderBy(x => x.AuditoriumNumber)
            .Select(x => new PricingPromotionOptionDto { Id = x.AuditoriumId, Name = x.AuditoriumNumber })
            .ToListAsync();

        return new PricingPromotionOptionsDto
        {
            Formats = formats,
            Cinemas = cinemas,
            Auditoriums = auditoriums
        };
    }

    public async Task<PricingPromotionCalculationResult> CalculateAsync(
        MovieScheduleInfoEntity schedule,
        decimal currentPrice,
        Guid? userSegmentId = null)
    {
        var result = new PricingPromotionCalculationResult
        {
            BasePrice = currentPrice,
            FinalPrice = currentPrice
        };

        var vietnamStart = DateTimeHelper.ToVietnamTime(schedule.StartTime);
        var showDateUtc = schedule.StartTime;
        var showDateVn = vietnamStart.Date;
        var showTime = vietnamStart.TimeOfDay;
        var showDayMask = DaysOfWeekMaskHelper.ToMask(vietnamStart.DayOfWeek);
        var cinemaId = schedule.AuditoriumInfoEntities?.CinemaId;

        var rules = await _unitOfWork.Repository<PricingPromotionRuleEntity>().Query()
            .Include(x => x.PricingPromotionEntity)
            .Where(x => x.IsActive
                        && x.PricingPromotionEntity.IsActive
                        && (!x.PricingPromotionEntity.StartDate.HasValue || x.PricingPromotionEntity.StartDate <= showDateUtc)
                        && (!x.PricingPromotionEntity.EndDate.HasValue || x.PricingPromotionEntity.EndDate >= showDateUtc)
                        && (!x.StartDate.HasValue || x.StartDate <= showDateUtc)
                        && (!x.EndDate.HasValue || x.EndDate >= showDateUtc)
                        && (!x.MovieFormatId.HasValue || x.MovieFormatId == schedule.MovieFormatId)
                        && (!x.CinemaId.HasValue || x.CinemaId == cinemaId)
                        && (!x.AuditoriumId.HasValue || x.AuditoriumId == schedule.AuditoriumId)
                        && (!x.RequiredMembershipTierId.HasValue || x.RequiredMembershipTierId == userSegmentId)
                        && (x.DaysOfWeekMask & showDayMask) != 0)
            .ToListAsync();

        var matchingRules = new List<PricingPromotionRuleEntity>();
        foreach (var rule in rules)
        {
            if (!IsTimeMatch(rule, showTime))
            {
                continue;
            }

            if (rule.PricingPromotionEntity.ExcludeHolidays
                && await IsHolidayAsync(showDateVn))
            {
                continue;
            }

            matchingRules.Add(rule);
        }

        var fixedRule = matchingRules
            .Where(x => x.PromotionType == PromotionTypeEnum.FixedTicketPrice)
            .OrderByDescending(x => x.Priority)
            .ThenBy(x => x.AdjustmentValue)
            .FirstOrDefault();

        if (fixedRule != null)
        {
            var before = result.FinalPrice;
            result.FinalPrice = Math.Max(0, fixedRule.AdjustmentValue);
            result.AppliedPromotions.Add(MapApplied(fixedRule, before, result.FinalPrice));
            result.TotalAdjustmentAmount = result.FinalPrice - result.BasePrice;
            return result;
        }

        foreach (var rule in matchingRules
                     .OrderByDescending(x => x.Priority)
                     .ThenBy(x => x.AdjustmentValue))
        {
            var before = result.FinalPrice;
            result.FinalPrice = ApplyRule(rule, result.FinalPrice);
            result.AppliedPromotions.Add(MapApplied(rule, before, result.FinalPrice));
        }

        result.TotalAdjustmentAmount = result.FinalPrice - result.BasePrice;
        return result;
    }

    private IQueryable<PricingPromotionEntity> QueryPromotions()
    {
        return _unitOfWork.Repository<PricingPromotionEntity>().Query()
            .Include(x => x.Rules)
            .ThenInclude(x => x.MovieFormatInfoEntity)
            .Include(x => x.Rules)
            .ThenInclude(x => x.CinemaInfoEntity)
            .Include(x => x.Rules)
            .ThenInclude(x => x.AuditoriumInfoEntity)
            .Include(x => x.Rules)
            .ThenInclude(x => x.RequiredMembershipTierEntity);
    }

    private static PricingPromotionRuleEntity BuildRule(PricingPromotionRuleRequestDto dto)
    {
        return new PricingPromotionRuleEntity
        {
            PricingPromotionRuleId = dto.PricingPromotionRuleId.GetValueOrDefault(Guid.NewGuid()),
            MovieFormatId = dto.MovieFormatId,
            CinemaId = dto.CinemaId,
            AuditoriumId = dto.AuditoriumId,
            RequiredMembershipTierId = dto.RequiredMembershipTierId,
            PromotionType = dto.PromotionType,
            AdjustmentValue = dto.AdjustmentValue,
            StartDate = DateTimeHelper.NormalizeIncoming(dto.StartDate),
            EndDate = DateTimeHelper.NormalizeIncoming(dto.EndDate),
            TimeFrom = dto.TimeFrom,
            TimeTo = dto.TimeTo,
            DaysOfWeekMask = DaysOfWeekMaskHelper.Encode(dto.DaysOfWeek),
            Priority = dto.Priority,
            IsActive = dto.IsActive
        };
    }

    private static PricingPromotionDto MapPromotion(PricingPromotionEntity promotion)
    {
        return new PricingPromotionDto
        {
            PricingPromotionId = promotion.PricingPromotionId,
            Name = promotion.Name,
            Slug = promotion.Slug,
            Title = promotion.Title,
            ShortDescription = promotion.ShortDescription,
            Description = promotion.Description,
            TermsAndConditions = promotion.TermsAndConditions,
            ImageUrl = promotion.ImageUrl,
            IsActive = promotion.IsActive,
            ExcludeHolidays = promotion.ExcludeHolidays,
            StartDate = promotion.StartDate,
            EndDate = promotion.EndDate,
            CreatedAt = promotion.CreatedAt,
            UpdatedAt = promotion.UpdatedAt,
            RuleCount = promotion.Rules.Count,
            Rules = promotion.Rules
                .OrderByDescending(x => x.Priority)
                .Select(MapRule)
                .ToList()
        };
    }

    private static PricingPromotionRuleDto MapRule(PricingPromotionRuleEntity rule)
    {
        return new PricingPromotionRuleDto
        {
            PricingPromotionRuleId = rule.PricingPromotionRuleId,
            MovieFormatId = rule.MovieFormatId,
            MovieFormatName = rule.MovieFormatInfoEntity?.MovieFormatName,
            CinemaId = rule.CinemaId,
            CinemaName = rule.CinemaInfoEntity?.CinemaName,
            AuditoriumId = rule.AuditoriumId,
            AuditoriumNumber = rule.AuditoriumInfoEntity?.AuditoriumNumber,
            RequiredMembershipTierId = rule.RequiredMembershipTierId,
            RequiredMembershipTierName = rule.RequiredMembershipTierEntity?.UserSegmentName,
            PromotionType = rule.PromotionType,
            PromotionTypeName = rule.PromotionType.ToString(),
            AdjustmentValue = rule.AdjustmentValue,
            StartDate = rule.StartDate,
            EndDate = rule.EndDate,
            TimeFrom = rule.TimeFrom,
            TimeTo = rule.TimeTo,
            DaysOfWeekMask = rule.DaysOfWeekMask,
            DaysOfWeek = DaysOfWeekMaskHelper.Decode(rule.DaysOfWeekMask),
            DaysOfWeekText = DaysOfWeekMaskHelper.DecodeText(rule.DaysOfWeekMask),
            Priority = rule.Priority,
            IsActive = rule.IsActive
        };
    }

    private static AppliedPricingPromotionDto MapApplied(PricingPromotionRuleEntity rule, decimal before, decimal after)
    {
        return new AppliedPricingPromotionDto
        {
            PromotionId = rule.PricingPromotionId,
            RuleId = rule.PricingPromotionRuleId,
            Title = rule.PricingPromotionEntity.Title,
            PromotionType = rule.PromotionType,
            PromotionTypeName = rule.PromotionType.ToString(),
            AdjustmentValue = rule.AdjustmentValue,
            AmountChanged = after - before,
            PriceBefore = before,
            PriceAfter = after
        };
    }

    private async Task<string> BuildUniqueSlugAsync(string? requestedSlug, string title, Guid? currentId = null)
    {
        var baseSlug = Slugify(string.IsNullOrWhiteSpace(requestedSlug) ? title : requestedSlug);
        var slug = baseSlug;
        var suffix = 2;
        while (await _unitOfWork.Repository<PricingPromotionEntity>().Query()
                   .AnyAsync(x => x.Slug == slug && (!currentId.HasValue || x.PricingPromotionId != currentId.Value)))
        {
            slug = $"{baseSlug}-{suffix++}";
        }

        return slug;
    }

    private static string Slugify(string value)
    {
        var lower = value.Trim().ToLowerInvariant();
        var slug = Regex.Replace(lower, @"[^a-z0-9]+", "-").Trim('-');
        return string.IsNullOrWhiteSpace(slug) ? Guid.NewGuid().ToString("N")[..12] : slug;
    }

    private static bool IsTimeMatch(PricingPromotionRuleEntity rule, TimeSpan showTime)
    {
        if (!rule.TimeFrom.HasValue && !rule.TimeTo.HasValue)
        {
            return true;
        }

        var from = rule.TimeFrom ?? TimeSpan.Zero;
        var to = rule.TimeTo ?? new TimeSpan(23, 59, 59);
        return from <= to
            ? showTime >= from && showTime <= to
            : showTime >= from || showTime <= to;
    }

    private async Task<bool> IsHolidayAsync(DateTime vietnamDate)
    {
        var date = vietnamDate.Date;
        return await _unitOfWork.Repository<HolidayCalendarEntity>().Query()
            .AnyAsync(x => x.IsActive && x.Date == date);
    }

    private static decimal ApplyRule(PricingPromotionRuleEntity rule, decimal currentPrice)
    {
        var next = rule.PromotionType switch
        {
            PromotionTypeEnum.PercentDiscount => currentPrice * (1 - rule.AdjustmentValue / 100m),
            PromotionTypeEnum.FixedDiscount => currentPrice - rule.AdjustmentValue,
            PromotionTypeEnum.Surcharge => currentPrice * (1 + rule.AdjustmentValue / 100m),
            _ => currentPrice
        };

        return Math.Max(0, Math.Round(next, 0));
    }

    private Guid? TryGetUserId()
    {
        try
        {
            return _userContextService.GetUserId();
        }
        catch
        {
            return null;
        }
    }
}
