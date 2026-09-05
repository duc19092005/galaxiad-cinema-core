using Cinema.Application.Interfaces.PricingPromotions;
using Cinema.Application.UseCases.Admin.PricingPromotions;
using Cinema.Domain.Entities.MovieInfos;
using Cinema.Domain.Entities.Promotions;
using Cinema.Domain.Enums;
using FluentAssertions;
using Moq;
using Xunit;

namespace Cinema.Tests.Unit.Admin;

public class CalculatePricingPromotionUseCaseTests
{
    private readonly Mock<IPricingPromotionRepository> _repoMock = new();

    [Fact]
    public async Task CalculatePricingPromotion_FixedPricePromotion_OverridesBasePrice()
    {
        // Arrange
        var schedule = new MovieScheduleInfoEntity
        {
            MovieScheduleInfoId = Guid.NewGuid(),
            StartTime = DateTime.UtcNow.AddHours(2),
            MovieFormatId = Guid.NewGuid()
        };

        var rule = new PricingPromotionRuleEntity
        {
            PricingPromotionRuleId = Guid.NewGuid(),
            PromotionType = PromotionTypeEnum.FixedTicketPrice,
            AdjustmentValue = 45000,
            Priority = 10,
            PricingPromotionEntity = new PricingPromotionEntity { ExcludeHolidays = false }
        };

        _repoMock.Setup(r => r.GetRulesForCalculationAsync(
            It.IsAny<DateTime>(),
            It.IsAny<int>(),
            It.IsAny<Guid>(),
            It.IsAny<Guid?>(),
            It.IsAny<Guid>(),
            It.IsAny<Guid?>(),
            It.IsAny<MembershipRankEnum?>())).ReturnsAsync(new List<PricingPromotionRuleEntity> { rule });

        var useCase = new CalculatePricingPromotionUseCase(_repoMock.Object);

        // Act
        var result = await useCase.ExecuteAsync(schedule, 90000);

        // Assert
        result.BasePrice.Should().Be(90000);
        result.FinalPrice.Should().Be(45000);
        result.TotalAdjustmentAmount.Should().Be(-45000);
        result.AppliedPromotions.Should().HaveCount(1);
    }

    [Fact]
    public async Task CalculatePricingPromotion_PercentDiscount_AppliesCorrectly()
    {
        // Arrange
        var schedule = new MovieScheduleInfoEntity
        {
            MovieScheduleInfoId = Guid.NewGuid(),
            StartTime = DateTime.UtcNow.AddHours(2),
            MovieFormatId = Guid.NewGuid()
        };

        var rule = new PricingPromotionRuleEntity
        {
            PricingPromotionRuleId = Guid.NewGuid(),
            PromotionType = PromotionTypeEnum.PercentDiscount,
            AdjustmentValue = 20, // 20% discount
            Priority = 5,
            PricingPromotionEntity = new PricingPromotionEntity { ExcludeHolidays = false }
        };

        _repoMock.Setup(r => r.GetRulesForCalculationAsync(
            It.IsAny<DateTime>(),
            It.IsAny<int>(),
            It.IsAny<Guid>(),
            It.IsAny<Guid?>(),
            It.IsAny<Guid>(),
            It.IsAny<Guid?>(),
            It.IsAny<MembershipRankEnum?>())).ReturnsAsync(new List<PricingPromotionRuleEntity> { rule });

        var useCase = new CalculatePricingPromotionUseCase(_repoMock.Object);

        // Act
        var result = await useCase.ExecuteAsync(schedule, 100000);

        // Assert
        result.FinalPrice.Should().Be(80000);
        result.TotalAdjustmentAmount.Should().Be(-20000);
    }

    [Fact]
    public async Task CalculatePricingPromotion_SurchargeRule_IncreasesPrice()
    {
        // Arrange
        var schedule = new MovieScheduleInfoEntity
        {
            MovieScheduleInfoId = Guid.NewGuid(),
            StartTime = DateTime.UtcNow.AddHours(2),
            MovieFormatId = Guid.NewGuid()
        };

        var rule = new PricingPromotionRuleEntity
        {
            PricingPromotionRuleId = Guid.NewGuid(),
            PromotionType = PromotionTypeEnum.Surcharge,
            AdjustmentValue = 10, // 10% surcharge
            Priority = 5,
            PricingPromotionEntity = new PricingPromotionEntity { ExcludeHolidays = false }
        };

        _repoMock.Setup(r => r.GetRulesForCalculationAsync(
            It.IsAny<DateTime>(),
            It.IsAny<int>(),
            It.IsAny<Guid>(),
            It.IsAny<Guid?>(),
            It.IsAny<Guid>(),
            It.IsAny<Guid?>(),
            It.IsAny<MembershipRankEnum?>())).ReturnsAsync(new List<PricingPromotionRuleEntity> { rule });

        var useCase = new CalculatePricingPromotionUseCase(_repoMock.Object);

        // Act
        var result = await useCase.ExecuteAsync(schedule, 100000);

        // Assert
        result.FinalPrice.Should().Be(110000);
        result.TotalAdjustmentAmount.Should().Be(10000);
    }
}
