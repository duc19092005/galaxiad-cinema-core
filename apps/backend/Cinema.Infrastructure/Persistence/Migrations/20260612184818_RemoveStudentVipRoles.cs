using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace Cinema.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class RemoveStudentVipRoles : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "PermissionForRoleEntity",
                keyColumns: new[] { "PermissionId", "RoleId" },
                keyValues: new object[] { new Guid("a1b2c3d4-1111-1111-1111-111111111001"), new Guid("8b3d6f7e-9c0a-4b1d-2e3f-4a5b6c7d8e9f") });

            migrationBuilder.DeleteData(
                table: "PermissionForRoleEntity",
                keyColumns: new[] { "PermissionId", "RoleId" },
                keyValues: new object[] { new Guid("a1b2c3d4-1111-1111-1111-111111111001"), new Guid("9c4e7f8a-0d1b-4c2d-3e4f-5a6b7c8d9e0f") });

            migrationBuilder.DeleteData(
                table: "PermissionForRoleEntity",
                keyColumns: new[] { "PermissionId", "RoleId" },
                keyValues: new object[] { new Guid("a1b2c3d4-1111-1111-1111-111111111005"), new Guid("8b3d6f7e-9c0a-4b1d-2e3f-4a5b6c7d8e9f") });

            migrationBuilder.DeleteData(
                table: "PermissionForRoleEntity",
                keyColumns: new[] { "PermissionId", "RoleId" },
                keyValues: new object[] { new Guid("a1b2c3d4-1111-1111-1111-111111111005"), new Guid("9c4e7f8a-0d1b-4c2d-3e4f-5a6b7c8d9e0f") });

            migrationBuilder.DeleteData(
                table: "PermissionForRoleEntity",
                keyColumns: new[] { "PermissionId", "RoleId" },
                keyValues: new object[] { new Guid("a1b2c3d4-1111-1111-1111-111111111007"), new Guid("8b3d6f7e-9c0a-4b1d-2e3f-4a5b6c7d8e9f") });

            migrationBuilder.DeleteData(
                table: "PermissionForRoleEntity",
                keyColumns: new[] { "PermissionId", "RoleId" },
                keyValues: new object[] { new Guid("a1b2c3d4-1111-1111-1111-111111111007"), new Guid("9c4e7f8a-0d1b-4c2d-3e4f-5a6b7c8d9e0f") });

            migrationBuilder.DeleteData(
                table: "PermissionForRoleEntity",
                keyColumns: new[] { "PermissionId", "RoleId" },
                keyValues: new object[] { new Guid("a1b2c3d4-1111-1111-1111-111111111009"), new Guid("8b3d6f7e-9c0a-4b1d-2e3f-4a5b6c7d8e9f") });

            migrationBuilder.DeleteData(
                table: "PermissionForRoleEntity",
                keyColumns: new[] { "PermissionId", "RoleId" },
                keyValues: new object[] { new Guid("a1b2c3d4-1111-1111-1111-111111111009"), new Guid("9c4e7f8a-0d1b-4c2d-3e4f-5a6b7c8d9e0f") });

            migrationBuilder.DeleteData(
                table: "PermissionForRoleEntity",
                keyColumns: new[] { "PermissionId", "RoleId" },
                keyValues: new object[] { new Guid("a1b2c3d4-1111-1111-1111-111111111011"), new Guid("8b3d6f7e-9c0a-4b1d-2e3f-4a5b6c7d8e9f") });

            migrationBuilder.DeleteData(
                table: "PermissionForRoleEntity",
                keyColumns: new[] { "PermissionId", "RoleId" },
                keyValues: new object[] { new Guid("a1b2c3d4-1111-1111-1111-111111111011"), new Guid("9c4e7f8a-0d1b-4c2d-3e4f-5a6b7c8d9e0f") });

            migrationBuilder.DeleteData(
                table: "RoleListInfoEntity",
                keyColumn: "RoleId",
                keyValue: new Guid("8b3d6f7e-9c0a-4b1d-2e3f-4a5b6c7d8e9f"));

            migrationBuilder.DeleteData(
                table: "RoleListInfoEntity",
                keyColumn: "RoleId",
                keyValue: new Guid("9c4e7f8a-0d1b-4c2d-3e4f-5a6b7c8d9e0f"));
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.InsertData(
                table: "RoleListInfoEntity",
                columns: new[] { "RoleId", "DiscountPercent", "RoleName", "SalaryPerHour" },
                values: new object[,]
                {
                    { new Guid("8b3d6f7e-9c0a-4b1d-2e3f-4a5b6c7d8e9f"), 0m, "Student", 0m },
                    { new Guid("9c4e7f8a-0d1b-4c2d-3e4f-5a6b7c8d9e0f"), 0m, "VIP", 0m }
                });

            migrationBuilder.InsertData(
                table: "PermissionForRoleEntity",
                columns: new[] { "PermissionId", "RoleId" },
                values: new object[,]
                {
                    { new Guid("a1b2c3d4-1111-1111-1111-111111111001"), new Guid("8b3d6f7e-9c0a-4b1d-2e3f-4a5b6c7d8e9f") },
                    { new Guid("a1b2c3d4-1111-1111-1111-111111111001"), new Guid("9c4e7f8a-0d1b-4c2d-3e4f-5a6b7c8d9e0f") },
                    { new Guid("a1b2c3d4-1111-1111-1111-111111111005"), new Guid("8b3d6f7e-9c0a-4b1d-2e3f-4a5b6c7d8e9f") },
                    { new Guid("a1b2c3d4-1111-1111-1111-111111111005"), new Guid("9c4e7f8a-0d1b-4c2d-3e4f-5a6b7c8d9e0f") },
                    { new Guid("a1b2c3d4-1111-1111-1111-111111111007"), new Guid("8b3d6f7e-9c0a-4b1d-2e3f-4a5b6c7d8e9f") },
                    { new Guid("a1b2c3d4-1111-1111-1111-111111111007"), new Guid("9c4e7f8a-0d1b-4c2d-3e4f-5a6b7c8d9e0f") },
                    { new Guid("a1b2c3d4-1111-1111-1111-111111111009"), new Guid("8b3d6f7e-9c0a-4b1d-2e3f-4a5b6c7d8e9f") },
                    { new Guid("a1b2c3d4-1111-1111-1111-111111111009"), new Guid("9c4e7f8a-0d1b-4c2d-3e4f-5a6b7c8d9e0f") },
                    { new Guid("a1b2c3d4-1111-1111-1111-111111111011"), new Guid("8b3d6f7e-9c0a-4b1d-2e3f-4a5b6c7d8e9f") },
                    { new Guid("a1b2c3d4-1111-1111-1111-111111111011"), new Guid("9c4e7f8a-0d1b-4c2d-3e4f-5a6b7c8d9e0f") }
                });
        }
    }
}
