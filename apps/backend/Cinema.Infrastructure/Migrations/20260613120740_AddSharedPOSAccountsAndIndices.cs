using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace Cinema.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddSharedPOSAccountsAndIndices : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.InsertData(
                table: "UserInfoEntity",
                columns: new[] { "UserId", "AccountStatus", "DateOfBirth", "IdentityCode", "LockoutReason", "Password", "PhoneNumber", "RefreshToken", "RegisterMethod", "RewardPoints", "SubId", "UserEmail", "UserName" },
                values: new object[,]
                {
                    { new Guid("f9c3b8a1-8d24-42f5-b28f-e9c8f6153a01"), 1, new DateTime(1990, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), "pFoBRlv4RT1kyqKE1Ch3Hw==", null, "$2a$12$ufIKVZZwGlxHfQ0WSZQRmeDDeCuneaflIghQhHC6RupR0LVYLU5bi", "0999000001", null, 0, 0L, null, "quay_ve_01@cinema.com", "Quầy Vé 01" },
                    { new Guid("f9c3b8a1-8d24-42f5-b28f-e9c8f6153a02"), 1, new DateTime(1990, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), "fByrPlhQbK2U5YNuCLR5rA==", null, "$2a$12$ufIKVZZwGlxHfQ0WSZQRmeDDeCuneaflIghQhHC6RupR0LVYLU5bi", "0999000002", null, 0, 0L, null, "quay_bapnuoc_01@cinema.com", "Quầy Bắp Nước 01" }
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

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
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
        }
    }
}
