using System;
using Cinema.Infrastructure;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Cinema.Infrastructure.Persistence.Migrations
{
    [DbContext(typeof(CinemaDbContext))]
    [Migration("20260629193000_SplitDepartmentSeedAccounts")]
    public partial class SplitDepartmentSeedAccounts : Migration
    {
        private static readonly Guid CashierRoleId = new("1a8f7b9c-d4e5-4f6a-b7c8-9d0e1f2a3b4c");

        private static readonly Guid GalaxyCinemaId = new("11111111-1111-1111-1111-111111111111");
        private static readonly Guid LotteCinemaId = new("22222222-2222-2222-2222-222222222222");
        private static readonly Guid BhdCinemaId = new("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");

        private static readonly Guid GalaxyTicketDepartmentId = new("d1111111-1111-1111-1111-111111111111");
        private static readonly Guid GalaxyFoodDepartmentId = new("d1111111-1111-1111-1111-222222222222");
        private static readonly Guid LotteTicketDepartmentId = new("d2222222-2222-2222-2222-111111111111");
        private static readonly Guid LotteFoodDepartmentId = new("d2222222-2222-2222-2222-222222222222");
        private static readonly Guid BhdTicketDepartmentId = new("dbbbbbbb-bbbb-bbbb-bbbb-111111111111");
        private static readonly Guid BhdFoodDepartmentId = new("dbbbbbbb-bbbb-bbbb-bbbb-222222222222");

        private static readonly Guid GalaxyTicketUserId = new("f9c3b8a1-8d24-42f5-b28f-e9c8f6153a11");
        private static readonly Guid GalaxyFoodUserId = new("f9c3b8a1-8d24-42f5-b28f-e9c8f6153a12");
        private static readonly Guid LotteTicketUserId = new("f9c3b8a1-8d24-42f5-b28f-e9c8f6153a21");
        private static readonly Guid LotteFoodUserId = new("f9c3b8a1-8d24-42f5-b28f-e9c8f6153a22");
        private static readonly Guid BhdTicketUserId = new("f9c3b8a1-8d24-42f5-b28f-e9c8f6153a31");
        private static readonly Guid BhdFoodUserId = new("f9c3b8a1-8d24-42f5-b28f-e9c8f6153a32");

        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.InsertData(
                table: "UserInfoEntity",
                columns: new[] { "UserId", "AccountStatus", "DateOfBirth", "IdentityCode", "LockoutReason", "Password", "PhoneNumber", "PortraitImageUrl", "RefreshToken", "RegisterMethod", "RewardPoints", "SubId", "UserEmail", "UserName" },
                values: new object[,]
                {
                    { GalaxyTicketUserId, 1, new DateTime(1990, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "POS-GALAXY-TICKET", null, "$2a$12$yDhsoUoUEcJKNcTFGo3gwugzOT7glSqRHVP2pk7yV6xeWQMUrAWuu", "0999000011", null, null, 0, 0L, null, "quay.ve.galaxy.cinema.nguyen.du@cinema.com", "Quay ve - Galaxy Cinema Nguyen Du" },
                    { GalaxyFoodUserId, 1, new DateTime(1990, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "POS-GALAXY-FOOD", null, "$2a$12$yDhsoUoUEcJKNcTFGo3gwugzOT7glSqRHVP2pk7yV6xeWQMUrAWuu", "0999000012", null, null, 0, 0L, null, "quay.bap.nuoc.galaxy.cinema.nguyen.du@cinema.com", "Quay bap nuoc - Galaxy Cinema Nguyen Du" },
                    { LotteTicketUserId, 1, new DateTime(1990, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "POS-LOTTE-TICKET", null, "$2a$12$yDhsoUoUEcJKNcTFGo3gwugzOT7glSqRHVP2pk7yV6xeWQMUrAWuu", "0999000021", null, null, 0, 0L, null, "quay.ve.lotte.cinema.west.lake@cinema.com", "Quay ve - Lotte Cinema West Lake" },
                    { LotteFoodUserId, 1, new DateTime(1990, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "POS-LOTTE-FOOD", null, "$2a$12$yDhsoUoUEcJKNcTFGo3gwugzOT7glSqRHVP2pk7yV6xeWQMUrAWuu", "0999000022", null, null, 0, 0L, null, "quay.bap.nuoc.lotte.cinema.west.lake@cinema.com", "Quay bap nuoc - Lotte Cinema West Lake" },
                    { BhdTicketUserId, 1, new DateTime(1990, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "POS-BHD-TICKET", null, "$2a$12$yDhsoUoUEcJKNcTFGo3gwugzOT7glSqRHVP2pk7yV6xeWQMUrAWuu", "0999000031", null, null, 0, 0L, null, "quay.ve.bhd.star.bitexco@cinema.com", "Quay ve - BHD Star Bitexco" },
                    { BhdFoodUserId, 1, new DateTime(1990, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "POS-BHD-FOOD", null, "$2a$12$yDhsoUoUEcJKNcTFGo3gwugzOT7glSqRHVP2pk7yV6xeWQMUrAWuu", "0999000032", null, null, 0, 0L, null, "quay.bap.nuoc.bhd.star.bitexco@cinema.com", "Quay bap nuoc - BHD Star Bitexco" }
                });

            migrationBuilder.InsertData(
                table: "UserRoleInfoEntity",
                columns: new[] { "RoleId", "UserId" },
                values: new object[,]
                {
                    { CashierRoleId, GalaxyTicketUserId },
                    { CashierRoleId, GalaxyFoodUserId },
                    { CashierRoleId, LotteTicketUserId },
                    { CashierRoleId, LotteFoodUserId },
                    { CashierRoleId, BhdTicketUserId },
                    { CashierRoleId, BhdFoodUserId }
                });

            migrationBuilder.InsertData(
                table: "StaffProfileEntity",
                columns: new[] { "UserId", "CinemaId", "DepartmentId", "EmployeeType", "FaceVector", "IsCinemaManager", "WorkingStatus" },
                values: new object[,]
                {
                    { GalaxyTicketUserId, GalaxyCinemaId, GalaxyTicketDepartmentId, 1, null, false, true },
                    { GalaxyFoodUserId, GalaxyCinemaId, GalaxyFoodDepartmentId, 1, null, false, true },
                    { LotteTicketUserId, LotteCinemaId, LotteTicketDepartmentId, 1, null, false, true },
                    { LotteFoodUserId, LotteCinemaId, LotteFoodDepartmentId, 1, null, false, true },
                    { BhdTicketUserId, BhdCinemaId, BhdTicketDepartmentId, 1, null, false, true },
                    { BhdFoodUserId, BhdCinemaId, BhdFoodDepartmentId, 1, null, false, true }
                });

            UpdateDepartmentSharedUser(migrationBuilder, GalaxyTicketDepartmentId, GalaxyTicketUserId);
            UpdateDepartmentSharedUser(migrationBuilder, GalaxyFoodDepartmentId, GalaxyFoodUserId);
            UpdateDepartmentSharedUser(migrationBuilder, LotteTicketDepartmentId, LotteTicketUserId);
            UpdateDepartmentSharedUser(migrationBuilder, LotteFoodDepartmentId, LotteFoodUserId);
            UpdateDepartmentSharedUser(migrationBuilder, BhdTicketDepartmentId, BhdTicketUserId);
            UpdateDepartmentSharedUser(migrationBuilder, BhdFoodDepartmentId, BhdFoodUserId);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            UpdateDepartmentSharedUser(migrationBuilder, GalaxyTicketDepartmentId, null);
            UpdateDepartmentSharedUser(migrationBuilder, GalaxyFoodDepartmentId, null);
            UpdateDepartmentSharedUser(migrationBuilder, LotteTicketDepartmentId, null);
            UpdateDepartmentSharedUser(migrationBuilder, LotteFoodDepartmentId, null);
            UpdateDepartmentSharedUser(migrationBuilder, BhdTicketDepartmentId, null);
            UpdateDepartmentSharedUser(migrationBuilder, BhdFoodDepartmentId, null);

            DeleteStaffProfile(migrationBuilder, GalaxyTicketUserId);
            DeleteStaffProfile(migrationBuilder, GalaxyFoodUserId);
            DeleteStaffProfile(migrationBuilder, LotteTicketUserId);
            DeleteStaffProfile(migrationBuilder, LotteFoodUserId);
            DeleteStaffProfile(migrationBuilder, BhdTicketUserId);
            DeleteStaffProfile(migrationBuilder, BhdFoodUserId);

            DeleteCashierRole(migrationBuilder, GalaxyTicketUserId);
            DeleteCashierRole(migrationBuilder, GalaxyFoodUserId);
            DeleteCashierRole(migrationBuilder, LotteTicketUserId);
            DeleteCashierRole(migrationBuilder, LotteFoodUserId);
            DeleteCashierRole(migrationBuilder, BhdTicketUserId);
            DeleteCashierRole(migrationBuilder, BhdFoodUserId);

            DeleteUser(migrationBuilder, GalaxyTicketUserId);
            DeleteUser(migrationBuilder, GalaxyFoodUserId);
            DeleteUser(migrationBuilder, LotteTicketUserId);
            DeleteUser(migrationBuilder, LotteFoodUserId);
            DeleteUser(migrationBuilder, BhdTicketUserId);
            DeleteUser(migrationBuilder, BhdFoodUserId);
        }

        private static void UpdateDepartmentSharedUser(MigrationBuilder migrationBuilder, Guid departmentId, Guid? userId)
        {
            migrationBuilder.UpdateData(
                table: "DepartmentEntity",
                keyColumn: "DepartmentId",
                keyValue: departmentId,
                column: "SharedUserId",
                value: userId);
        }

        private static void DeleteStaffProfile(MigrationBuilder migrationBuilder, Guid userId)
        {
            migrationBuilder.DeleteData(
                table: "StaffProfileEntity",
                keyColumn: "UserId",
                keyValue: userId);
        }

        private static void DeleteCashierRole(MigrationBuilder migrationBuilder, Guid userId)
        {
            migrationBuilder.DeleteData(
                table: "UserRoleInfoEntity",
                keyColumns: new[] { "RoleId", "UserId" },
                keyValues: new object[] { CashierRoleId, userId });
        }

        private static void DeleteUser(MigrationBuilder migrationBuilder, Guid userId)
        {
            migrationBuilder.DeleteData(
                table: "UserInfoEntity",
                keyColumn: "UserId",
                keyValue: userId);
        }
    }
}
