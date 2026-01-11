using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace DataAccess.Migrations
{
    /// <inheritdoc />
    public partial class seedroles : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.InsertData(
                table: "role_list_info_entity",
                columns: new[] { "roleId", "roleName" },
                values: new object[,]
                {
                    { new Guid("1a8f7b9c-d4e5-4f6a-b7c8-9d0e1f2a3b4c"), "Cashier" },
                    { new Guid("2b9c8d0e-f5a6-7b8c-d9e0-1f2a3b4c5d6e"), "Customer" },
                    { new Guid("3c0d9e1f-a6b7-c8d9-e0f1-2a3b4c5d6e7f"), "Admin" },
                    { new Guid("4d1e0f2a-b7c8-d9e0-f1a2-3b4c5d6e7f8a"), "MovieManager" },
                    { new Guid("5e2f1a3b-c8d9-e0f1-a2b3-4c5d6e7f8a9b"), "TheaterManager" },
                    { new Guid("6f3a2b4c-d9e0-f1a2-b3c4-d5e6f7a8b9c0"), "FacilitiesManager" }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "role_list_info_entity",
                keyColumn: "roleId",
                keyValue: new Guid("1a8f7b9c-d4e5-4f6a-b7c8-9d0e1f2a3b4c"));

            migrationBuilder.DeleteData(
                table: "role_list_info_entity",
                keyColumn: "roleId",
                keyValue: new Guid("2b9c8d0e-f5a6-7b8c-d9e0-1f2a3b4c5d6e"));

            migrationBuilder.DeleteData(
                table: "role_list_info_entity",
                keyColumn: "roleId",
                keyValue: new Guid("3c0d9e1f-a6b7-c8d9-e0f1-2a3b4c5d6e7f"));

            migrationBuilder.DeleteData(
                table: "role_list_info_entity",
                keyColumn: "roleId",
                keyValue: new Guid("4d1e0f2a-b7c8-d9e0-f1a2-3b4c5d6e7f8a"));

            migrationBuilder.DeleteData(
                table: "role_list_info_entity",
                keyColumn: "roleId",
                keyValue: new Guid("5e2f1a3b-c8d9-e0f1-a2b3-4c5d6e7f8a9b"));

            migrationBuilder.DeleteData(
                table: "role_list_info_entity",
                keyColumn: "roleId",
                keyValue: new Guid("6f3a2b4c-d9e0-f1a2-b3c4-d5e6f7a8b9c0"));
        }
    }
}
