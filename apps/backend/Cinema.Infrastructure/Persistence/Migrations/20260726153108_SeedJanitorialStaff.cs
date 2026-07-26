using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace Cinema.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class SeedJanitorialStaff : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.InsertData(
                table: "UserInfoEntity",
                columns: new[] { "UserId", "AccountStatus", "DateOfBirth", "IdentityCode", "LockoutReason", "Password", "PhoneNumber", "PortraitImageUrl", "RefreshToken", "RegisterMethod", "RewardPoints", "SubId", "UserEmail", "UserName", "UserType" },
                values: new object[,]
                {
                    { new Guid("a1000000-0000-4000-8000-000000000001"), 1, new DateTime(1993, 4, 12, 0, 0, 0, 0, DateTimeKind.Utc), "JANITOR_GALAXY_001", null, "$2a$12$ufIKVZZwGlxHfQ0WSZQRmeDDeCuneaflIghQhHC6RupR0LVYLU5bi", "0988000101", null, null, 0, 0L, null, "janitor.galaxy.nguyen.du@cinema.com", "Nguyễn Minh Tâm", 0 },
                    { new Guid("a1000000-0000-4000-8000-000000000002"), 1, new DateTime(1991, 8, 23, 0, 0, 0, 0, DateTimeKind.Utc), "JANITOR_LOTTE_001", null, "$2a$12$ufIKVZZwGlxHfQ0WSZQRmeDDeCuneaflIghQhHC6RupR0LVYLU5bi", "0988000102", null, null, 0, 0L, null, "janitor.lotte.west.lake@cinema.com", "Trần Thị Mai", 0 },
                    { new Guid("a1000000-0000-4000-8000-000000000003"), 1, new DateTime(1995, 2, 7, 0, 0, 0, 0, DateTimeKind.Utc), "JANITOR_BHD_001", null, "$2a$12$ufIKVZZwGlxHfQ0WSZQRmeDDeCuneaflIghQhHC6RupR0LVYLU5bi", "0988000103", null, null, 0, 0L, null, "janitor.bhd.bitexco@cinema.com", "Lê Quốc Bảo", 0 }
                });

            migrationBuilder.InsertData(
                table: "StaffProfileEntity",
                columns: new[] { "UserId", "CinemaId", "DepartmentId", "EmployeeType", "FaceVector", "IsCinemaManager", "WorkingStatus" },
                values: new object[,]
                {
                    { new Guid("a1000000-0000-4000-8000-000000000001"), new Guid("11111111-1111-1111-1111-111111111111"), new Guid("d1111111-1111-1111-1111-333333333333"), 1, null, false, true },
                    { new Guid("a1000000-0000-4000-8000-000000000002"), new Guid("22222222-2222-2222-2222-222222222222"), new Guid("d2222222-2222-2222-2222-333333333333"), 1, null, false, true },
                    { new Guid("a1000000-0000-4000-8000-000000000003"), new Guid("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"), new Guid("dbbbbbbb-bbbb-bbbb-bbbb-333333333333"), 1, null, false, true }
                });

            migrationBuilder.InsertData(
                table: "UserRoleInfoEntity",
                columns: new[] { "RoleId", "UserId" },
                values: new object[,]
                {
                    { new Guid("7a4b3c5d-e0f1-a2b3-c4d5-e6f7a8b9c0d1"), new Guid("a1000000-0000-4000-8000-000000000001") },
                    { new Guid("7a4b3c5d-e0f1-a2b3-c4d5-e6f7a8b9c0d1"), new Guid("a1000000-0000-4000-8000-000000000002") },
                    { new Guid("7a4b3c5d-e0f1-a2b3-c4d5-e6f7a8b9c0d1"), new Guid("a1000000-0000-4000-8000-000000000003") }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "StaffProfileEntity",
                keyColumn: "UserId",
                keyValue: new Guid("a1000000-0000-4000-8000-000000000001"));

            migrationBuilder.DeleteData(
                table: "StaffProfileEntity",
                keyColumn: "UserId",
                keyValue: new Guid("a1000000-0000-4000-8000-000000000002"));

            migrationBuilder.DeleteData(
                table: "StaffProfileEntity",
                keyColumn: "UserId",
                keyValue: new Guid("a1000000-0000-4000-8000-000000000003"));

            migrationBuilder.DeleteData(
                table: "UserRoleInfoEntity",
                keyColumns: new[] { "RoleId", "UserId" },
                keyValues: new object[] { new Guid("7a4b3c5d-e0f1-a2b3-c4d5-e6f7a8b9c0d1"), new Guid("a1000000-0000-4000-8000-000000000001") });

            migrationBuilder.DeleteData(
                table: "UserRoleInfoEntity",
                keyColumns: new[] { "RoleId", "UserId" },
                keyValues: new object[] { new Guid("7a4b3c5d-e0f1-a2b3-c4d5-e6f7a8b9c0d1"), new Guid("a1000000-0000-4000-8000-000000000002") });

            migrationBuilder.DeleteData(
                table: "UserRoleInfoEntity",
                keyColumns: new[] { "RoleId", "UserId" },
                keyValues: new object[] { new Guid("7a4b3c5d-e0f1-a2b3-c4d5-e6f7a8b9c0d1"), new Guid("a1000000-0000-4000-8000-000000000003") });

            migrationBuilder.DeleteData(
                table: "UserInfoEntity",
                keyColumn: "UserId",
                keyValue: new Guid("a1000000-0000-4000-8000-000000000001"));

            migrationBuilder.DeleteData(
                table: "UserInfoEntity",
                keyColumn: "UserId",
                keyValue: new Guid("a1000000-0000-4000-8000-000000000002"));

            migrationBuilder.DeleteData(
                table: "UserInfoEntity",
                keyColumn: "UserId",
                keyValue: new Guid("a1000000-0000-4000-8000-000000000003"));
        }
    }
}
