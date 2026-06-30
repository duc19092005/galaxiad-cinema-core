using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace Cinema.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddUserTypeToUserInfo : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "UserRoleInfoEntity",
                keyColumns: new[] { "RoleId", "UserId" },
                keyValues: new object[] { new Guid("1a8f7b9c-d4e5-4f6a-b7c8-9d0e1f2a3b4c"), new Guid("f9c3b8a1-8d24-42f5-b28f-e9c8f6153a01") });

            migrationBuilder.DeleteData(
                table: "UserRoleInfoEntity",
                keyColumns: new[] { "RoleId", "UserId" },
                keyValues: new object[] { new Guid("1a8f7b9c-d4e5-4f6a-b7c8-9d0e1f2a3b4c"), new Guid("f9c3b8a1-8d24-42f5-b28f-e9c8f6153a02") });

            migrationBuilder.DeleteData(
                table: "UserInfoEntity",
                keyColumn: "UserId",
                keyValue: new Guid("f9c3b8a1-8d24-42f5-b28f-e9c8f6153a01"));

            migrationBuilder.DeleteData(
                table: "UserInfoEntity",
                keyColumn: "UserId",
                keyValue: new Guid("f9c3b8a1-8d24-42f5-b28f-e9c8f6153a02"));

            migrationBuilder.AddColumn<int>(
                name: "UserType",
                table: "UserInfoEntity",
                type: "int",
                nullable: false,
                defaultValue: 0);


            migrationBuilder.UpdateData(
                table: "UserInfoEntity",
                keyColumn: "UserId",
                keyValue: new Guid("7b5d2c1e-9f8a-3e7b-c1d2-a0e9f8c7b6a5"),
                column: "UserType",
                value: 0);

            migrationBuilder.UpdateData(
                table: "UserInfoEntity",
                keyColumn: "UserId",
                keyValue: new Guid("b2c3d4e5-f6a7-8b9c-d0e1-f2a3b4c5d6e7"),
                column: "UserType",
                value: 0);

            migrationBuilder.UpdateData(
                table: "UserInfoEntity",
                keyColumn: "UserId",
                keyValue: new Guid("e4e1f7d8-c3b2-4a90-8c67-2f5a1b3d9e0c"),
                column: "UserType",
                value: 0);

            migrationBuilder.UpdateData(
                table: "UserInfoEntity",
                keyColumn: "UserId",
                keyValue: new Guid("f1a0e9b8-d7c6-5e4f-a3b2-1d0c9b8a7f6e"),
                column: "UserType",
                value: 0);

            migrationBuilder.InsertData(
                table: "UserInfoEntity",
                columns: new[] { "UserId", "AccountStatus", "DateOfBirth", "IdentityCode", "LockoutReason", "Password", "PhoneNumber", "PortraitImageUrl", "RefreshToken", "RegisterMethod", "RewardPoints", "SubId", "UserEmail", "UserName", "UserType" },
                values: new object[,]
                {
                    { new Guid("f9c3b8a1-8d24-42f5-b28f-e9c8f6153a11"), 1, new DateTime(1990, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "POS_GALAXY_TICKET", null, "$2a$12$yDhsoUoUEcJKNcTFGo3gwugzOT7glSqRHVP2pk7yV6xeWQMUrAWuu", "0999000011", null, null, 0, 0L, null, "quay.ve.galaxy.cinema.nguyen.du@cinema.com", "Quay ve - Galaxy Cinema Nguyen Du", 0 },
                    { new Guid("f9c3b8a1-8d24-42f5-b28f-e9c8f6153a12"), 1, new DateTime(1990, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "POS_GALAXY_FOOD", null, "$2a$12$yDhsoUoUEcJKNcTFGo3gwugzOT7glSqRHVP2pk7yV6xeWQMUrAWuu", "0999000012", null, null, 0, 0L, null, "quay.bap.nuoc.galaxy.cinema.nguyen.du@cinema.com", "Quay bap nuoc - Galaxy Cinema Nguyen Du", 0 },
                    { new Guid("f9c3b8a1-8d24-42f5-b28f-e9c8f6153a21"), 1, new DateTime(1990, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "POS_LOTTE_TICKET", null, "$2a$12$yDhsoUoUEcJKNcTFGo3gwugzOT7glSqRHVP2pk7yV6xeWQMUrAWuu", "0999000021", null, null, 0, 0L, null, "quay.ve.lotte.cinema.west.lake@cinema.com", "Quay ve - Lotte Cinema West Lake", 0 },
                    { new Guid("f9c3b8a1-8d24-42f5-b28f-e9c8f6153a22"), 1, new DateTime(1990, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "POS_LOTTE_FOOD", null, "$2a$12$yDhsoUoUEcJKNcTFGo3gwugzOT7glSqRHVP2pk7yV6xeWQMUrAWuu", "0999000022", null, null, 0, 0L, null, "quay.bap.nuoc.lotte.cinema.west.lake@cinema.com", "Quay bap nuoc - Lotte Cinema West Lake", 0 },
                    { new Guid("f9c3b8a1-8d24-42f5-b28f-e9c8f6153a31"), 1, new DateTime(1990, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "POS_BHD_TICKET", null, "$2a$12$yDhsoUoUEcJKNcTFGo3gwugzOT7glSqRHVP2pk7yV6xeWQMUrAWuu", "0999000031", null, null, 0, 0L, null, "quay.ve.bhd.star.bitexco@cinema.com", "Quay ve - BHD Star Bitexco", 0 },
                    { new Guid("f9c3b8a1-8d24-42f5-b28f-e9c8f6153a32"), 1, new DateTime(1990, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "POS_BHD_FOOD", null, "$2a$12$yDhsoUoUEcJKNcTFGo3gwugzOT7glSqRHVP2pk7yV6xeWQMUrAWuu", "0999000032", null, null, 0, 0L, null, "quay.bap.nuoc.bhd.star.bitexco@cinema.com", "Quay bap nuoc - BHD Star Bitexco", 0 }
                });

            migrationBuilder.UpdateData(
                table: "DepartmentEntity",
                keyColumn: "DepartmentId",
                keyValue: new Guid("d1111111-1111-1111-1111-111111111111"),
                column: "SharedUserId",
                value: new Guid("f9c3b8a1-8d24-42f5-b28f-e9c8f6153a11"));

            migrationBuilder.UpdateData(
                table: "DepartmentEntity",
                keyColumn: "DepartmentId",
                keyValue: new Guid("d1111111-1111-1111-1111-222222222222"),
                column: "SharedUserId",
                value: new Guid("f9c3b8a1-8d24-42f5-b28f-e9c8f6153a12"));

            migrationBuilder.UpdateData(
                table: "DepartmentEntity",
                keyColumn: "DepartmentId",
                keyValue: new Guid("d2222222-2222-2222-2222-111111111111"),
                column: "SharedUserId",
                value: new Guid("f9c3b8a1-8d24-42f5-b28f-e9c8f6153a21"));

            migrationBuilder.UpdateData(
                table: "DepartmentEntity",
                keyColumn: "DepartmentId",
                keyValue: new Guid("d2222222-2222-2222-2222-222222222222"),
                column: "SharedUserId",
                value: new Guid("f9c3b8a1-8d24-42f5-b28f-e9c8f6153a22"));

            migrationBuilder.UpdateData(
                table: "DepartmentEntity",
                keyColumn: "DepartmentId",
                keyValue: new Guid("dbbbbbbb-bbbb-bbbb-bbbb-111111111111"),
                column: "SharedUserId",
                value: new Guid("f9c3b8a1-8d24-42f5-b28f-e9c8f6153a31"));

            migrationBuilder.UpdateData(
                table: "DepartmentEntity",
                keyColumn: "DepartmentId",
                keyValue: new Guid("dbbbbbbb-bbbb-bbbb-bbbb-222222222222"),
                column: "SharedUserId",
                value: new Guid("f9c3b8a1-8d24-42f5-b28f-e9c8f6153a32"));

            migrationBuilder.InsertData(
                table: "StaffProfileEntity",
                columns: new[] { "UserId", "CinemaId", "DepartmentId", "EmployeeType", "FaceVector", "IsCinemaManager", "WorkingStatus" },
                values: new object[,]
                {
                    { new Guid("f9c3b8a1-8d24-42f5-b28f-e9c8f6153a11"), new Guid("11111111-1111-1111-1111-111111111111"), new Guid("d1111111-1111-1111-1111-111111111111"), 1, null, false, true },
                    { new Guid("f9c3b8a1-8d24-42f5-b28f-e9c8f6153a12"), new Guid("11111111-1111-1111-1111-111111111111"), new Guid("d1111111-1111-1111-1111-222222222222"), 1, null, false, true },
                    { new Guid("f9c3b8a1-8d24-42f5-b28f-e9c8f6153a21"), new Guid("22222222-2222-2222-2222-222222222222"), new Guid("d2222222-2222-2222-2222-111111111111"), 1, null, false, true },
                    { new Guid("f9c3b8a1-8d24-42f5-b28f-e9c8f6153a22"), new Guid("22222222-2222-2222-2222-222222222222"), new Guid("d2222222-2222-2222-2222-222222222222"), 1, null, false, true },
                    { new Guid("f9c3b8a1-8d24-42f5-b28f-e9c8f6153a31"), new Guid("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"), new Guid("dbbbbbbb-bbbb-bbbb-bbbb-111111111111"), 1, null, false, true },
                    { new Guid("f9c3b8a1-8d24-42f5-b28f-e9c8f6153a32"), new Guid("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"), new Guid("dbbbbbbb-bbbb-bbbb-bbbb-222222222222"), 1, null, false, true }
                });

            migrationBuilder.InsertData(
                table: "UserRoleInfoEntity",
                columns: new[] { "RoleId", "UserId" },
                values: new object[,]
                {
                    { new Guid("1a8f7b9c-d4e5-4f6a-b7c8-9d0e1f2a3b4c"), new Guid("f9c3b8a1-8d24-42f5-b28f-e9c8f6153a11") },
                    { new Guid("1a8f7b9c-d4e5-4f6a-b7c8-9d0e1f2a3b4c"), new Guid("f9c3b8a1-8d24-42f5-b28f-e9c8f6153a12") },
                    { new Guid("1a8f7b9c-d4e5-4f6a-b7c8-9d0e1f2a3b4c"), new Guid("f9c3b8a1-8d24-42f5-b28f-e9c8f6153a21") },
                    { new Guid("1a8f7b9c-d4e5-4f6a-b7c8-9d0e1f2a3b4c"), new Guid("f9c3b8a1-8d24-42f5-b28f-e9c8f6153a22") },
                    { new Guid("1a8f7b9c-d4e5-4f6a-b7c8-9d0e1f2a3b4c"), new Guid("f9c3b8a1-8d24-42f5-b28f-e9c8f6153a31") },
                    { new Guid("1a8f7b9c-d4e5-4f6a-b7c8-9d0e1f2a3b4c"), new Guid("f9c3b8a1-8d24-42f5-b28f-e9c8f6153a32") }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "StaffProfileEntity",
                keyColumn: "UserId",
                keyValue: new Guid("f9c3b8a1-8d24-42f5-b28f-e9c8f6153a11"));

            migrationBuilder.DeleteData(
                table: "StaffProfileEntity",
                keyColumn: "UserId",
                keyValue: new Guid("f9c3b8a1-8d24-42f5-b28f-e9c8f6153a12"));

            migrationBuilder.DeleteData(
                table: "StaffProfileEntity",
                keyColumn: "UserId",
                keyValue: new Guid("f9c3b8a1-8d24-42f5-b28f-e9c8f6153a21"));

            migrationBuilder.DeleteData(
                table: "StaffProfileEntity",
                keyColumn: "UserId",
                keyValue: new Guid("f9c3b8a1-8d24-42f5-b28f-e9c8f6153a22"));

            migrationBuilder.DeleteData(
                table: "StaffProfileEntity",
                keyColumn: "UserId",
                keyValue: new Guid("f9c3b8a1-8d24-42f5-b28f-e9c8f6153a31"));

            migrationBuilder.DeleteData(
                table: "StaffProfileEntity",
                keyColumn: "UserId",
                keyValue: new Guid("f9c3b8a1-8d24-42f5-b28f-e9c8f6153a32"));

            migrationBuilder.DeleteData(
                table: "UserRoleInfoEntity",
                keyColumns: new[] { "RoleId", "UserId" },
                keyValues: new object[] { new Guid("1a8f7b9c-d4e5-4f6a-b7c8-9d0e1f2a3b4c"), new Guid("f9c3b8a1-8d24-42f5-b28f-e9c8f6153a11") });

            migrationBuilder.DeleteData(
                table: "UserRoleInfoEntity",
                keyColumns: new[] { "RoleId", "UserId" },
                keyValues: new object[] { new Guid("1a8f7b9c-d4e5-4f6a-b7c8-9d0e1f2a3b4c"), new Guid("f9c3b8a1-8d24-42f5-b28f-e9c8f6153a12") });

            migrationBuilder.DeleteData(
                table: "UserRoleInfoEntity",
                keyColumns: new[] { "RoleId", "UserId" },
                keyValues: new object[] { new Guid("1a8f7b9c-d4e5-4f6a-b7c8-9d0e1f2a3b4c"), new Guid("f9c3b8a1-8d24-42f5-b28f-e9c8f6153a21") });

            migrationBuilder.DeleteData(
                table: "UserRoleInfoEntity",
                keyColumns: new[] { "RoleId", "UserId" },
                keyValues: new object[] { new Guid("1a8f7b9c-d4e5-4f6a-b7c8-9d0e1f2a3b4c"), new Guid("f9c3b8a1-8d24-42f5-b28f-e9c8f6153a22") });

            migrationBuilder.DeleteData(
                table: "UserRoleInfoEntity",
                keyColumns: new[] { "RoleId", "UserId" },
                keyValues: new object[] { new Guid("1a8f7b9c-d4e5-4f6a-b7c8-9d0e1f2a3b4c"), new Guid("f9c3b8a1-8d24-42f5-b28f-e9c8f6153a31") });

            migrationBuilder.DeleteData(
                table: "UserRoleInfoEntity",
                keyColumns: new[] { "RoleId", "UserId" },
                keyValues: new object[] { new Guid("1a8f7b9c-d4e5-4f6a-b7c8-9d0e1f2a3b4c"), new Guid("f9c3b8a1-8d24-42f5-b28f-e9c8f6153a32") });

            migrationBuilder.DeleteData(
                table: "UserInfoEntity",
                keyColumn: "UserId",
                keyValue: new Guid("f9c3b8a1-8d24-42f5-b28f-e9c8f6153a11"));

            migrationBuilder.DeleteData(
                table: "UserInfoEntity",
                keyColumn: "UserId",
                keyValue: new Guid("f9c3b8a1-8d24-42f5-b28f-e9c8f6153a12"));

            migrationBuilder.DeleteData(
                table: "UserInfoEntity",
                keyColumn: "UserId",
                keyValue: new Guid("f9c3b8a1-8d24-42f5-b28f-e9c8f6153a21"));

            migrationBuilder.DeleteData(
                table: "UserInfoEntity",
                keyColumn: "UserId",
                keyValue: new Guid("f9c3b8a1-8d24-42f5-b28f-e9c8f6153a22"));

            migrationBuilder.DeleteData(
                table: "UserInfoEntity",
                keyColumn: "UserId",
                keyValue: new Guid("f9c3b8a1-8d24-42f5-b28f-e9c8f6153a31"));

            migrationBuilder.DeleteData(
                table: "UserInfoEntity",
                keyColumn: "UserId",
                keyValue: new Guid("f9c3b8a1-8d24-42f5-b28f-e9c8f6153a32"));

            migrationBuilder.DropColumn(
                name: "UserType",
                table: "UserInfoEntity");


            migrationBuilder.UpdateData(
                table: "DepartmentEntity",
                keyColumn: "DepartmentId",
                keyValue: new Guid("d1111111-1111-1111-1111-111111111111"),
                column: "SharedUserId",
                value: null);

            migrationBuilder.UpdateData(
                table: "DepartmentEntity",
                keyColumn: "DepartmentId",
                keyValue: new Guid("d1111111-1111-1111-1111-222222222222"),
                column: "SharedUserId",
                value: null);

            migrationBuilder.UpdateData(
                table: "DepartmentEntity",
                keyColumn: "DepartmentId",
                keyValue: new Guid("d2222222-2222-2222-2222-111111111111"),
                column: "SharedUserId",
                value: null);

            migrationBuilder.UpdateData(
                table: "DepartmentEntity",
                keyColumn: "DepartmentId",
                keyValue: new Guid("d2222222-2222-2222-2222-222222222222"),
                column: "SharedUserId",
                value: null);

            migrationBuilder.UpdateData(
                table: "DepartmentEntity",
                keyColumn: "DepartmentId",
                keyValue: new Guid("dbbbbbbb-bbbb-bbbb-bbbb-111111111111"),
                column: "SharedUserId",
                value: null);

            migrationBuilder.UpdateData(
                table: "DepartmentEntity",
                keyColumn: "DepartmentId",
                keyValue: new Guid("dbbbbbbb-bbbb-bbbb-bbbb-222222222222"),
                column: "SharedUserId",
                value: null);

            migrationBuilder.InsertData(
                table: "UserInfoEntity",
                columns: new[] { "UserId", "AccountStatus", "DateOfBirth", "IdentityCode", "LockoutReason", "Password", "PhoneNumber", "PortraitImageUrl", "RefreshToken", "RegisterMethod", "RewardPoints", "SubId", "UserEmail", "UserName" },
                values: new object[,]
                {
                    { new Guid("f9c3b8a1-8d24-42f5-b28f-e9c8f6153a01"), 1, new DateTime(1990, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "pFoBRlv4RT1kyqKE1Ch3Hw==", null, "$2a$12$ufIKVZZwGlxHfQ0WSZQRmeDDeCuneaflIghQhHC6RupR0LVYLU5bi", "0999000001", null, null, 0, 0L, null, "quay_ve_01@cinema.com", "Quầy Vé 01" },
                    { new Guid("f9c3b8a1-8d24-42f5-b28f-e9c8f6153a02"), 1, new DateTime(1990, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "fByrPlhQbK2U5YNuCLR5rA==", null, "$2a$12$ufIKVZZwGlxHfQ0WSZQRmeDDeCuneaflIghQhHC6RupR0LVYLU5bi", "0999000002", null, null, 0, 0L, null, "quay_bapnuoc_01@cinema.com", "Quầy Bắp Nước 01" }
                });

            migrationBuilder.InsertData(
                table: "UserRoleInfoEntity",
                columns: new[] { "RoleId", "UserId" },
                values: new object[,]
                {
                    { new Guid("1a8f7b9c-d4e5-4f6a-b7c8-9d0e1f2a3b4c"), new Guid("f9c3b8a1-8d24-42f5-b28f-e9c8f6153a01") },
                    { new Guid("1a8f7b9c-d4e5-4f6a-b7c8-9d0e1f2a3b4c"), new Guid("f9c3b8a1-8d24-42f5-b28f-e9c8f6153a02") }
                });
        }
    }
}
