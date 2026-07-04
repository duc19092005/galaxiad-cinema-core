using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace Cinema.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddVoucherMembershipRanks : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "VoucherMembershipRankEntity",
                columns: table => new
                {
                    VoucherId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    MembershipRank = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_VoucherMembershipRankEntity", x => new { x.VoucherId, x.MembershipRank });
                    table.ForeignKey(
                        name: "FK_VoucherMembershipRankEntity_VoucherInfoEntity_VoucherId",
                        column: x => x.VoucherId,
                        principalTable: "VoucherInfoEntity",
                        principalColumn: "voucherId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.InsertData(
                table: "UserInfoEntity",
                columns: new[] { "UserId", "AccountStatus", "DateOfBirth", "IdentityCode", "LockoutReason", "Password", "PhoneNumber", "PortraitImageUrl", "RefreshToken", "RegisterMethod", "RewardPoints", "SubId", "UserEmail", "UserName", "UserType" },
                values: new object[,]
                {
                    { new Guid("c0000000-0000-0000-0000-000000000001"), 1, new DateTime(1995, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "111111111111", null, "$2a$12$ufIKVZZwGlxHfQ0WSZQRmeDDeCuneaflIghQhHC6RupR0LVYLU5bi", "0900000001", null, null, 0, 0L, null, "customer.standard@cinema.com", "Khách Hàng Standard", 0 },
                    { new Guid("c0000000-0000-0000-0000-000000000002"), 1, new DateTime(1995, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "222222222222", null, "$2a$12$ufIKVZZwGlxHfQ0WSZQRmeDDeCuneaflIghQhHC6RupR0LVYLU5bi", "0900000002", null, null, 0, 0L, null, "customer.vip@cinema.com", "Khách Hàng VIP", 0 },
                    { new Guid("c0000000-0000-0000-0000-000000000003"), 1, new DateTime(1995, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "333333333333", null, "$2a$12$ufIKVZZwGlxHfQ0WSZQRmeDDeCuneaflIghQhHC6RupR0LVYLU5bi", "0900000003", null, null, 0, 0L, null, "customer.gold@cinema.com", "Khách Hàng Gold", 0 },
                    { new Guid("c0000000-0000-0000-0000-000000000004"), 1, new DateTime(1995, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "444444444444", null, "$2a$12$ufIKVZZwGlxHfQ0WSZQRmeDDeCuneaflIghQhHC6RupR0LVYLU5bi", "0900000004", null, null, 0, 0L, null, "customer.diamond@cinema.com", "Khách Hàng Diamond", 0 }
                });

            migrationBuilder.InsertData(
                table: "CustomerProfileEntity",
                columns: new[] { "UserId", "MembershipRank", "TotalPoint" },
                values: new object[,]
                {
                    { new Guid("c0000000-0000-0000-0000-000000000001"), 0, 0m },
                    { new Guid("c0000000-0000-0000-0000-000000000002"), 1, 1200m },
                    { new Guid("c0000000-0000-0000-0000-000000000003"), 2, 2500m },
                    { new Guid("c0000000-0000-0000-0000-000000000004"), 3, 5500m }
                });

            migrationBuilder.InsertData(
                table: "UserRoleInfoEntity",
                columns: new[] { "RoleId", "UserId" },
                values: new object[,]
                {
                    { new Guid("2b9c8d0e-f5a6-7b8c-d9e0-1f2a3b4c5d6e"), new Guid("c0000000-0000-0000-0000-000000000001") },
                    { new Guid("2b9c8d0e-f5a6-7b8c-d9e0-1f2a3b4c5d6e"), new Guid("c0000000-0000-0000-0000-000000000002") },
                    { new Guid("2b9c8d0e-f5a6-7b8c-d9e0-1f2a3b4c5d6e"), new Guid("c0000000-0000-0000-0000-000000000003") },
                    { new Guid("2b9c8d0e-f5a6-7b8c-d9e0-1f2a3b4c5d6e"), new Guid("c0000000-0000-0000-0000-000000000004") }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "VoucherMembershipRankEntity");

            migrationBuilder.DeleteData(
                table: "CustomerProfileEntity",
                keyColumn: "UserId",
                keyValue: new Guid("c0000000-0000-0000-0000-000000000001"));

            migrationBuilder.DeleteData(
                table: "CustomerProfileEntity",
                keyColumn: "UserId",
                keyValue: new Guid("c0000000-0000-0000-0000-000000000002"));

            migrationBuilder.DeleteData(
                table: "CustomerProfileEntity",
                keyColumn: "UserId",
                keyValue: new Guid("c0000000-0000-0000-0000-000000000003"));

            migrationBuilder.DeleteData(
                table: "CustomerProfileEntity",
                keyColumn: "UserId",
                keyValue: new Guid("c0000000-0000-0000-0000-000000000004"));

            migrationBuilder.DeleteData(
                table: "UserRoleInfoEntity",
                keyColumns: new[] { "RoleId", "UserId" },
                keyValues: new object[] { new Guid("2b9c8d0e-f5a6-7b8c-d9e0-1f2a3b4c5d6e"), new Guid("c0000000-0000-0000-0000-000000000001") });

            migrationBuilder.DeleteData(
                table: "UserRoleInfoEntity",
                keyColumns: new[] { "RoleId", "UserId" },
                keyValues: new object[] { new Guid("2b9c8d0e-f5a6-7b8c-d9e0-1f2a3b4c5d6e"), new Guid("c0000000-0000-0000-0000-000000000002") });

            migrationBuilder.DeleteData(
                table: "UserRoleInfoEntity",
                keyColumns: new[] { "RoleId", "UserId" },
                keyValues: new object[] { new Guid("2b9c8d0e-f5a6-7b8c-d9e0-1f2a3b4c5d6e"), new Guid("c0000000-0000-0000-0000-000000000003") });

            migrationBuilder.DeleteData(
                table: "UserRoleInfoEntity",
                keyColumns: new[] { "RoleId", "UserId" },
                keyValues: new object[] { new Guid("2b9c8d0e-f5a6-7b8c-d9e0-1f2a3b4c5d6e"), new Guid("c0000000-0000-0000-0000-000000000004") });

            migrationBuilder.DeleteData(
                table: "UserInfoEntity",
                keyColumn: "UserId",
                keyValue: new Guid("c0000000-0000-0000-0000-000000000001"));

            migrationBuilder.DeleteData(
                table: "UserInfoEntity",
                keyColumn: "UserId",
                keyValue: new Guid("c0000000-0000-0000-0000-000000000002"));

            migrationBuilder.DeleteData(
                table: "UserInfoEntity",
                keyColumn: "UserId",
                keyValue: new Guid("c0000000-0000-0000-0000-000000000003"));

            migrationBuilder.DeleteData(
                table: "UserInfoEntity",
                keyColumn: "UserId",
                keyValue: new Guid("c0000000-0000-0000-0000-000000000004"));
        }
    }
}
