using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Cinema.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddEmployeeAndShiftTypes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "EmployeeType",
                table: "StaffProfileEntity",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "RoleType",
                table: "RoleListInfoEntity",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "ShiftType",
                table: "CinemaShiftTemplateEntity",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "ShiftType",
                table: "CinemaShiftScheduleEntity",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.UpdateData(
                table: "CinemaShiftTemplateEntity",
                keyColumn: "ShiftTemplateId",
                keyValue: new Guid("a1111111-1111-1111-1111-111111111111"),
                column: "ShiftType",
                value: 1);

            migrationBuilder.UpdateData(
                table: "CinemaShiftTemplateEntity",
                keyColumn: "ShiftTemplateId",
                keyValue: new Guid("a1111111-1111-1111-1111-222222222222"),
                column: "ShiftType",
                value: 1);

            migrationBuilder.UpdateData(
                table: "CinemaShiftTemplateEntity",
                keyColumn: "ShiftTemplateId",
                keyValue: new Guid("a1111111-1111-1111-1111-333333333333"),
                column: "ShiftType",
                value: 1);

            migrationBuilder.UpdateData(
                table: "CinemaShiftTemplateEntity",
                keyColumn: "ShiftTemplateId",
                keyValue: new Guid("a1111111-1111-1111-1111-444444444444"),
                column: "ShiftType",
                value: 1);

            migrationBuilder.UpdateData(
                table: "CinemaShiftTemplateEntity",
                keyColumn: "ShiftTemplateId",
                keyValue: new Guid("a1111111-1111-1111-1111-555555555555"),
                column: "ShiftType",
                value: 1);

            migrationBuilder.UpdateData(
                table: "CinemaShiftTemplateEntity",
                keyColumn: "ShiftTemplateId",
                keyValue: new Guid("b2222222-2222-2222-2222-111111111111"),
                column: "ShiftType",
                value: 1);

            migrationBuilder.UpdateData(
                table: "CinemaShiftTemplateEntity",
                keyColumn: "ShiftTemplateId",
                keyValue: new Guid("b2222222-2222-2222-2222-222222222222"),
                column: "ShiftType",
                value: 1);

            migrationBuilder.UpdateData(
                table: "CinemaShiftTemplateEntity",
                keyColumn: "ShiftTemplateId",
                keyValue: new Guid("b2222222-2222-2222-2222-333333333333"),
                column: "ShiftType",
                value: 1);

            migrationBuilder.UpdateData(
                table: "CinemaShiftTemplateEntity",
                keyColumn: "ShiftTemplateId",
                keyValue: new Guid("b2222222-2222-2222-2222-444444444444"),
                column: "ShiftType",
                value: 1);

            migrationBuilder.UpdateData(
                table: "CinemaShiftTemplateEntity",
                keyColumn: "ShiftTemplateId",
                keyValue: new Guid("b2222222-2222-2222-2222-555555555555"),
                column: "ShiftType",
                value: 1);

            migrationBuilder.UpdateData(
                table: "CinemaShiftTemplateEntity",
                keyColumn: "ShiftTemplateId",
                keyValue: new Guid("c3333333-3333-3333-3333-111111111111"),
                column: "ShiftType",
                value: 1);

            migrationBuilder.UpdateData(
                table: "CinemaShiftTemplateEntity",
                keyColumn: "ShiftTemplateId",
                keyValue: new Guid("c3333333-3333-3333-3333-222222222222"),
                column: "ShiftType",
                value: 1);

            migrationBuilder.UpdateData(
                table: "CinemaShiftTemplateEntity",
                keyColumn: "ShiftTemplateId",
                keyValue: new Guid("c3333333-3333-3333-3333-333333333333"),
                column: "ShiftType",
                value: 1);

            migrationBuilder.UpdateData(
                table: "CinemaShiftTemplateEntity",
                keyColumn: "ShiftTemplateId",
                keyValue: new Guid("c3333333-3333-3333-3333-444444444444"),
                column: "ShiftType",
                value: 1);

            migrationBuilder.UpdateData(
                table: "CinemaShiftTemplateEntity",
                keyColumn: "ShiftTemplateId",
                keyValue: new Guid("c3333333-3333-3333-3333-555555555555"),
                column: "ShiftType",
                value: 1);

            migrationBuilder.UpdateData(
                table: "RoleListInfoEntity",
                keyColumn: "RoleId",
                keyValue: new Guid("1a8f7b9c-d4e5-4f6a-b7c8-9d0e1f2a3b4c"),
                column: "RoleType",
                value: 4);

            migrationBuilder.UpdateData(
                table: "RoleListInfoEntity",
                keyColumn: "RoleId",
                keyValue: new Guid("2b9c8d0e-f5a6-7b8c-d9e0-1f2a3b4c5d6e"),
                column: "RoleType",
                value: 1);

            migrationBuilder.UpdateData(
                table: "RoleListInfoEntity",
                keyColumn: "RoleId",
                keyValue: new Guid("3c0d9e1f-a6b7-c8d9-e0f1-2a3b4c5d6e7f"),
                column: "RoleType",
                value: 2);

            migrationBuilder.UpdateData(
                table: "RoleListInfoEntity",
                keyColumn: "RoleId",
                keyValue: new Guid("4d1e0f2a-b7c8-d9e0-f1a2-3b4c5d6e7f8a"),
                column: "RoleType",
                value: 3);

            migrationBuilder.UpdateData(
                table: "RoleListInfoEntity",
                keyColumn: "RoleId",
                keyValue: new Guid("5e2f1a3b-c8d9-e0f1-a2b3-4c5d6e7f8a9b"),
                column: "RoleType",
                value: 3);

            migrationBuilder.UpdateData(
                table: "RoleListInfoEntity",
                keyColumn: "RoleId",
                keyValue: new Guid("6f3a2b4c-d9e0-f1a2-b3c4-d5e6f7a8b9c0"),
                column: "RoleType",
                value: 3);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "EmployeeType",
                table: "StaffProfileEntity");

            migrationBuilder.DropColumn(
                name: "RoleType",
                table: "RoleListInfoEntity");

            migrationBuilder.DropColumn(
                name: "ShiftType",
                table: "CinemaShiftTemplateEntity");

            migrationBuilder.DropColumn(
                name: "ShiftType",
                table: "CinemaShiftScheduleEntity");
        }
    }
}
