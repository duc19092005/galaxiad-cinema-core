using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Cinema.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class RenameCashierDepartmentToDepartment : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_StaffProfileEntity_CashierDepartmentEntity_DepartmentId",
                table: "StaffProfileEntity");

            migrationBuilder.DropForeignKey(
                name: "FK_CashierDepartmentEntity_CinemaInfoEntity_CinemaId",
                table: "CashierDepartmentEntity");

            migrationBuilder.DropForeignKey(
                name: "FK_CashierDepartmentEntity_UserInfoEntity_SharedUserId",
                table: "CashierDepartmentEntity");

            migrationBuilder.DropPrimaryKey(
                name: "PK_CashierDepartmentEntity",
                table: "CashierDepartmentEntity");

            migrationBuilder.RenameTable(
                name: "CashierDepartmentEntity",
                newName: "DepartmentEntity");

            migrationBuilder.RenameColumn(
                name: "DepartmentType",
                table: "DepartmentEntity",
                newName: "CashierType");

            migrationBuilder.RenameIndex(
                name: "IX_CashierDepartmentEntity_SharedUserId",
                table: "DepartmentEntity",
                newName: "IX_DepartmentEntity_SharedUserId");

            migrationBuilder.RenameIndex(
                name: "IX_CashierDepartmentEntity_CinemaId",
                table: "DepartmentEntity",
                newName: "IX_DepartmentEntity_CinemaId");

            migrationBuilder.AddColumn<int>(
                name: "DepartmentType",
                table: "DepartmentEntity",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddPrimaryKey(
                name: "PK_DepartmentEntity",
                table: "DepartmentEntity",
                column: "DepartmentId");

            migrationBuilder.AddForeignKey(
                name: "FK_DepartmentEntity_CinemaInfoEntity_CinemaId",
                table: "DepartmentEntity",
                column: "CinemaId",
                principalTable: "CinemaInfoEntity",
                principalColumn: "CinemaId",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_DepartmentEntity_UserInfoEntity_SharedUserId",
                table: "DepartmentEntity",
                column: "SharedUserId",
                principalTable: "UserInfoEntity",
                principalColumn: "UserId",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_StaffProfileEntity_DepartmentEntity_DepartmentId",
                table: "StaffProfileEntity",
                column: "DepartmentId",
                principalTable: "DepartmentEntity",
                principalColumn: "DepartmentId",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_StaffProfileEntity_DepartmentEntity_DepartmentId",
                table: "StaffProfileEntity");

            migrationBuilder.DropForeignKey(
                name: "FK_DepartmentEntity_CinemaInfoEntity_CinemaId",
                table: "DepartmentEntity");

            migrationBuilder.DropForeignKey(
                name: "FK_DepartmentEntity_UserInfoEntity_SharedUserId",
                table: "DepartmentEntity");

            migrationBuilder.DropPrimaryKey(
                name: "PK_DepartmentEntity",
                table: "DepartmentEntity");

            migrationBuilder.DropColumn(
                name: "DepartmentType",
                table: "DepartmentEntity");

            migrationBuilder.RenameColumn(
                name: "CashierType",
                table: "DepartmentEntity",
                newName: "DepartmentType");

            migrationBuilder.RenameIndex(
                name: "IX_DepartmentEntity_SharedUserId",
                table: "DepartmentEntity",
                newName: "IX_CashierDepartmentEntity_SharedUserId");

            migrationBuilder.RenameIndex(
                name: "IX_DepartmentEntity_CinemaId",
                table: "DepartmentEntity",
                newName: "IX_CashierDepartmentEntity_CinemaId");

            migrationBuilder.RenameTable(
                name: "DepartmentEntity",
                newName: "CashierDepartmentEntity");

            migrationBuilder.AddPrimaryKey(
                name: "PK_CashierDepartmentEntity",
                table: "CashierDepartmentEntity",
                column: "DepartmentId");

            migrationBuilder.AddForeignKey(
                name: "FK_CashierDepartmentEntity_CinemaInfoEntity_CinemaId",
                table: "CashierDepartmentEntity",
                column: "CinemaId",
                principalTable: "CinemaInfoEntity",
                principalColumn: "CinemaId",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_CashierDepartmentEntity_UserInfoEntity_SharedUserId",
                table: "CashierDepartmentEntity",
                column: "SharedUserId",
                principalTable: "UserInfoEntity",
                principalColumn: "UserId",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_StaffProfileEntity_CashierDepartmentEntity_DepartmentId",
                table: "StaffProfileEntity",
                column: "DepartmentId",
                principalTable: "CashierDepartmentEntity",
                principalColumn: "DepartmentId",
                onDelete: ReferentialAction.SetNull);
        }
    }
}
