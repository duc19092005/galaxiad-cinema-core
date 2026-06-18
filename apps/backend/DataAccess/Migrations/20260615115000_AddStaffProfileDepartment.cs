using System;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DataAccess.Migrations
{
    [DbContext(typeof(CinemaDbContext))]
    [Migration("20260615115000_AddStaffProfileDepartment")]
    public partial class AddStaffProfileDepartment : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "DepartmentId",
                table: "StaffProfileEntity",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_StaffProfileEntity_DepartmentId",
                table: "StaffProfileEntity",
                column: "DepartmentId");

            migrationBuilder.AddForeignKey(
                name: "FK_StaffProfileEntity_CashierDepartmentEntity_DepartmentId",
                table: "StaffProfileEntity",
                column: "DepartmentId",
                principalTable: "CashierDepartmentEntity",
                principalColumn: "DepartmentId",
                onDelete: ReferentialAction.SetNull);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_StaffProfileEntity_CashierDepartmentEntity_DepartmentId",
                table: "StaffProfileEntity");

            migrationBuilder.DropIndex(
                name: "IX_StaffProfileEntity_DepartmentId",
                table: "StaffProfileEntity");

            migrationBuilder.DropColumn(
                name: "DepartmentId",
                table: "StaffProfileEntity");
        }
    }
}
