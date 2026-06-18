using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace DataAccess.Migrations
{
    /// <inheritdoc />
    public partial class AddVoucherSeeds : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.InsertData(
                table: "VoucherInfoEntity",
                columns: new[] { "voucherId", "RemainingQuantity", "ValidFrom", "ValidTo", "VoucherPointsCost", "VoucherQuantity", "roleId", "voucherAmount", "voucherDescription", "voucherDiscountPercent", "voucherName" },
                values: new object[,]
                {
                    { new Guid("a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d"), 200, new DateTime(2026, 6, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new DateTime(2026, 8, 31, 0, 0, 0, 0, DateTimeKind.Unspecified), 500, 200, new Guid("2b9c8d0e-f5a6-7b8c-d9e0-1f2a3b4c5d6e"), 0L, "Get 20% off on movie tickets for the summer season. Applicable to all screenings.", 20.00m, "SUMMER2026" },
                    { new Guid("b2c3d4e5-f6a7-8b9c-d0e1-f2a3b4c5d6e8"), 500, new DateTime(2026, 5, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new DateTime(2026, 12, 31, 0, 0, 0, 0, DateTimeKind.Unspecified), 100, 500, new Guid("2b9c8d0e-f5a6-7b8c-d9e0-1f2a3b4c5d6e"), 0L, "Special 50% discount for newly registered users on their first ticket purchase.", 50.00m, "NEWBIE_50" },
                    { new Guid("c3d4e5f6-a7b8-9c0d-1e2f-3a4b5c6d7e8f"), 300, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new DateTime(2027, 12, 31, 0, 0, 0, 0, DateTimeKind.Unspecified), 150, 300, new Guid("2b9c8d0e-f5a6-7b8c-d9e0-1f2a3b4c5d6e"), 0L, "Student exclusive discount voucher. Get 10% off any showtime plus free popcorn.", 10.00m, "STUDENTDAY" },
                    { new Guid("d4e5f6a7-b8c9-0d1e-2f3a-4b5c6d7e8f9a"), 150, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new DateTime(2026, 12, 31, 0, 0, 0, 0, DateTimeKind.Unspecified), 250, 150, new Guid("2b9c8d0e-f5a6-7b8c-d9e0-1f2a3b4c5d6e"), 0L, "Save 20% on any showtime after 22:00. Perfect for midnight movie lovers.", 20.00m, "MIDNIGHT20" },
                    { new Guid("e5f6a7b8-c9d0-1e2f-3a4b-5c6d7e8f9a0b"), 100, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new DateTime(2026, 12, 31, 0, 0, 0, 0, DateTimeKind.Unspecified), 300, 100, new Guid("2b9c8d0e-f5a6-7b8c-d9e0-1f2a3b4c5d6e"), 0L, "Weekend booster discount coupon. Get 15% off and earn double reward points.", 15.00m, "DOUBLEPOINTS" },
                    { new Guid("f6a7b8c9-d0e1-2f3a-4b5c-6d7e8f9a0b1c"), 1000, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new DateTime(2027, 12, 31, 0, 0, 0, 0, DateTimeKind.Unspecified), 50, 1000, new Guid("2b9c8d0e-f5a6-7b8c-d9e0-1f2a3b4c5d6e"), 0L, "Welcome coupon. First time booking tickets online? Enter this code to save 5%.", 5.00m, "WELCOME5" }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "VoucherInfoEntity",
                keyColumn: "voucherId",
                keyValue: new Guid("a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d"));

            migrationBuilder.DeleteData(
                table: "VoucherInfoEntity",
                keyColumn: "voucherId",
                keyValue: new Guid("b2c3d4e5-f6a7-8b9c-d0e1-f2a3b4c5d6e8"));

            migrationBuilder.DeleteData(
                table: "VoucherInfoEntity",
                keyColumn: "voucherId",
                keyValue: new Guid("c3d4e5f6-a7b8-9c0d-1e2f-3a4b5c6d7e8f"));

            migrationBuilder.DeleteData(
                table: "VoucherInfoEntity",
                keyColumn: "voucherId",
                keyValue: new Guid("d4e5f6a7-b8c9-0d1e-2f3a-4b5c6d7e8f9a"));

            migrationBuilder.DeleteData(
                table: "VoucherInfoEntity",
                keyColumn: "voucherId",
                keyValue: new Guid("e5f6a7b8-c9d0-1e2f-3a4b-5c6d7e8f9a0b"));

            migrationBuilder.DeleteData(
                table: "VoucherInfoEntity",
                keyColumn: "voucherId",
                keyValue: new Guid("f6a7b8c9-d0e1-2f3a-4b5c-6d7e8f9a0b1c"));
        }
    }
}
