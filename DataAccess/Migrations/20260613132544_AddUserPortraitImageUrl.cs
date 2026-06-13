using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DataAccess.Migrations
{
    /// <inheritdoc />
    public partial class AddUserPortraitImageUrl : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "PortraitImageUrl",
                table: "UserInfoEntity",
                type: "varchar(2048)",
                nullable: true);

            migrationBuilder.UpdateData(
                table: "UserInfoEntity",
                keyColumn: "UserId",
                keyValue: new Guid("7b5d2c1e-9f8a-3e7b-c1d2-a0e9f8c7b6a5"),
                column: "PortraitImageUrl",
                value: null);

            migrationBuilder.UpdateData(
                table: "UserInfoEntity",
                keyColumn: "UserId",
                keyValue: new Guid("b2c3d4e5-f6a7-8b9c-d0e1-f2a3b4c5d6e7"),
                column: "PortraitImageUrl",
                value: null);

            migrationBuilder.UpdateData(
                table: "UserInfoEntity",
                keyColumn: "UserId",
                keyValue: new Guid("e4e1f7d8-c3b2-4a90-8c67-2f5a1b3d9e0c"),
                column: "PortraitImageUrl",
                value: null);

            migrationBuilder.UpdateData(
                table: "UserInfoEntity",
                keyColumn: "UserId",
                keyValue: new Guid("f1a0e9b8-d7c6-5e4f-a3b2-1d0c9b8a7f6e"),
                column: "PortraitImageUrl",
                value: null);

            migrationBuilder.UpdateData(
                table: "UserInfoEntity",
                keyColumn: "UserId",
                keyValue: new Guid("f9c3b8a1-8d24-42f5-b28f-e9c8f6153a01"),
                column: "PortraitImageUrl",
                value: null);

            migrationBuilder.UpdateData(
                table: "UserInfoEntity",
                keyColumn: "UserId",
                keyValue: new Guid("f9c3b8a1-8d24-42f5-b28f-e9c8f6153a02"),
                column: "PortraitImageUrl",
                value: null);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "PortraitImageUrl",
                table: "UserInfoEntity");
        }
    }
}
