using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace DataAccess.Migrations
{
    /// <inheritdoc />
    public partial class FixOrphanedCustomersRoles : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
                INSERT INTO [UserRoleInfoEntity] (UserId, RoleId)
                SELECT UserId, '2b9c8d0e-f5a6-7b8c-d9e0-1f2a3b4c5d6e'
                FROM [UserInfoEntity]
                WHERE UserId NOT IN (SELECT UserId FROM [UserRoleInfoEntity]);
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
        }
    }
}
