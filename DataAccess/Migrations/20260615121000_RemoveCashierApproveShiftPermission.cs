using System;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DataAccess.Migrations
{
    [DbContext(typeof(CinemaDbContext))]
    [Migration("20260615121000_RemoveCashierApproveShiftPermission")]
    public partial class RemoveCashierApproveShiftPermission : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "PermissionForRoleEntity",
                keyColumns: new[] { "PermissionId", "RoleId" },
                keyValues: new object[]
                {
                    new Guid("a1b2c3d4-1111-1111-1111-111111111015"),
                    new Guid("1a8f7b9c-d4e5-4f6a-b7c8-9d0e1f2a3b4c")
                });
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.InsertData(
                table: "PermissionForRoleEntity",
                columns: new[] { "PermissionId", "RoleId" },
                values: new object[]
                {
                    new Guid("a1b2c3d4-1111-1111-1111-111111111015"),
                    new Guid("1a8f7b9c-d4e5-4f6a-b7c8-9d0e1f2a3b4c")
                });
        }
    }
}
