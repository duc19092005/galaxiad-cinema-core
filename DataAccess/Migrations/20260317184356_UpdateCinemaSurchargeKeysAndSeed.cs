using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace DataAccess.Migrations
{
    /// <inheritdoc />
    public partial class UpdateCinemaSurchargeKeysAndSeed : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropPrimaryKey(
                name: "PK_CinemaSurchargeInfosEntity",
                table: "CinemaSurchargeInfosEntity");

            migrationBuilder.DropIndex(
                name: "IX_CinemaSurchargeInfosEntity_MovieFormatId_UserSegmentId",
                table: "CinemaSurchargeInfosEntity");

            migrationBuilder.DeleteData(
                table: "MovieScheduleInfoEntity",
                keyColumn: "MovieScheduleInfoId",
                keyValue: new Guid("449df7b2-9a4e-42a6-a441-3cf9ee213856"));

            migrationBuilder.DeleteData(
                table: "MovieScheduleInfoEntity",
                keyColumn: "MovieScheduleInfoId",
                keyValue: new Guid("7c37b7f2-77f3-4033-ad80-77adcb6713d3"));

            migrationBuilder.AddPrimaryKey(
                name: "PK_CinemaSurchargeInfosEntity",
                table: "CinemaSurchargeInfosEntity",
                columns: new[] { "CinemaId", "MovieFormatId", "UserSegmentId" });

            migrationBuilder.UpdateData(
                table: "AuditoriumInfoEntities",
                keyColumn: "AuditoriumId",
                keyValue: new Guid("33333333-3333-3333-3333-333333333333"),
                column: "UpdatedAt",
                value: new DateTime(2026, 3, 18, 1, 43, 55, 759, DateTimeKind.Local).AddTicks(7115));

            migrationBuilder.UpdateData(
                table: "AuditoriumInfoEntities",
                keyColumn: "AuditoriumId",
                keyValue: new Guid("44444444-4444-4444-4444-444444444444"),
                column: "UpdatedAt",
                value: new DateTime(2026, 3, 18, 1, 43, 55, 759, DateTimeKind.Local).AddTicks(7118));

            migrationBuilder.UpdateData(
                table: "AuditoriumInfoEntities",
                keyColumn: "AuditoriumId",
                keyValue: new Guid("55555555-5555-5555-5555-555555555555"),
                column: "UpdatedAt",
                value: new DateTime(2026, 3, 18, 1, 43, 55, 759, DateTimeKind.Local).AddTicks(7121));

            migrationBuilder.UpdateData(
                table: "CinemaInfoEntity",
                keyColumn: "CinemaId",
                keyValue: new Guid("11111111-1111-1111-1111-111111111111"),
                column: "UpdatedAt",
                value: new DateTime(2026, 3, 18, 1, 43, 55, 759, DateTimeKind.Local).AddTicks(7071));

            migrationBuilder.UpdateData(
                table: "CinemaInfoEntity",
                keyColumn: "CinemaId",
                keyValue: new Guid("22222222-2222-2222-2222-222222222222"),
                column: "UpdatedAt",
                value: new DateTime(2026, 3, 18, 1, 43, 55, 759, DateTimeKind.Local).AddTicks(7075));

            migrationBuilder.UpdateData(
                table: "CinemaInfoEntity",
                keyColumn: "CinemaId",
                keyValue: new Guid("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
                column: "UpdatedAt",
                value: new DateTime(2026, 3, 18, 1, 43, 55, 759, DateTimeKind.Local).AddTicks(7078));

            migrationBuilder.InsertData(
                table: "CinemaSurchargeInfosEntity",
                columns: new[] { "CinemaId", "MovieFormatId", "UserSegmentId", "ActiveAt", "CreatedAt", "CreatedByUserId", "DeletedAt", "DeletedByUserId", "IsActive", "IsDeleted", "SurchangePercent", "UpdatedAt", "UpdatedByUserId" },
                values: new object[,]
                {
                    { new Guid("11111111-1111-1111-1111-111111111111"), new Guid("3fbc4a32-15f5-47e0-b98a-784f1b8a9612"), new Guid("1a2b3c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d"), new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new Guid("e4e1f7d8-c3b2-4a90-8c67-2f5a1b3d9e0c"), null, null, true, false, -15.00m, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), null },
                    { new Guid("11111111-1111-1111-1111-111111111111"), new Guid("3fbc4a32-15f5-47e0-b98a-784f1b8a9612"), new Guid("3d4e5f6a-7b8c-4d9e-0f1a-2b3c4d5e6f7a"), new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new Guid("e4e1f7d8-c3b2-4a90-8c67-2f5a1b3d9e0c"), null, null, true, false, -10.00m, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), null },
                    { new Guid("11111111-1111-1111-1111-111111111111"), new Guid("3fbc4a32-15f5-47e0-b98a-784f1b8a9612"), new Guid("5c6d7e8f-9a0b-4c1d-2e3f-4a5b6c7d8e9f"), new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new Guid("e4e1f7d8-c3b2-4a90-8c67-2f5a1b3d9e0c"), null, null, true, false, -5.00m, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), null },
                    { new Guid("11111111-1111-1111-1111-111111111111"), new Guid("3fbc4a32-15f5-47e0-b98a-784f1b8a9612"), new Guid("7b2e1a9d-3f5c-4e8b-91d2-a6b3c4d5e6f7"), new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new Guid("e4e1f7d8-c3b2-4a90-8c67-2f5a1b3d9e0c"), null, null, true, false, 0m, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), null },
                    { new Guid("11111111-1111-1111-1111-111111111111"), new Guid("3fbc4a32-15f5-47e0-b98a-784f1b8a9612"), new Guid("9f8e7d6c-5b4a-4e3d-2c1b-0a9f8e7d6c5b"), new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new Guid("e4e1f7d8-c3b2-4a90-8c67-2f5a1b3d9e0c"), null, null, true, false, -20.00m, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), null },
                    { new Guid("11111111-1111-1111-1111-111111111111"), new Guid("3fbc4a32-15f5-47e0-b98a-784f1b8a9612"), new Guid("d1e2f3a4-b5c6-4d7e-8f9a-0b1c2d3e4f5a"), new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new Guid("e4e1f7d8-c3b2-4a90-8c67-2f5a1b3d9e0c"), null, null, true, false, -25.00m, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), null },
                    { new Guid("11111111-1111-1111-1111-111111111111"), new Guid("7a5e82b1-c4d3-4a92-9e11-3f4b52c1a8d9"), new Guid("1a2b3c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d"), new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new Guid("e4e1f7d8-c3b2-4a90-8c67-2f5a1b3d9e0c"), null, null, true, false, -15.00m, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), null },
                    { new Guid("11111111-1111-1111-1111-111111111111"), new Guid("7a5e82b1-c4d3-4a92-9e11-3f4b52c1a8d9"), new Guid("3d4e5f6a-7b8c-4d9e-0f1a-2b3c4d5e6f7a"), new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new Guid("e4e1f7d8-c3b2-4a90-8c67-2f5a1b3d9e0c"), null, null, true, false, -10.00m, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), null },
                    { new Guid("11111111-1111-1111-1111-111111111111"), new Guid("7a5e82b1-c4d3-4a92-9e11-3f4b52c1a8d9"), new Guid("5c6d7e8f-9a0b-4c1d-2e3f-4a5b6c7d8e9f"), new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new Guid("e4e1f7d8-c3b2-4a90-8c67-2f5a1b3d9e0c"), null, null, true, false, -5.00m, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), null },
                    { new Guid("11111111-1111-1111-1111-111111111111"), new Guid("7a5e82b1-c4d3-4a92-9e11-3f4b52c1a8d9"), new Guid("7b2e1a9d-3f5c-4e8b-91d2-a6b3c4d5e6f7"), new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new Guid("e4e1f7d8-c3b2-4a90-8c67-2f5a1b3d9e0c"), null, null, true, false, 0m, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), null },
                    { new Guid("11111111-1111-1111-1111-111111111111"), new Guid("7a5e82b1-c4d3-4a92-9e11-3f4b52c1a8d9"), new Guid("9f8e7d6c-5b4a-4e3d-2c1b-0a9f8e7d6c5b"), new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new Guid("e4e1f7d8-c3b2-4a90-8c67-2f5a1b3d9e0c"), null, null, true, false, -20.00m, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), null },
                    { new Guid("11111111-1111-1111-1111-111111111111"), new Guid("7a5e82b1-c4d3-4a92-9e11-3f4b52c1a8d9"), new Guid("d1e2f3a4-b5c6-4d7e-8f9a-0b1c2d3e4f5a"), new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new Guid("e4e1f7d8-c3b2-4a90-8c67-2f5a1b3d9e0c"), null, null, true, false, -25.00m, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), null },
                    { new Guid("11111111-1111-1111-1111-111111111111"), new Guid("d29b0f1c-8e2a-4c5b-bc3d-1a2f3e4d5c6b"), new Guid("1a2b3c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d"), new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new Guid("e4e1f7d8-c3b2-4a90-8c67-2f5a1b3d9e0c"), null, null, true, false, -15.00m, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), null },
                    { new Guid("11111111-1111-1111-1111-111111111111"), new Guid("d29b0f1c-8e2a-4c5b-bc3d-1a2f3e4d5c6b"), new Guid("3d4e5f6a-7b8c-4d9e-0f1a-2b3c4d5e6f7a"), new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new Guid("e4e1f7d8-c3b2-4a90-8c67-2f5a1b3d9e0c"), null, null, true, false, -10.00m, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), null },
                    { new Guid("11111111-1111-1111-1111-111111111111"), new Guid("d29b0f1c-8e2a-4c5b-bc3d-1a2f3e4d5c6b"), new Guid("5c6d7e8f-9a0b-4c1d-2e3f-4a5b6c7d8e9f"), new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new Guid("e4e1f7d8-c3b2-4a90-8c67-2f5a1b3d9e0c"), null, null, true, false, -5.00m, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), null },
                    { new Guid("11111111-1111-1111-1111-111111111111"), new Guid("d29b0f1c-8e2a-4c5b-bc3d-1a2f3e4d5c6b"), new Guid("7b2e1a9d-3f5c-4e8b-91d2-a6b3c4d5e6f7"), new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new Guid("e4e1f7d8-c3b2-4a90-8c67-2f5a1b3d9e0c"), null, null, true, false, 0m, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), null },
                    { new Guid("11111111-1111-1111-1111-111111111111"), new Guid("d29b0f1c-8e2a-4c5b-bc3d-1a2f3e4d5c6b"), new Guid("9f8e7d6c-5b4a-4e3d-2c1b-0a9f8e7d6c5b"), new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new Guid("e4e1f7d8-c3b2-4a90-8c67-2f5a1b3d9e0c"), null, null, true, false, -20.00m, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), null },
                    { new Guid("11111111-1111-1111-1111-111111111111"), new Guid("d29b0f1c-8e2a-4c5b-bc3d-1a2f3e4d5c6b"), new Guid("d1e2f3a4-b5c6-4d7e-8f9a-0b1c2d3e4f5a"), new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new Guid("e4e1f7d8-c3b2-4a90-8c67-2f5a1b3d9e0c"), null, null, true, false, -25.00m, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), null },
                    { new Guid("22222222-2222-2222-2222-222222222222"), new Guid("3fbc4a32-15f5-47e0-b98a-784f1b8a9612"), new Guid("1a2b3c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d"), new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new Guid("e4e1f7d8-c3b2-4a90-8c67-2f5a1b3d9e0c"), null, null, true, false, -15.00m, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), null },
                    { new Guid("22222222-2222-2222-2222-222222222222"), new Guid("3fbc4a32-15f5-47e0-b98a-784f1b8a9612"), new Guid("3d4e5f6a-7b8c-4d9e-0f1a-2b3c4d5e6f7a"), new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new Guid("e4e1f7d8-c3b2-4a90-8c67-2f5a1b3d9e0c"), null, null, true, false, -10.00m, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), null },
                    { new Guid("22222222-2222-2222-2222-222222222222"), new Guid("3fbc4a32-15f5-47e0-b98a-784f1b8a9612"), new Guid("5c6d7e8f-9a0b-4c1d-2e3f-4a5b6c7d8e9f"), new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new Guid("e4e1f7d8-c3b2-4a90-8c67-2f5a1b3d9e0c"), null, null, true, false, -5.00m, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), null },
                    { new Guid("22222222-2222-2222-2222-222222222222"), new Guid("3fbc4a32-15f5-47e0-b98a-784f1b8a9612"), new Guid("7b2e1a9d-3f5c-4e8b-91d2-a6b3c4d5e6f7"), new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new Guid("e4e1f7d8-c3b2-4a90-8c67-2f5a1b3d9e0c"), null, null, true, false, 0m, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), null },
                    { new Guid("22222222-2222-2222-2222-222222222222"), new Guid("3fbc4a32-15f5-47e0-b98a-784f1b8a9612"), new Guid("9f8e7d6c-5b4a-4e3d-2c1b-0a9f8e7d6c5b"), new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new Guid("e4e1f7d8-c3b2-4a90-8c67-2f5a1b3d9e0c"), null, null, true, false, -20.00m, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), null },
                    { new Guid("22222222-2222-2222-2222-222222222222"), new Guid("3fbc4a32-15f5-47e0-b98a-784f1b8a9612"), new Guid("d1e2f3a4-b5c6-4d7e-8f9a-0b1c2d3e4f5a"), new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new Guid("e4e1f7d8-c3b2-4a90-8c67-2f5a1b3d9e0c"), null, null, true, false, -25.00m, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), null },
                    { new Guid("22222222-2222-2222-2222-222222222222"), new Guid("7a5e82b1-c4d3-4a92-9e11-3f4b52c1a8d9"), new Guid("1a2b3c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d"), new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new Guid("e4e1f7d8-c3b2-4a90-8c67-2f5a1b3d9e0c"), null, null, true, false, -15.00m, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), null },
                    { new Guid("22222222-2222-2222-2222-222222222222"), new Guid("7a5e82b1-c4d3-4a92-9e11-3f4b52c1a8d9"), new Guid("3d4e5f6a-7b8c-4d9e-0f1a-2b3c4d5e6f7a"), new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new Guid("e4e1f7d8-c3b2-4a90-8c67-2f5a1b3d9e0c"), null, null, true, false, -10.00m, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), null },
                    { new Guid("22222222-2222-2222-2222-222222222222"), new Guid("7a5e82b1-c4d3-4a92-9e11-3f4b52c1a8d9"), new Guid("5c6d7e8f-9a0b-4c1d-2e3f-4a5b6c7d8e9f"), new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new Guid("e4e1f7d8-c3b2-4a90-8c67-2f5a1b3d9e0c"), null, null, true, false, -5.00m, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), null },
                    { new Guid("22222222-2222-2222-2222-222222222222"), new Guid("7a5e82b1-c4d3-4a92-9e11-3f4b52c1a8d9"), new Guid("7b2e1a9d-3f5c-4e8b-91d2-a6b3c4d5e6f7"), new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new Guid("e4e1f7d8-c3b2-4a90-8c67-2f5a1b3d9e0c"), null, null, true, false, 0m, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), null },
                    { new Guid("22222222-2222-2222-2222-222222222222"), new Guid("7a5e82b1-c4d3-4a92-9e11-3f4b52c1a8d9"), new Guid("9f8e7d6c-5b4a-4e3d-2c1b-0a9f8e7d6c5b"), new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new Guid("e4e1f7d8-c3b2-4a90-8c67-2f5a1b3d9e0c"), null, null, true, false, -20.00m, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), null },
                    { new Guid("22222222-2222-2222-2222-222222222222"), new Guid("7a5e82b1-c4d3-4a92-9e11-3f4b52c1a8d9"), new Guid("d1e2f3a4-b5c6-4d7e-8f9a-0b1c2d3e4f5a"), new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new Guid("e4e1f7d8-c3b2-4a90-8c67-2f5a1b3d9e0c"), null, null, true, false, -25.00m, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), null },
                    { new Guid("22222222-2222-2222-2222-222222222222"), new Guid("d29b0f1c-8e2a-4c5b-bc3d-1a2f3e4d5c6b"), new Guid("1a2b3c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d"), new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new Guid("e4e1f7d8-c3b2-4a90-8c67-2f5a1b3d9e0c"), null, null, true, false, -15.00m, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), null },
                    { new Guid("22222222-2222-2222-2222-222222222222"), new Guid("d29b0f1c-8e2a-4c5b-bc3d-1a2f3e4d5c6b"), new Guid("3d4e5f6a-7b8c-4d9e-0f1a-2b3c4d5e6f7a"), new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new Guid("e4e1f7d8-c3b2-4a90-8c67-2f5a1b3d9e0c"), null, null, true, false, -10.00m, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), null },
                    { new Guid("22222222-2222-2222-2222-222222222222"), new Guid("d29b0f1c-8e2a-4c5b-bc3d-1a2f3e4d5c6b"), new Guid("5c6d7e8f-9a0b-4c1d-2e3f-4a5b6c7d8e9f"), new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new Guid("e4e1f7d8-c3b2-4a90-8c67-2f5a1b3d9e0c"), null, null, true, false, -5.00m, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), null },
                    { new Guid("22222222-2222-2222-2222-222222222222"), new Guid("d29b0f1c-8e2a-4c5b-bc3d-1a2f3e4d5c6b"), new Guid("7b2e1a9d-3f5c-4e8b-91d2-a6b3c4d5e6f7"), new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new Guid("e4e1f7d8-c3b2-4a90-8c67-2f5a1b3d9e0c"), null, null, true, false, 0m, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), null },
                    { new Guid("22222222-2222-2222-2222-222222222222"), new Guid("d29b0f1c-8e2a-4c5b-bc3d-1a2f3e4d5c6b"), new Guid("9f8e7d6c-5b4a-4e3d-2c1b-0a9f8e7d6c5b"), new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new Guid("e4e1f7d8-c3b2-4a90-8c67-2f5a1b3d9e0c"), null, null, true, false, -20.00m, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), null },
                    { new Guid("22222222-2222-2222-2222-222222222222"), new Guid("d29b0f1c-8e2a-4c5b-bc3d-1a2f3e4d5c6b"), new Guid("d1e2f3a4-b5c6-4d7e-8f9a-0b1c2d3e4f5a"), new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new Guid("e4e1f7d8-c3b2-4a90-8c67-2f5a1b3d9e0c"), null, null, true, false, -25.00m, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), null },
                    { new Guid("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"), new Guid("3fbc4a32-15f5-47e0-b98a-784f1b8a9612"), new Guid("1a2b3c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d"), new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new Guid("e4e1f7d8-c3b2-4a90-8c67-2f5a1b3d9e0c"), null, null, true, false, -15.00m, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), null },
                    { new Guid("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"), new Guid("3fbc4a32-15f5-47e0-b98a-784f1b8a9612"), new Guid("3d4e5f6a-7b8c-4d9e-0f1a-2b3c4d5e6f7a"), new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new Guid("e4e1f7d8-c3b2-4a90-8c67-2f5a1b3d9e0c"), null, null, true, false, -10.00m, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), null },
                    { new Guid("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"), new Guid("3fbc4a32-15f5-47e0-b98a-784f1b8a9612"), new Guid("5c6d7e8f-9a0b-4c1d-2e3f-4a5b6c7d8e9f"), new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new Guid("e4e1f7d8-c3b2-4a90-8c67-2f5a1b3d9e0c"), null, null, true, false, -5.00m, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), null },
                    { new Guid("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"), new Guid("3fbc4a32-15f5-47e0-b98a-784f1b8a9612"), new Guid("7b2e1a9d-3f5c-4e8b-91d2-a6b3c4d5e6f7"), new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new Guid("e4e1f7d8-c3b2-4a90-8c67-2f5a1b3d9e0c"), null, null, true, false, 0m, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), null },
                    { new Guid("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"), new Guid("3fbc4a32-15f5-47e0-b98a-784f1b8a9612"), new Guid("9f8e7d6c-5b4a-4e3d-2c1b-0a9f8e7d6c5b"), new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new Guid("e4e1f7d8-c3b2-4a90-8c67-2f5a1b3d9e0c"), null, null, true, false, -20.00m, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), null },
                    { new Guid("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"), new Guid("3fbc4a32-15f5-47e0-b98a-784f1b8a9612"), new Guid("d1e2f3a4-b5c6-4d7e-8f9a-0b1c2d3e4f5a"), new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new Guid("e4e1f7d8-c3b2-4a90-8c67-2f5a1b3d9e0c"), null, null, true, false, -25.00m, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), null },
                    { new Guid("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"), new Guid("7a5e82b1-c4d3-4a92-9e11-3f4b52c1a8d9"), new Guid("1a2b3c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d"), new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new Guid("e4e1f7d8-c3b2-4a90-8c67-2f5a1b3d9e0c"), null, null, true, false, -15.00m, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), null },
                    { new Guid("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"), new Guid("7a5e82b1-c4d3-4a92-9e11-3f4b52c1a8d9"), new Guid("3d4e5f6a-7b8c-4d9e-0f1a-2b3c4d5e6f7a"), new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new Guid("e4e1f7d8-c3b2-4a90-8c67-2f5a1b3d9e0c"), null, null, true, false, -10.00m, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), null },
                    { new Guid("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"), new Guid("7a5e82b1-c4d3-4a92-9e11-3f4b52c1a8d9"), new Guid("5c6d7e8f-9a0b-4c1d-2e3f-4a5b6c7d8e9f"), new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new Guid("e4e1f7d8-c3b2-4a90-8c67-2f5a1b3d9e0c"), null, null, true, false, -5.00m, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), null },
                    { new Guid("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"), new Guid("7a5e82b1-c4d3-4a92-9e11-3f4b52c1a8d9"), new Guid("7b2e1a9d-3f5c-4e8b-91d2-a6b3c4d5e6f7"), new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new Guid("e4e1f7d8-c3b2-4a90-8c67-2f5a1b3d9e0c"), null, null, true, false, 0m, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), null },
                    { new Guid("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"), new Guid("7a5e82b1-c4d3-4a92-9e11-3f4b52c1a8d9"), new Guid("9f8e7d6c-5b4a-4e3d-2c1b-0a9f8e7d6c5b"), new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new Guid("e4e1f7d8-c3b2-4a90-8c67-2f5a1b3d9e0c"), null, null, true, false, -20.00m, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), null },
                    { new Guid("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"), new Guid("7a5e82b1-c4d3-4a92-9e11-3f4b52c1a8d9"), new Guid("d1e2f3a4-b5c6-4d7e-8f9a-0b1c2d3e4f5a"), new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new Guid("e4e1f7d8-c3b2-4a90-8c67-2f5a1b3d9e0c"), null, null, true, false, -25.00m, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), null },
                    { new Guid("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"), new Guid("d29b0f1c-8e2a-4c5b-bc3d-1a2f3e4d5c6b"), new Guid("1a2b3c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d"), new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new Guid("e4e1f7d8-c3b2-4a90-8c67-2f5a1b3d9e0c"), null, null, true, false, -15.00m, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), null },
                    { new Guid("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"), new Guid("d29b0f1c-8e2a-4c5b-bc3d-1a2f3e4d5c6b"), new Guid("3d4e5f6a-7b8c-4d9e-0f1a-2b3c4d5e6f7a"), new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new Guid("e4e1f7d8-c3b2-4a90-8c67-2f5a1b3d9e0c"), null, null, true, false, -10.00m, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), null },
                    { new Guid("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"), new Guid("d29b0f1c-8e2a-4c5b-bc3d-1a2f3e4d5c6b"), new Guid("5c6d7e8f-9a0b-4c1d-2e3f-4a5b6c7d8e9f"), new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new Guid("e4e1f7d8-c3b2-4a90-8c67-2f5a1b3d9e0c"), null, null, true, false, -5.00m, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), null },
                    { new Guid("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"), new Guid("d29b0f1c-8e2a-4c5b-bc3d-1a2f3e4d5c6b"), new Guid("7b2e1a9d-3f5c-4e8b-91d2-a6b3c4d5e6f7"), new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new Guid("e4e1f7d8-c3b2-4a90-8c67-2f5a1b3d9e0c"), null, null, true, false, 0m, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), null },
                    { new Guid("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"), new Guid("d29b0f1c-8e2a-4c5b-bc3d-1a2f3e4d5c6b"), new Guid("9f8e7d6c-5b4a-4e3d-2c1b-0a9f8e7d6c5b"), new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new Guid("e4e1f7d8-c3b2-4a90-8c67-2f5a1b3d9e0c"), null, null, true, false, -20.00m, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), null },
                    { new Guid("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"), new Guid("d29b0f1c-8e2a-4c5b-bc3d-1a2f3e4d5c6b"), new Guid("d1e2f3a4-b5c6-4d7e-8f9a-0b1c2d3e4f5a"), new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new Guid("e4e1f7d8-c3b2-4a90-8c67-2f5a1b3d9e0c"), null, null, true, false, -25.00m, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), null }
                });

            migrationBuilder.UpdateData(
                table: "MovieInfoEntity",
                keyColumn: "MovieId",
                keyValue: new Guid("66666666-6666-6666-6666-666666666666"),
                column: "UpdatedAt",
                value: new DateTime(2026, 3, 18, 1, 43, 55, 759, DateTimeKind.Local).AddTicks(8158));

            migrationBuilder.UpdateData(
                table: "MovieInfoEntity",
                keyColumn: "MovieId",
                keyValue: new Guid("77777777-7777-7777-7777-777777777777"),
                column: "UpdatedAt",
                value: new DateTime(2026, 3, 18, 1, 43, 55, 759, DateTimeKind.Local).AddTicks(8183));

            migrationBuilder.UpdateData(
                table: "MovieInfoEntity",
                keyColumn: "MovieId",
                keyValue: new Guid("88888888-8888-8888-8888-888888888888"),
                column: "UpdatedAt",
                value: new DateTime(2026, 3, 18, 1, 43, 55, 759, DateTimeKind.Local).AddTicks(8187));

            migrationBuilder.InsertData(
                table: "MovieScheduleInfoEntity",
                columns: new[] { "MovieScheduleInfoId", "ActiveAt", "AuditoriumId", "CreatedAt", "CreatedByUserId", "DeletedAt", "DeletedByUserId", "EndedTime", "IsActive", "IsDeleted", "MovieFormatId", "MovieId", "StartTime", "UpdatedAt", "UpdatedByUserId" },
                values: new object[,]
                {
                    { new Guid("b9d5eb84-478a-4dfe-a914-24fe302f7477"), new DateTime(2026, 3, 19, 20, 0, 0, 0, DateTimeKind.Unspecified), new Guid("44444444-4444-4444-4444-444444444444"), new DateTime(2026, 3, 18, 1, 43, 55, 759, DateTimeKind.Local).AddTicks(8310), new Guid("e4e1f7d8-c3b2-4a90-8c67-2f5a1b3d9e0c"), null, null, new DateTime(2026, 3, 19, 23, 0, 0, 0, DateTimeKind.Unspecified), true, false, new Guid("d29b0f1c-8e2a-4c5b-bc3d-1a2f3e4d5c6b"), new Guid("77777777-7777-7777-7777-777777777777"), new DateTime(2026, 3, 19, 20, 0, 0, 0, DateTimeKind.Unspecified), new DateTime(2026, 3, 18, 1, 43, 55, 759, DateTimeKind.Local).AddTicks(8311), null },
                    { new Guid("eb69c94e-936e-4fc9-acb4-a68720ec1fac"), new DateTime(2026, 3, 19, 19, 0, 0, 0, DateTimeKind.Unspecified), new Guid("33333333-3333-3333-3333-333333333333"), new DateTime(2026, 3, 18, 1, 43, 55, 759, DateTimeKind.Local).AddTicks(8275), new Guid("7b5d2c1e-9f8a-3e7b-c1d2-a0e9f8c7b6a5"), null, null, new DateTime(2026, 3, 19, 21, 56, 0, 0, DateTimeKind.Unspecified), true, false, new Guid("3fbc4a32-15f5-47e0-b98a-784f1b8a9612"), new Guid("66666666-6666-6666-6666-666666666666"), new DateTime(2026, 3, 19, 19, 0, 0, 0, DateTimeKind.Unspecified), new DateTime(2026, 3, 18, 1, 43, 55, 759, DateTimeKind.Local).AddTicks(8276), null }
                });

            migrationBuilder.CreateIndex(
                name: "IX_CinemaSurchargeInfosEntity_MovieFormatId",
                table: "CinemaSurchargeInfosEntity",
                column: "MovieFormatId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropPrimaryKey(
                name: "PK_CinemaSurchargeInfosEntity",
                table: "CinemaSurchargeInfosEntity");

            migrationBuilder.DropIndex(
                name: "IX_CinemaSurchargeInfosEntity_MovieFormatId",
                table: "CinemaSurchargeInfosEntity");

            migrationBuilder.DeleteData(
                table: "CinemaSurchargeInfosEntity",
                keyColumns: new[] { "CinemaId", "MovieFormatId", "UserSegmentId" },
                keyValues: new object[] { new Guid("11111111-1111-1111-1111-111111111111"), new Guid("3fbc4a32-15f5-47e0-b98a-784f1b8a9612"), new Guid("1a2b3c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d") });

            migrationBuilder.DeleteData(
                table: "CinemaSurchargeInfosEntity",
                keyColumns: new[] { "CinemaId", "MovieFormatId", "UserSegmentId" },
                keyValues: new object[] { new Guid("11111111-1111-1111-1111-111111111111"), new Guid("3fbc4a32-15f5-47e0-b98a-784f1b8a9612"), new Guid("3d4e5f6a-7b8c-4d9e-0f1a-2b3c4d5e6f7a") });

            migrationBuilder.DeleteData(
                table: "CinemaSurchargeInfosEntity",
                keyColumns: new[] { "CinemaId", "MovieFormatId", "UserSegmentId" },
                keyValues: new object[] { new Guid("11111111-1111-1111-1111-111111111111"), new Guid("3fbc4a32-15f5-47e0-b98a-784f1b8a9612"), new Guid("5c6d7e8f-9a0b-4c1d-2e3f-4a5b6c7d8e9f") });

            migrationBuilder.DeleteData(
                table: "CinemaSurchargeInfosEntity",
                keyColumns: new[] { "CinemaId", "MovieFormatId", "UserSegmentId" },
                keyValues: new object[] { new Guid("11111111-1111-1111-1111-111111111111"), new Guid("3fbc4a32-15f5-47e0-b98a-784f1b8a9612"), new Guid("7b2e1a9d-3f5c-4e8b-91d2-a6b3c4d5e6f7") });

            migrationBuilder.DeleteData(
                table: "CinemaSurchargeInfosEntity",
                keyColumns: new[] { "CinemaId", "MovieFormatId", "UserSegmentId" },
                keyValues: new object[] { new Guid("11111111-1111-1111-1111-111111111111"), new Guid("3fbc4a32-15f5-47e0-b98a-784f1b8a9612"), new Guid("9f8e7d6c-5b4a-4e3d-2c1b-0a9f8e7d6c5b") });

            migrationBuilder.DeleteData(
                table: "CinemaSurchargeInfosEntity",
                keyColumns: new[] { "CinemaId", "MovieFormatId", "UserSegmentId" },
                keyValues: new object[] { new Guid("11111111-1111-1111-1111-111111111111"), new Guid("3fbc4a32-15f5-47e0-b98a-784f1b8a9612"), new Guid("d1e2f3a4-b5c6-4d7e-8f9a-0b1c2d3e4f5a") });

            migrationBuilder.DeleteData(
                table: "CinemaSurchargeInfosEntity",
                keyColumns: new[] { "CinemaId", "MovieFormatId", "UserSegmentId" },
                keyValues: new object[] { new Guid("11111111-1111-1111-1111-111111111111"), new Guid("7a5e82b1-c4d3-4a92-9e11-3f4b52c1a8d9"), new Guid("1a2b3c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d") });

            migrationBuilder.DeleteData(
                table: "CinemaSurchargeInfosEntity",
                keyColumns: new[] { "CinemaId", "MovieFormatId", "UserSegmentId" },
                keyValues: new object[] { new Guid("11111111-1111-1111-1111-111111111111"), new Guid("7a5e82b1-c4d3-4a92-9e11-3f4b52c1a8d9"), new Guid("3d4e5f6a-7b8c-4d9e-0f1a-2b3c4d5e6f7a") });

            migrationBuilder.DeleteData(
                table: "CinemaSurchargeInfosEntity",
                keyColumns: new[] { "CinemaId", "MovieFormatId", "UserSegmentId" },
                keyValues: new object[] { new Guid("11111111-1111-1111-1111-111111111111"), new Guid("7a5e82b1-c4d3-4a92-9e11-3f4b52c1a8d9"), new Guid("5c6d7e8f-9a0b-4c1d-2e3f-4a5b6c7d8e9f") });

            migrationBuilder.DeleteData(
                table: "CinemaSurchargeInfosEntity",
                keyColumns: new[] { "CinemaId", "MovieFormatId", "UserSegmentId" },
                keyValues: new object[] { new Guid("11111111-1111-1111-1111-111111111111"), new Guid("7a5e82b1-c4d3-4a92-9e11-3f4b52c1a8d9"), new Guid("7b2e1a9d-3f5c-4e8b-91d2-a6b3c4d5e6f7") });

            migrationBuilder.DeleteData(
                table: "CinemaSurchargeInfosEntity",
                keyColumns: new[] { "CinemaId", "MovieFormatId", "UserSegmentId" },
                keyValues: new object[] { new Guid("11111111-1111-1111-1111-111111111111"), new Guid("7a5e82b1-c4d3-4a92-9e11-3f4b52c1a8d9"), new Guid("9f8e7d6c-5b4a-4e3d-2c1b-0a9f8e7d6c5b") });

            migrationBuilder.DeleteData(
                table: "CinemaSurchargeInfosEntity",
                keyColumns: new[] { "CinemaId", "MovieFormatId", "UserSegmentId" },
                keyValues: new object[] { new Guid("11111111-1111-1111-1111-111111111111"), new Guid("7a5e82b1-c4d3-4a92-9e11-3f4b52c1a8d9"), new Guid("d1e2f3a4-b5c6-4d7e-8f9a-0b1c2d3e4f5a") });

            migrationBuilder.DeleteData(
                table: "CinemaSurchargeInfosEntity",
                keyColumns: new[] { "CinemaId", "MovieFormatId", "UserSegmentId" },
                keyValues: new object[] { new Guid("11111111-1111-1111-1111-111111111111"), new Guid("d29b0f1c-8e2a-4c5b-bc3d-1a2f3e4d5c6b"), new Guid("1a2b3c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d") });

            migrationBuilder.DeleteData(
                table: "CinemaSurchargeInfosEntity",
                keyColumns: new[] { "CinemaId", "MovieFormatId", "UserSegmentId" },
                keyValues: new object[] { new Guid("11111111-1111-1111-1111-111111111111"), new Guid("d29b0f1c-8e2a-4c5b-bc3d-1a2f3e4d5c6b"), new Guid("3d4e5f6a-7b8c-4d9e-0f1a-2b3c4d5e6f7a") });

            migrationBuilder.DeleteData(
                table: "CinemaSurchargeInfosEntity",
                keyColumns: new[] { "CinemaId", "MovieFormatId", "UserSegmentId" },
                keyValues: new object[] { new Guid("11111111-1111-1111-1111-111111111111"), new Guid("d29b0f1c-8e2a-4c5b-bc3d-1a2f3e4d5c6b"), new Guid("5c6d7e8f-9a0b-4c1d-2e3f-4a5b6c7d8e9f") });

            migrationBuilder.DeleteData(
                table: "CinemaSurchargeInfosEntity",
                keyColumns: new[] { "CinemaId", "MovieFormatId", "UserSegmentId" },
                keyValues: new object[] { new Guid("11111111-1111-1111-1111-111111111111"), new Guid("d29b0f1c-8e2a-4c5b-bc3d-1a2f3e4d5c6b"), new Guid("7b2e1a9d-3f5c-4e8b-91d2-a6b3c4d5e6f7") });

            migrationBuilder.DeleteData(
                table: "CinemaSurchargeInfosEntity",
                keyColumns: new[] { "CinemaId", "MovieFormatId", "UserSegmentId" },
                keyValues: new object[] { new Guid("11111111-1111-1111-1111-111111111111"), new Guid("d29b0f1c-8e2a-4c5b-bc3d-1a2f3e4d5c6b"), new Guid("9f8e7d6c-5b4a-4e3d-2c1b-0a9f8e7d6c5b") });

            migrationBuilder.DeleteData(
                table: "CinemaSurchargeInfosEntity",
                keyColumns: new[] { "CinemaId", "MovieFormatId", "UserSegmentId" },
                keyValues: new object[] { new Guid("11111111-1111-1111-1111-111111111111"), new Guid("d29b0f1c-8e2a-4c5b-bc3d-1a2f3e4d5c6b"), new Guid("d1e2f3a4-b5c6-4d7e-8f9a-0b1c2d3e4f5a") });

            migrationBuilder.DeleteData(
                table: "CinemaSurchargeInfosEntity",
                keyColumns: new[] { "CinemaId", "MovieFormatId", "UserSegmentId" },
                keyValues: new object[] { new Guid("22222222-2222-2222-2222-222222222222"), new Guid("3fbc4a32-15f5-47e0-b98a-784f1b8a9612"), new Guid("1a2b3c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d") });

            migrationBuilder.DeleteData(
                table: "CinemaSurchargeInfosEntity",
                keyColumns: new[] { "CinemaId", "MovieFormatId", "UserSegmentId" },
                keyValues: new object[] { new Guid("22222222-2222-2222-2222-222222222222"), new Guid("3fbc4a32-15f5-47e0-b98a-784f1b8a9612"), new Guid("3d4e5f6a-7b8c-4d9e-0f1a-2b3c4d5e6f7a") });

            migrationBuilder.DeleteData(
                table: "CinemaSurchargeInfosEntity",
                keyColumns: new[] { "CinemaId", "MovieFormatId", "UserSegmentId" },
                keyValues: new object[] { new Guid("22222222-2222-2222-2222-222222222222"), new Guid("3fbc4a32-15f5-47e0-b98a-784f1b8a9612"), new Guid("5c6d7e8f-9a0b-4c1d-2e3f-4a5b6c7d8e9f") });

            migrationBuilder.DeleteData(
                table: "CinemaSurchargeInfosEntity",
                keyColumns: new[] { "CinemaId", "MovieFormatId", "UserSegmentId" },
                keyValues: new object[] { new Guid("22222222-2222-2222-2222-222222222222"), new Guid("3fbc4a32-15f5-47e0-b98a-784f1b8a9612"), new Guid("7b2e1a9d-3f5c-4e8b-91d2-a6b3c4d5e6f7") });

            migrationBuilder.DeleteData(
                table: "CinemaSurchargeInfosEntity",
                keyColumns: new[] { "CinemaId", "MovieFormatId", "UserSegmentId" },
                keyValues: new object[] { new Guid("22222222-2222-2222-2222-222222222222"), new Guid("3fbc4a32-15f5-47e0-b98a-784f1b8a9612"), new Guid("9f8e7d6c-5b4a-4e3d-2c1b-0a9f8e7d6c5b") });

            migrationBuilder.DeleteData(
                table: "CinemaSurchargeInfosEntity",
                keyColumns: new[] { "CinemaId", "MovieFormatId", "UserSegmentId" },
                keyValues: new object[] { new Guid("22222222-2222-2222-2222-222222222222"), new Guid("3fbc4a32-15f5-47e0-b98a-784f1b8a9612"), new Guid("d1e2f3a4-b5c6-4d7e-8f9a-0b1c2d3e4f5a") });

            migrationBuilder.DeleteData(
                table: "CinemaSurchargeInfosEntity",
                keyColumns: new[] { "CinemaId", "MovieFormatId", "UserSegmentId" },
                keyValues: new object[] { new Guid("22222222-2222-2222-2222-222222222222"), new Guid("7a5e82b1-c4d3-4a92-9e11-3f4b52c1a8d9"), new Guid("1a2b3c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d") });

            migrationBuilder.DeleteData(
                table: "CinemaSurchargeInfosEntity",
                keyColumns: new[] { "CinemaId", "MovieFormatId", "UserSegmentId" },
                keyValues: new object[] { new Guid("22222222-2222-2222-2222-222222222222"), new Guid("7a5e82b1-c4d3-4a92-9e11-3f4b52c1a8d9"), new Guid("3d4e5f6a-7b8c-4d9e-0f1a-2b3c4d5e6f7a") });

            migrationBuilder.DeleteData(
                table: "CinemaSurchargeInfosEntity",
                keyColumns: new[] { "CinemaId", "MovieFormatId", "UserSegmentId" },
                keyValues: new object[] { new Guid("22222222-2222-2222-2222-222222222222"), new Guid("7a5e82b1-c4d3-4a92-9e11-3f4b52c1a8d9"), new Guid("5c6d7e8f-9a0b-4c1d-2e3f-4a5b6c7d8e9f") });

            migrationBuilder.DeleteData(
                table: "CinemaSurchargeInfosEntity",
                keyColumns: new[] { "CinemaId", "MovieFormatId", "UserSegmentId" },
                keyValues: new object[] { new Guid("22222222-2222-2222-2222-222222222222"), new Guid("7a5e82b1-c4d3-4a92-9e11-3f4b52c1a8d9"), new Guid("7b2e1a9d-3f5c-4e8b-91d2-a6b3c4d5e6f7") });

            migrationBuilder.DeleteData(
                table: "CinemaSurchargeInfosEntity",
                keyColumns: new[] { "CinemaId", "MovieFormatId", "UserSegmentId" },
                keyValues: new object[] { new Guid("22222222-2222-2222-2222-222222222222"), new Guid("7a5e82b1-c4d3-4a92-9e11-3f4b52c1a8d9"), new Guid("9f8e7d6c-5b4a-4e3d-2c1b-0a9f8e7d6c5b") });

            migrationBuilder.DeleteData(
                table: "CinemaSurchargeInfosEntity",
                keyColumns: new[] { "CinemaId", "MovieFormatId", "UserSegmentId" },
                keyValues: new object[] { new Guid("22222222-2222-2222-2222-222222222222"), new Guid("7a5e82b1-c4d3-4a92-9e11-3f4b52c1a8d9"), new Guid("d1e2f3a4-b5c6-4d7e-8f9a-0b1c2d3e4f5a") });

            migrationBuilder.DeleteData(
                table: "CinemaSurchargeInfosEntity",
                keyColumns: new[] { "CinemaId", "MovieFormatId", "UserSegmentId" },
                keyValues: new object[] { new Guid("22222222-2222-2222-2222-222222222222"), new Guid("d29b0f1c-8e2a-4c5b-bc3d-1a2f3e4d5c6b"), new Guid("1a2b3c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d") });

            migrationBuilder.DeleteData(
                table: "CinemaSurchargeInfosEntity",
                keyColumns: new[] { "CinemaId", "MovieFormatId", "UserSegmentId" },
                keyValues: new object[] { new Guid("22222222-2222-2222-2222-222222222222"), new Guid("d29b0f1c-8e2a-4c5b-bc3d-1a2f3e4d5c6b"), new Guid("3d4e5f6a-7b8c-4d9e-0f1a-2b3c4d5e6f7a") });

            migrationBuilder.DeleteData(
                table: "CinemaSurchargeInfosEntity",
                keyColumns: new[] { "CinemaId", "MovieFormatId", "UserSegmentId" },
                keyValues: new object[] { new Guid("22222222-2222-2222-2222-222222222222"), new Guid("d29b0f1c-8e2a-4c5b-bc3d-1a2f3e4d5c6b"), new Guid("5c6d7e8f-9a0b-4c1d-2e3f-4a5b6c7d8e9f") });

            migrationBuilder.DeleteData(
                table: "CinemaSurchargeInfosEntity",
                keyColumns: new[] { "CinemaId", "MovieFormatId", "UserSegmentId" },
                keyValues: new object[] { new Guid("22222222-2222-2222-2222-222222222222"), new Guid("d29b0f1c-8e2a-4c5b-bc3d-1a2f3e4d5c6b"), new Guid("7b2e1a9d-3f5c-4e8b-91d2-a6b3c4d5e6f7") });

            migrationBuilder.DeleteData(
                table: "CinemaSurchargeInfosEntity",
                keyColumns: new[] { "CinemaId", "MovieFormatId", "UserSegmentId" },
                keyValues: new object[] { new Guid("22222222-2222-2222-2222-222222222222"), new Guid("d29b0f1c-8e2a-4c5b-bc3d-1a2f3e4d5c6b"), new Guid("9f8e7d6c-5b4a-4e3d-2c1b-0a9f8e7d6c5b") });

            migrationBuilder.DeleteData(
                table: "CinemaSurchargeInfosEntity",
                keyColumns: new[] { "CinemaId", "MovieFormatId", "UserSegmentId" },
                keyValues: new object[] { new Guid("22222222-2222-2222-2222-222222222222"), new Guid("d29b0f1c-8e2a-4c5b-bc3d-1a2f3e4d5c6b"), new Guid("d1e2f3a4-b5c6-4d7e-8f9a-0b1c2d3e4f5a") });

            migrationBuilder.DeleteData(
                table: "CinemaSurchargeInfosEntity",
                keyColumns: new[] { "CinemaId", "MovieFormatId", "UserSegmentId" },
                keyValues: new object[] { new Guid("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"), new Guid("3fbc4a32-15f5-47e0-b98a-784f1b8a9612"), new Guid("1a2b3c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d") });

            migrationBuilder.DeleteData(
                table: "CinemaSurchargeInfosEntity",
                keyColumns: new[] { "CinemaId", "MovieFormatId", "UserSegmentId" },
                keyValues: new object[] { new Guid("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"), new Guid("3fbc4a32-15f5-47e0-b98a-784f1b8a9612"), new Guid("3d4e5f6a-7b8c-4d9e-0f1a-2b3c4d5e6f7a") });

            migrationBuilder.DeleteData(
                table: "CinemaSurchargeInfosEntity",
                keyColumns: new[] { "CinemaId", "MovieFormatId", "UserSegmentId" },
                keyValues: new object[] { new Guid("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"), new Guid("3fbc4a32-15f5-47e0-b98a-784f1b8a9612"), new Guid("5c6d7e8f-9a0b-4c1d-2e3f-4a5b6c7d8e9f") });

            migrationBuilder.DeleteData(
                table: "CinemaSurchargeInfosEntity",
                keyColumns: new[] { "CinemaId", "MovieFormatId", "UserSegmentId" },
                keyValues: new object[] { new Guid("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"), new Guid("3fbc4a32-15f5-47e0-b98a-784f1b8a9612"), new Guid("7b2e1a9d-3f5c-4e8b-91d2-a6b3c4d5e6f7") });

            migrationBuilder.DeleteData(
                table: "CinemaSurchargeInfosEntity",
                keyColumns: new[] { "CinemaId", "MovieFormatId", "UserSegmentId" },
                keyValues: new object[] { new Guid("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"), new Guid("3fbc4a32-15f5-47e0-b98a-784f1b8a9612"), new Guid("9f8e7d6c-5b4a-4e3d-2c1b-0a9f8e7d6c5b") });

            migrationBuilder.DeleteData(
                table: "CinemaSurchargeInfosEntity",
                keyColumns: new[] { "CinemaId", "MovieFormatId", "UserSegmentId" },
                keyValues: new object[] { new Guid("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"), new Guid("3fbc4a32-15f5-47e0-b98a-784f1b8a9612"), new Guid("d1e2f3a4-b5c6-4d7e-8f9a-0b1c2d3e4f5a") });

            migrationBuilder.DeleteData(
                table: "CinemaSurchargeInfosEntity",
                keyColumns: new[] { "CinemaId", "MovieFormatId", "UserSegmentId" },
                keyValues: new object[] { new Guid("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"), new Guid("7a5e82b1-c4d3-4a92-9e11-3f4b52c1a8d9"), new Guid("1a2b3c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d") });

            migrationBuilder.DeleteData(
                table: "CinemaSurchargeInfosEntity",
                keyColumns: new[] { "CinemaId", "MovieFormatId", "UserSegmentId" },
                keyValues: new object[] { new Guid("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"), new Guid("7a5e82b1-c4d3-4a92-9e11-3f4b52c1a8d9"), new Guid("3d4e5f6a-7b8c-4d9e-0f1a-2b3c4d5e6f7a") });

            migrationBuilder.DeleteData(
                table: "CinemaSurchargeInfosEntity",
                keyColumns: new[] { "CinemaId", "MovieFormatId", "UserSegmentId" },
                keyValues: new object[] { new Guid("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"), new Guid("7a5e82b1-c4d3-4a92-9e11-3f4b52c1a8d9"), new Guid("5c6d7e8f-9a0b-4c1d-2e3f-4a5b6c7d8e9f") });

            migrationBuilder.DeleteData(
                table: "CinemaSurchargeInfosEntity",
                keyColumns: new[] { "CinemaId", "MovieFormatId", "UserSegmentId" },
                keyValues: new object[] { new Guid("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"), new Guid("7a5e82b1-c4d3-4a92-9e11-3f4b52c1a8d9"), new Guid("7b2e1a9d-3f5c-4e8b-91d2-a6b3c4d5e6f7") });

            migrationBuilder.DeleteData(
                table: "CinemaSurchargeInfosEntity",
                keyColumns: new[] { "CinemaId", "MovieFormatId", "UserSegmentId" },
                keyValues: new object[] { new Guid("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"), new Guid("7a5e82b1-c4d3-4a92-9e11-3f4b52c1a8d9"), new Guid("9f8e7d6c-5b4a-4e3d-2c1b-0a9f8e7d6c5b") });

            migrationBuilder.DeleteData(
                table: "CinemaSurchargeInfosEntity",
                keyColumns: new[] { "CinemaId", "MovieFormatId", "UserSegmentId" },
                keyValues: new object[] { new Guid("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"), new Guid("7a5e82b1-c4d3-4a92-9e11-3f4b52c1a8d9"), new Guid("d1e2f3a4-b5c6-4d7e-8f9a-0b1c2d3e4f5a") });

            migrationBuilder.DeleteData(
                table: "CinemaSurchargeInfosEntity",
                keyColumns: new[] { "CinemaId", "MovieFormatId", "UserSegmentId" },
                keyValues: new object[] { new Guid("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"), new Guid("d29b0f1c-8e2a-4c5b-bc3d-1a2f3e4d5c6b"), new Guid("1a2b3c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d") });

            migrationBuilder.DeleteData(
                table: "CinemaSurchargeInfosEntity",
                keyColumns: new[] { "CinemaId", "MovieFormatId", "UserSegmentId" },
                keyValues: new object[] { new Guid("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"), new Guid("d29b0f1c-8e2a-4c5b-bc3d-1a2f3e4d5c6b"), new Guid("3d4e5f6a-7b8c-4d9e-0f1a-2b3c4d5e6f7a") });

            migrationBuilder.DeleteData(
                table: "CinemaSurchargeInfosEntity",
                keyColumns: new[] { "CinemaId", "MovieFormatId", "UserSegmentId" },
                keyValues: new object[] { new Guid("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"), new Guid("d29b0f1c-8e2a-4c5b-bc3d-1a2f3e4d5c6b"), new Guid("5c6d7e8f-9a0b-4c1d-2e3f-4a5b6c7d8e9f") });

            migrationBuilder.DeleteData(
                table: "CinemaSurchargeInfosEntity",
                keyColumns: new[] { "CinemaId", "MovieFormatId", "UserSegmentId" },
                keyValues: new object[] { new Guid("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"), new Guid("d29b0f1c-8e2a-4c5b-bc3d-1a2f3e4d5c6b"), new Guid("7b2e1a9d-3f5c-4e8b-91d2-a6b3c4d5e6f7") });

            migrationBuilder.DeleteData(
                table: "CinemaSurchargeInfosEntity",
                keyColumns: new[] { "CinemaId", "MovieFormatId", "UserSegmentId" },
                keyValues: new object[] { new Guid("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"), new Guid("d29b0f1c-8e2a-4c5b-bc3d-1a2f3e4d5c6b"), new Guid("9f8e7d6c-5b4a-4e3d-2c1b-0a9f8e7d6c5b") });

            migrationBuilder.DeleteData(
                table: "CinemaSurchargeInfosEntity",
                keyColumns: new[] { "CinemaId", "MovieFormatId", "UserSegmentId" },
                keyValues: new object[] { new Guid("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"), new Guid("d29b0f1c-8e2a-4c5b-bc3d-1a2f3e4d5c6b"), new Guid("d1e2f3a4-b5c6-4d7e-8f9a-0b1c2d3e4f5a") });

            migrationBuilder.DeleteData(
                table: "MovieScheduleInfoEntity",
                keyColumn: "MovieScheduleInfoId",
                keyValue: new Guid("b9d5eb84-478a-4dfe-a914-24fe302f7477"));

            migrationBuilder.DeleteData(
                table: "MovieScheduleInfoEntity",
                keyColumn: "MovieScheduleInfoId",
                keyValue: new Guid("eb69c94e-936e-4fc9-acb4-a68720ec1fac"));

            migrationBuilder.AddPrimaryKey(
                name: "PK_CinemaSurchargeInfosEntity",
                table: "CinemaSurchargeInfosEntity",
                columns: new[] { "CinemaId", "MovieFormatId" });

            migrationBuilder.UpdateData(
                table: "AuditoriumInfoEntities",
                keyColumn: "AuditoriumId",
                keyValue: new Guid("33333333-3333-3333-3333-333333333333"),
                column: "UpdatedAt",
                value: new DateTime(2026, 3, 18, 1, 8, 16, 945, DateTimeKind.Local).AddTicks(7669));

            migrationBuilder.UpdateData(
                table: "AuditoriumInfoEntities",
                keyColumn: "AuditoriumId",
                keyValue: new Guid("44444444-4444-4444-4444-444444444444"),
                column: "UpdatedAt",
                value: new DateTime(2026, 3, 18, 1, 8, 16, 945, DateTimeKind.Local).AddTicks(7673));

            migrationBuilder.UpdateData(
                table: "AuditoriumInfoEntities",
                keyColumn: "AuditoriumId",
                keyValue: new Guid("55555555-5555-5555-5555-555555555555"),
                column: "UpdatedAt",
                value: new DateTime(2026, 3, 18, 1, 8, 16, 945, DateTimeKind.Local).AddTicks(7675));

            migrationBuilder.UpdateData(
                table: "CinemaInfoEntity",
                keyColumn: "CinemaId",
                keyValue: new Guid("11111111-1111-1111-1111-111111111111"),
                column: "UpdatedAt",
                value: new DateTime(2026, 3, 18, 1, 8, 16, 945, DateTimeKind.Local).AddTicks(7616));

            migrationBuilder.UpdateData(
                table: "CinemaInfoEntity",
                keyColumn: "CinemaId",
                keyValue: new Guid("22222222-2222-2222-2222-222222222222"),
                column: "UpdatedAt",
                value: new DateTime(2026, 3, 18, 1, 8, 16, 945, DateTimeKind.Local).AddTicks(7622));

            migrationBuilder.UpdateData(
                table: "CinemaInfoEntity",
                keyColumn: "CinemaId",
                keyValue: new Guid("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
                column: "UpdatedAt",
                value: new DateTime(2026, 3, 18, 1, 8, 16, 945, DateTimeKind.Local).AddTicks(7625));

            migrationBuilder.UpdateData(
                table: "MovieInfoEntity",
                keyColumn: "MovieId",
                keyValue: new Guid("66666666-6666-6666-6666-666666666666"),
                column: "UpdatedAt",
                value: new DateTime(2026, 3, 18, 1, 8, 16, 945, DateTimeKind.Local).AddTicks(8834));

            migrationBuilder.UpdateData(
                table: "MovieInfoEntity",
                keyColumn: "MovieId",
                keyValue: new Guid("77777777-7777-7777-7777-777777777777"),
                column: "UpdatedAt",
                value: new DateTime(2026, 3, 18, 1, 8, 16, 945, DateTimeKind.Local).AddTicks(8865));

            migrationBuilder.UpdateData(
                table: "MovieInfoEntity",
                keyColumn: "MovieId",
                keyValue: new Guid("88888888-8888-8888-8888-888888888888"),
                column: "UpdatedAt",
                value: new DateTime(2026, 3, 18, 1, 8, 16, 945, DateTimeKind.Local).AddTicks(8870));

            migrationBuilder.InsertData(
                table: "MovieScheduleInfoEntity",
                columns: new[] { "MovieScheduleInfoId", "ActiveAt", "AuditoriumId", "CreatedAt", "CreatedByUserId", "DeletedAt", "DeletedByUserId", "EndedTime", "IsActive", "IsDeleted", "MovieFormatId", "MovieId", "StartTime", "UpdatedAt", "UpdatedByUserId" },
                values: new object[,]
                {
                    { new Guid("449df7b2-9a4e-42a6-a441-3cf9ee213856"), new DateTime(2026, 3, 19, 19, 0, 0, 0, DateTimeKind.Unspecified), new Guid("33333333-3333-3333-3333-333333333333"), new DateTime(2026, 3, 18, 1, 8, 16, 945, DateTimeKind.Local).AddTicks(9011), new Guid("7b5d2c1e-9f8a-3e7b-c1d2-a0e9f8c7b6a5"), null, null, new DateTime(2026, 3, 19, 21, 56, 0, 0, DateTimeKind.Unspecified), true, false, new Guid("3fbc4a32-15f5-47e0-b98a-784f1b8a9612"), new Guid("66666666-6666-6666-6666-666666666666"), new DateTime(2026, 3, 19, 19, 0, 0, 0, DateTimeKind.Unspecified), new DateTime(2026, 3, 18, 1, 8, 16, 945, DateTimeKind.Local).AddTicks(9012), null },
                    { new Guid("7c37b7f2-77f3-4033-ad80-77adcb6713d3"), new DateTime(2026, 3, 19, 20, 0, 0, 0, DateTimeKind.Unspecified), new Guid("44444444-4444-4444-4444-444444444444"), new DateTime(2026, 3, 18, 1, 8, 16, 945, DateTimeKind.Local).AddTicks(9104), new Guid("e4e1f7d8-c3b2-4a90-8c67-2f5a1b3d9e0c"), null, null, new DateTime(2026, 3, 19, 23, 0, 0, 0, DateTimeKind.Unspecified), true, false, new Guid("d29b0f1c-8e2a-4c5b-bc3d-1a2f3e4d5c6b"), new Guid("77777777-7777-7777-7777-777777777777"), new DateTime(2026, 3, 19, 20, 0, 0, 0, DateTimeKind.Unspecified), new DateTime(2026, 3, 18, 1, 8, 16, 945, DateTimeKind.Local).AddTicks(9104), null }
                });

            migrationBuilder.CreateIndex(
                name: "IX_CinemaSurchargeInfosEntity_MovieFormatId_UserSegmentId",
                table: "CinemaSurchargeInfosEntity",
                columns: new[] { "MovieFormatId", "UserSegmentId" },
                unique: true);
        }
    }
}
