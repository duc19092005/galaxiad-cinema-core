using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace Cinema.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class DecoupleMembershipRankFromTicketSegments : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_CustomerProfileEntity_UserSegmentsInfoEntity_UserSegmentId",
                table: "CustomerProfileEntity");

            migrationBuilder.DropForeignKey(
                name: "FK_PricingPromotionRuleEntity_UserSegmentsInfoEntity_RequiredMembershipTierId",
                table: "PricingPromotionRuleEntity");

            migrationBuilder.DropIndex(
                name: "IX_PricingPromotionRuleEntity_RequiredMembershipTierId",
                table: "PricingPromotionRuleEntity");

            migrationBuilder.DropIndex(
                name: "IX_CustomerProfileEntity_UserSegmentId",
                table: "CustomerProfileEntity");

            migrationBuilder.AddColumn<int>(
                name: "RequiredMembershipRank",
                table: "PricingPromotionRuleEntity",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "MembershipRank",
                table: "CustomerProfileEntity",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.Sql("""
                UPDATE PricingPromotionRuleEntity
                SET RequiredMembershipRank = CASE
                    WHEN RequiredMembershipTierId = 'd1e2f3a4-b5c6-4d7e-8f9a-0b1c2d3e4f5a' THEN 1
                    WHEN RequiredMembershipTierId = '5c6d7e8f-9a0b-4c1d-2e3f-4a5b6c7d8e9f' THEN 0
                    ELSE NULL
                END
                WHERE RequiredMembershipTierId IS NOT NULL
                """);

            migrationBuilder.Sql("""
                UPDATE CustomerProfileEntity
                SET MembershipRank = CASE
                    WHEN UserSegmentId = 'd1e2f3a4-b5c6-4d7e-8f9a-0b1c2d3e4f5a' THEN 1
                    ELSE 0
                END
                """);

            migrationBuilder.DeleteData(
                table: "CinemaSurchargeInfosEntity",
                keyColumns: new[] { "CinemaId", "MovieFormatId", "UserSegmentId" },
                keyValues: new object[] { new Guid("11111111-1111-1111-1111-111111111111"), new Guid("3fbc4a32-15f5-47e0-b98a-784f1b8a9612"), new Guid("5c6d7e8f-9a0b-4c1d-2e3f-4a5b6c7d8e9f") });

            migrationBuilder.DeleteData(
                table: "CinemaSurchargeInfosEntity",
                keyColumns: new[] { "CinemaId", "MovieFormatId", "UserSegmentId" },
                keyValues: new object[] { new Guid("11111111-1111-1111-1111-111111111111"), new Guid("3fbc4a32-15f5-47e0-b98a-784f1b8a9612"), new Guid("d1e2f3a4-b5c6-4d7e-8f9a-0b1c2d3e4f5a") });

            migrationBuilder.DeleteData(
                table: "CinemaSurchargeInfosEntity",
                keyColumns: new[] { "CinemaId", "MovieFormatId", "UserSegmentId" },
                keyValues: new object[] { new Guid("11111111-1111-1111-1111-111111111111"), new Guid("7a5e82b1-c4d3-4a92-9e11-3f4b52c1a8d9"), new Guid("5c6d7e8f-9a0b-4c1d-2e3f-4a5b6c7d8e9f") });

            migrationBuilder.DeleteData(
                table: "CinemaSurchargeInfosEntity",
                keyColumns: new[] { "CinemaId", "MovieFormatId", "UserSegmentId" },
                keyValues: new object[] { new Guid("11111111-1111-1111-1111-111111111111"), new Guid("7a5e82b1-c4d3-4a92-9e11-3f4b52c1a8d9"), new Guid("d1e2f3a4-b5c6-4d7e-8f9a-0b1c2d3e4f5a") });

            migrationBuilder.DeleteData(
                table: "CinemaSurchargeInfosEntity",
                keyColumns: new[] { "CinemaId", "MovieFormatId", "UserSegmentId" },
                keyValues: new object[] { new Guid("11111111-1111-1111-1111-111111111111"), new Guid("d29b0f1c-8e2a-4c5b-bc3d-1a2f3e4d5c6b"), new Guid("5c6d7e8f-9a0b-4c1d-2e3f-4a5b6c7d8e9f") });

            migrationBuilder.DeleteData(
                table: "CinemaSurchargeInfosEntity",
                keyColumns: new[] { "CinemaId", "MovieFormatId", "UserSegmentId" },
                keyValues: new object[] { new Guid("11111111-1111-1111-1111-111111111111"), new Guid("d29b0f1c-8e2a-4c5b-bc3d-1a2f3e4d5c6b"), new Guid("d1e2f3a4-b5c6-4d7e-8f9a-0b1c2d3e4f5a") });

            migrationBuilder.DeleteData(
                table: "CinemaSurchargeInfosEntity",
                keyColumns: new[] { "CinemaId", "MovieFormatId", "UserSegmentId" },
                keyValues: new object[] { new Guid("22222222-2222-2222-2222-222222222222"), new Guid("3fbc4a32-15f5-47e0-b98a-784f1b8a9612"), new Guid("5c6d7e8f-9a0b-4c1d-2e3f-4a5b6c7d8e9f") });

            migrationBuilder.DeleteData(
                table: "CinemaSurchargeInfosEntity",
                keyColumns: new[] { "CinemaId", "MovieFormatId", "UserSegmentId" },
                keyValues: new object[] { new Guid("22222222-2222-2222-2222-222222222222"), new Guid("3fbc4a32-15f5-47e0-b98a-784f1b8a9612"), new Guid("d1e2f3a4-b5c6-4d7e-8f9a-0b1c2d3e4f5a") });

            migrationBuilder.DeleteData(
                table: "CinemaSurchargeInfosEntity",
                keyColumns: new[] { "CinemaId", "MovieFormatId", "UserSegmentId" },
                keyValues: new object[] { new Guid("22222222-2222-2222-2222-222222222222"), new Guid("7a5e82b1-c4d3-4a92-9e11-3f4b52c1a8d9"), new Guid("5c6d7e8f-9a0b-4c1d-2e3f-4a5b6c7d8e9f") });

            migrationBuilder.DeleteData(
                table: "CinemaSurchargeInfosEntity",
                keyColumns: new[] { "CinemaId", "MovieFormatId", "UserSegmentId" },
                keyValues: new object[] { new Guid("22222222-2222-2222-2222-222222222222"), new Guid("7a5e82b1-c4d3-4a92-9e11-3f4b52c1a8d9"), new Guid("d1e2f3a4-b5c6-4d7e-8f9a-0b1c2d3e4f5a") });

            migrationBuilder.DeleteData(
                table: "CinemaSurchargeInfosEntity",
                keyColumns: new[] { "CinemaId", "MovieFormatId", "UserSegmentId" },
                keyValues: new object[] { new Guid("22222222-2222-2222-2222-222222222222"), new Guid("d29b0f1c-8e2a-4c5b-bc3d-1a2f3e4d5c6b"), new Guid("5c6d7e8f-9a0b-4c1d-2e3f-4a5b6c7d8e9f") });

            migrationBuilder.DeleteData(
                table: "CinemaSurchargeInfosEntity",
                keyColumns: new[] { "CinemaId", "MovieFormatId", "UserSegmentId" },
                keyValues: new object[] { new Guid("22222222-2222-2222-2222-222222222222"), new Guid("d29b0f1c-8e2a-4c5b-bc3d-1a2f3e4d5c6b"), new Guid("d1e2f3a4-b5c6-4d7e-8f9a-0b1c2d3e4f5a") });

            migrationBuilder.DeleteData(
                table: "CinemaSurchargeInfosEntity",
                keyColumns: new[] { "CinemaId", "MovieFormatId", "UserSegmentId" },
                keyValues: new object[] { new Guid("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"), new Guid("3fbc4a32-15f5-47e0-b98a-784f1b8a9612"), new Guid("5c6d7e8f-9a0b-4c1d-2e3f-4a5b6c7d8e9f") });

            migrationBuilder.DeleteData(
                table: "CinemaSurchargeInfosEntity",
                keyColumns: new[] { "CinemaId", "MovieFormatId", "UserSegmentId" },
                keyValues: new object[] { new Guid("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"), new Guid("3fbc4a32-15f5-47e0-b98a-784f1b8a9612"), new Guid("d1e2f3a4-b5c6-4d7e-8f9a-0b1c2d3e4f5a") });

            migrationBuilder.DeleteData(
                table: "CinemaSurchargeInfosEntity",
                keyColumns: new[] { "CinemaId", "MovieFormatId", "UserSegmentId" },
                keyValues: new object[] { new Guid("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"), new Guid("7a5e82b1-c4d3-4a92-9e11-3f4b52c1a8d9"), new Guid("5c6d7e8f-9a0b-4c1d-2e3f-4a5b6c7d8e9f") });

            migrationBuilder.DeleteData(
                table: "CinemaSurchargeInfosEntity",
                keyColumns: new[] { "CinemaId", "MovieFormatId", "UserSegmentId" },
                keyValues: new object[] { new Guid("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"), new Guid("7a5e82b1-c4d3-4a92-9e11-3f4b52c1a8d9"), new Guid("d1e2f3a4-b5c6-4d7e-8f9a-0b1c2d3e4f5a") });

            migrationBuilder.DeleteData(
                table: "CinemaSurchargeInfosEntity",
                keyColumns: new[] { "CinemaId", "MovieFormatId", "UserSegmentId" },
                keyValues: new object[] { new Guid("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"), new Guid("d29b0f1c-8e2a-4c5b-bc3d-1a2f3e4d5c6b"), new Guid("5c6d7e8f-9a0b-4c1d-2e3f-4a5b6c7d8e9f") });

            migrationBuilder.DeleteData(
                table: "CinemaSurchargeInfosEntity",
                keyColumns: new[] { "CinemaId", "MovieFormatId", "UserSegmentId" },
                keyValues: new object[] { new Guid("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"), new Guid("d29b0f1c-8e2a-4c5b-bc3d-1a2f3e4d5c6b"), new Guid("d1e2f3a4-b5c6-4d7e-8f9a-0b1c2d3e4f5a") });

            migrationBuilder.DeleteData(
                table: "UserSegmentsInfoEntity",
                keyColumn: "UserSegmentId",
                keyValue: new Guid("5c6d7e8f-9a0b-4c1d-2e3f-4a5b6c7d8e9f"));

            migrationBuilder.DeleteData(
                table: "UserSegmentsInfoEntity",
                keyColumn: "UserSegmentId",
                keyValue: new Guid("d1e2f3a4-b5c6-4d7e-8f9a-0b1c2d3e4f5a"));

            migrationBuilder.DropColumn(
                name: "RequiredMembershipTierId",
                table: "PricingPromotionRuleEntity");

            migrationBuilder.DropColumn(
                name: "UserSegmentId",
                table: "CustomerProfileEntity");

            migrationBuilder.AddColumn<Guid>(
                name: "UserSegmentId",
                table: "GroupBookingSeatEntity",
                type: "uniqueidentifier",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "UserSegmentId",
                table: "GroupBookingSeatEntity");

            migrationBuilder.AddColumn<Guid>(
                name: "RequiredMembershipTierId",
                table: "PricingPromotionRuleEntity",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "UserSegmentId",
                table: "CustomerProfileEntity",
                type: "uniqueidentifier",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.Sql("""
                UPDATE PricingPromotionRuleEntity
                SET RequiredMembershipTierId = CASE
                    WHEN RequiredMembershipRank = 1 THEN 'd1e2f3a4-b5c6-4d7e-8f9a-0b1c2d3e4f5a'
                    WHEN RequiredMembershipRank = 0 THEN '5c6d7e8f-9a0b-4c1d-2e3f-4a5b6c7d8e9f'
                    ELSE NULL
                END
                WHERE RequiredMembershipRank IS NOT NULL
                """);

            migrationBuilder.Sql("""
                UPDATE CustomerProfileEntity
                SET UserSegmentId = CASE
                    WHEN MembershipRank = 1 THEN 'd1e2f3a4-b5c6-4d7e-8f9a-0b1c2d3e4f5a'
                    ELSE '5c6d7e8f-9a0b-4c1d-2e3f-4a5b6c7d8e9f'
                END
                """);

            migrationBuilder.DropColumn(
                name: "RequiredMembershipRank",
                table: "PricingPromotionRuleEntity");

            migrationBuilder.DropColumn(
                name: "MembershipRank",
                table: "CustomerProfileEntity");

            migrationBuilder.InsertData(
                table: "UserSegmentsInfoEntity",
                columns: new[] { "UserSegmentId", "UserSegmentDescription", "UserSegmentName" },
                values: new object[,]
                {
                    { new Guid("5c6d7e8f-9a0b-4c1d-2e3f-4a5b6c7d8e9f"), "Registered members with basic loyalty benefits.", "Standard Member" },
                    { new Guid("d1e2f3a4-b5c6-4d7e-8f9a-0b1c2d3e4f5a"), "High-tier members with premium discounts and exclusive offers.", "VIP Member" }
                });

            migrationBuilder.InsertData(
                table: "CinemaSurchargeInfosEntity",
                columns: new[] { "CinemaId", "MovieFormatId", "UserSegmentId", "ActiveAt", "CreatedAt", "CreatedByUserId", "DeletedAt", "DeletedByUserId", "IsActive", "IsDeleted", "SurchangePercent", "UpdatedAt", "UpdatedByUserId" },
                values: new object[,]
                {
                    { new Guid("11111111-1111-1111-1111-111111111111"), new Guid("3fbc4a32-15f5-47e0-b98a-784f1b8a9612"), new Guid("5c6d7e8f-9a0b-4c1d-2e3f-4a5b6c7d8e9f"), new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), new Guid("e4e1f7d8-c3b2-4a90-8c67-2f5a1b3d9e0c"), null, null, true, false, -5.00m, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null },
                    { new Guid("11111111-1111-1111-1111-111111111111"), new Guid("3fbc4a32-15f5-47e0-b98a-784f1b8a9612"), new Guid("d1e2f3a4-b5c6-4d7e-8f9a-0b1c2d3e4f5a"), new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), new Guid("e4e1f7d8-c3b2-4a90-8c67-2f5a1b3d9e0c"), null, null, true, false, -25.00m, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null },
                    { new Guid("11111111-1111-1111-1111-111111111111"), new Guid("7a5e82b1-c4d3-4a92-9e11-3f4b52c1a8d9"), new Guid("5c6d7e8f-9a0b-4c1d-2e3f-4a5b6c7d8e9f"), new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), new Guid("e4e1f7d8-c3b2-4a90-8c67-2f5a1b3d9e0c"), null, null, true, false, -5.00m, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null },
                    { new Guid("11111111-1111-1111-1111-111111111111"), new Guid("7a5e82b1-c4d3-4a92-9e11-3f4b52c1a8d9"), new Guid("d1e2f3a4-b5c6-4d7e-8f9a-0b1c2d3e4f5a"), new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), new Guid("e4e1f7d8-c3b2-4a90-8c67-2f5a1b3d9e0c"), null, null, true, false, -25.00m, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null },
                    { new Guid("11111111-1111-1111-1111-111111111111"), new Guid("d29b0f1c-8e2a-4c5b-bc3d-1a2f3e4d5c6b"), new Guid("5c6d7e8f-9a0b-4c1d-2e3f-4a5b6c7d8e9f"), new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), new Guid("e4e1f7d8-c3b2-4a90-8c67-2f5a1b3d9e0c"), null, null, true, false, -5.00m, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null },
                    { new Guid("11111111-1111-1111-1111-111111111111"), new Guid("d29b0f1c-8e2a-4c5b-bc3d-1a2f3e4d5c6b"), new Guid("d1e2f3a4-b5c6-4d7e-8f9a-0b1c2d3e4f5a"), new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), new Guid("e4e1f7d8-c3b2-4a90-8c67-2f5a1b3d9e0c"), null, null, true, false, -25.00m, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null },
                    { new Guid("22222222-2222-2222-2222-222222222222"), new Guid("3fbc4a32-15f5-47e0-b98a-784f1b8a9612"), new Guid("5c6d7e8f-9a0b-4c1d-2e3f-4a5b6c7d8e9f"), new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), new Guid("e4e1f7d8-c3b2-4a90-8c67-2f5a1b3d9e0c"), null, null, true, false, -5.00m, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null },
                    { new Guid("22222222-2222-2222-2222-222222222222"), new Guid("3fbc4a32-15f5-47e0-b98a-784f1b8a9612"), new Guid("d1e2f3a4-b5c6-4d7e-8f9a-0b1c2d3e4f5a"), new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), new Guid("e4e1f7d8-c3b2-4a90-8c67-2f5a1b3d9e0c"), null, null, true, false, -25.00m, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null },
                    { new Guid("22222222-2222-2222-2222-222222222222"), new Guid("7a5e82b1-c4d3-4a92-9e11-3f4b52c1a8d9"), new Guid("5c6d7e8f-9a0b-4c1d-2e3f-4a5b6c7d8e9f"), new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), new Guid("e4e1f7d8-c3b2-4a90-8c67-2f5a1b3d9e0c"), null, null, true, false, -5.00m, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null },
                    { new Guid("22222222-2222-2222-2222-222222222222"), new Guid("7a5e82b1-c4d3-4a92-9e11-3f4b52c1a8d9"), new Guid("d1e2f3a4-b5c6-4d7e-8f9a-0b1c2d3e4f5a"), new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), new Guid("e4e1f7d8-c3b2-4a90-8c67-2f5a1b3d9e0c"), null, null, true, false, -25.00m, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null },
                    { new Guid("22222222-2222-2222-2222-222222222222"), new Guid("d29b0f1c-8e2a-4c5b-bc3d-1a2f3e4d5c6b"), new Guid("5c6d7e8f-9a0b-4c1d-2e3f-4a5b6c7d8e9f"), new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), new Guid("e4e1f7d8-c3b2-4a90-8c67-2f5a1b3d9e0c"), null, null, true, false, -5.00m, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null },
                    { new Guid("22222222-2222-2222-2222-222222222222"), new Guid("d29b0f1c-8e2a-4c5b-bc3d-1a2f3e4d5c6b"), new Guid("d1e2f3a4-b5c6-4d7e-8f9a-0b1c2d3e4f5a"), new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), new Guid("e4e1f7d8-c3b2-4a90-8c67-2f5a1b3d9e0c"), null, null, true, false, -25.00m, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null },
                    { new Guid("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"), new Guid("3fbc4a32-15f5-47e0-b98a-784f1b8a9612"), new Guid("5c6d7e8f-9a0b-4c1d-2e3f-4a5b6c7d8e9f"), new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), new Guid("e4e1f7d8-c3b2-4a90-8c67-2f5a1b3d9e0c"), null, null, true, false, -5.00m, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null },
                    { new Guid("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"), new Guid("3fbc4a32-15f5-47e0-b98a-784f1b8a9612"), new Guid("d1e2f3a4-b5c6-4d7e-8f9a-0b1c2d3e4f5a"), new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), new Guid("e4e1f7d8-c3b2-4a90-8c67-2f5a1b3d9e0c"), null, null, true, false, -25.00m, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null },
                    { new Guid("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"), new Guid("7a5e82b1-c4d3-4a92-9e11-3f4b52c1a8d9"), new Guid("5c6d7e8f-9a0b-4c1d-2e3f-4a5b6c7d8e9f"), new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), new Guid("e4e1f7d8-c3b2-4a90-8c67-2f5a1b3d9e0c"), null, null, true, false, -5.00m, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null },
                    { new Guid("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"), new Guid("7a5e82b1-c4d3-4a92-9e11-3f4b52c1a8d9"), new Guid("d1e2f3a4-b5c6-4d7e-8f9a-0b1c2d3e4f5a"), new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), new Guid("e4e1f7d8-c3b2-4a90-8c67-2f5a1b3d9e0c"), null, null, true, false, -25.00m, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null },
                    { new Guid("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"), new Guid("d29b0f1c-8e2a-4c5b-bc3d-1a2f3e4d5c6b"), new Guid("5c6d7e8f-9a0b-4c1d-2e3f-4a5b6c7d8e9f"), new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), new Guid("e4e1f7d8-c3b2-4a90-8c67-2f5a1b3d9e0c"), null, null, true, false, -5.00m, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null },
                    { new Guid("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"), new Guid("d29b0f1c-8e2a-4c5b-bc3d-1a2f3e4d5c6b"), new Guid("d1e2f3a4-b5c6-4d7e-8f9a-0b1c2d3e4f5a"), new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), new Guid("e4e1f7d8-c3b2-4a90-8c67-2f5a1b3d9e0c"), null, null, true, false, -25.00m, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null }
                });

            migrationBuilder.CreateIndex(
                name: "IX_PricingPromotionRuleEntity_RequiredMembershipTierId",
                table: "PricingPromotionRuleEntity",
                column: "RequiredMembershipTierId");

            migrationBuilder.CreateIndex(
                name: "IX_CustomerProfileEntity_UserSegmentId",
                table: "CustomerProfileEntity",
                column: "UserSegmentId");

            migrationBuilder.AddForeignKey(
                name: "FK_CustomerProfileEntity_UserSegmentsInfoEntity_UserSegmentId",
                table: "CustomerProfileEntity",
                column: "UserSegmentId",
                principalTable: "UserSegmentsInfoEntity",
                principalColumn: "UserSegmentId",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_PricingPromotionRuleEntity_UserSegmentsInfoEntity_RequiredMembershipTierId",
                table: "PricingPromotionRuleEntity",
                column: "RequiredMembershipTierId",
                principalTable: "UserSegmentsInfoEntity",
                principalColumn: "UserSegmentId",
                onDelete: ReferentialAction.Restrict);
        }
    }
}
