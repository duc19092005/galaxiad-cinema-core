using System;
using Cinema.Domain.Constants;
using Cinema.Domain.Entities.Vouchers;
using Microsoft.EntityFrameworkCore;

namespace Cinema.Infrastructure.SeedData;

public static class VoucherSeedData
{
    public static void AddVoucherSeedData(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<VoucherInfoEntity>().HasData(
            new VoucherInfoEntity
            {
                voucherId = Guid.Parse("a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d"),
                voucherName = "SUMMER2026",
                voucherDescription = "Get 20% off on movie tickets for the summer season. Applicable to all screenings.",
                voucherAmount = 0,
                voucherDiscountPercent = 20.00m,
                roleId = userRoles.Customer,
                VoucherPointsCost = 500,
                VoucherQuantity = 200,
                RemainingQuantity = 200,
                ValidFrom = new DateTime(2026, 6, 1),
                ValidTo = new DateTime(2026, 8, 31)
            },
            new VoucherInfoEntity
            {
                voucherId = Guid.Parse("b2c3d4e5-f6a7-8b9c-d0e1-f2a3b4c5d6e8"),
                voucherName = "NEWBIE_50",
                voucherDescription = "Special 50% discount for newly registered users on their first ticket purchase.",
                voucherAmount = 0,
                voucherDiscountPercent = 50.00m,
                roleId = userRoles.Customer,
                VoucherPointsCost = 100,
                VoucherQuantity = 500,
                RemainingQuantity = 500,
                ValidFrom = new DateTime(2026, 5, 1),
                ValidTo = new DateTime(2026, 12, 31)
            },
            new VoucherInfoEntity
            {
                voucherId = Guid.Parse("c3d4e5f6-a7b8-9c0d-1e2f-3a4b5c6d7e8f"),
                voucherName = "STUDENTDAY",
                voucherDescription = "Student exclusive discount voucher. Get 10% off any showtime plus free popcorn.",
                voucherAmount = 0,
                voucherDiscountPercent = 10.00m,
                roleId = userRoles.Customer,
                VoucherPointsCost = 150,
                VoucherQuantity = 300,
                RemainingQuantity = 300,
                ValidFrom = new DateTime(2026, 1, 1),
                ValidTo = new DateTime(2027, 12, 31)
            },
            new VoucherInfoEntity
            {
                voucherId = Guid.Parse("d4e5f6a7-b8c9-0d1e-2f3a-4b5c6d7e8f9a"),
                voucherName = "MIDNIGHT20",
                voucherDescription = "Save 20% on any showtime after 22:00. Perfect for midnight movie lovers.",
                voucherAmount = 0,
                voucherDiscountPercent = 20.00m,
                roleId = userRoles.Customer,
                VoucherPointsCost = 250,
                VoucherQuantity = 150,
                RemainingQuantity = 150,
                ValidFrom = new DateTime(2026, 1, 1),
                ValidTo = new DateTime(2026, 12, 31)
            },
            new VoucherInfoEntity
            {
                voucherId = Guid.Parse("e5f6a7b8-c9d0-1e2f-3a4b-5c6d7e8f9a0b"),
                voucherName = "DOUBLEPOINTS",
                voucherDescription = "Weekend booster discount coupon. Get 15% off and earn double reward points.",
                voucherAmount = 0,
                voucherDiscountPercent = 15.00m,
                roleId = userRoles.Customer,
                VoucherPointsCost = 300,
                VoucherQuantity = 100,
                RemainingQuantity = 100,
                ValidFrom = new DateTime(2026, 1, 1),
                ValidTo = new DateTime(2026, 12, 31)
            },
            new VoucherInfoEntity
            {
                voucherId = Guid.Parse("f6a7b8c9-d0e1-2f3a-4b5c-6d7e8f9a0b1c"),
                voucherName = "WELCOME5",
                voucherDescription = "Welcome coupon. First time booking tickets online? Enter this code to save 5%.",
                voucherAmount = 0,
                voucherDiscountPercent = 5.00m,
                roleId = userRoles.Customer,
                VoucherPointsCost = 50,
                VoucherQuantity = 1000,
                RemainingQuantity = 1000,
                ValidFrom = new DateTime(2026, 1, 1),
                ValidTo = new DateTime(2027, 12, 31)
            }
        );
    }
}
