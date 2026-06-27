using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace Cinema.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class SeedDefaultDepartments : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "CinemaShiftTemplateEntity",
                keyColumn: "ShiftTemplateId",
                keyValue: new Guid("a1111111-1111-1111-1111-111111111111"),
                column: "DepartmentId",
                value: new Guid("d1111111-1111-1111-1111-111111111111"));

            migrationBuilder.UpdateData(
                table: "CinemaShiftTemplateEntity",
                keyColumn: "ShiftTemplateId",
                keyValue: new Guid("a1111111-1111-1111-1111-222222222222"),
                column: "DepartmentId",
                value: new Guid("d1111111-1111-1111-1111-111111111111"));

            migrationBuilder.UpdateData(
                table: "CinemaShiftTemplateEntity",
                keyColumn: "ShiftTemplateId",
                keyValue: new Guid("a1111111-1111-1111-1111-333333333333"),
                column: "DepartmentId",
                value: new Guid("d1111111-1111-1111-1111-111111111111"));

            migrationBuilder.UpdateData(
                table: "CinemaShiftTemplateEntity",
                keyColumn: "ShiftTemplateId",
                keyValue: new Guid("a1111111-1111-1111-1111-444444444444"),
                column: "DepartmentId",
                value: new Guid("d1111111-1111-1111-1111-222222222222"));

            migrationBuilder.UpdateData(
                table: "CinemaShiftTemplateEntity",
                keyColumn: "ShiftTemplateId",
                keyValue: new Guid("a1111111-1111-1111-1111-555555555555"),
                column: "DepartmentId",
                value: new Guid("d1111111-1111-1111-1111-222222222222"));

            migrationBuilder.UpdateData(
                table: "CinemaShiftTemplateEntity",
                keyColumn: "ShiftTemplateId",
                keyValue: new Guid("b2222222-2222-2222-2222-111111111111"),
                column: "DepartmentId",
                value: new Guid("d2222222-2222-2222-2222-111111111111"));

            migrationBuilder.UpdateData(
                table: "CinemaShiftTemplateEntity",
                keyColumn: "ShiftTemplateId",
                keyValue: new Guid("b2222222-2222-2222-2222-222222222222"),
                column: "DepartmentId",
                value: new Guid("d2222222-2222-2222-2222-111111111111"));

            migrationBuilder.UpdateData(
                table: "CinemaShiftTemplateEntity",
                keyColumn: "ShiftTemplateId",
                keyValue: new Guid("b2222222-2222-2222-2222-333333333333"),
                column: "DepartmentId",
                value: new Guid("d2222222-2222-2222-2222-111111111111"));

            migrationBuilder.UpdateData(
                table: "CinemaShiftTemplateEntity",
                keyColumn: "ShiftTemplateId",
                keyValue: new Guid("b2222222-2222-2222-2222-444444444444"),
                column: "DepartmentId",
                value: new Guid("d2222222-2222-2222-2222-222222222222"));

            migrationBuilder.UpdateData(
                table: "CinemaShiftTemplateEntity",
                keyColumn: "ShiftTemplateId",
                keyValue: new Guid("b2222222-2222-2222-2222-555555555555"),
                column: "DepartmentId",
                value: new Guid("d2222222-2222-2222-2222-222222222222"));

            migrationBuilder.UpdateData(
                table: "CinemaShiftTemplateEntity",
                keyColumn: "ShiftTemplateId",
                keyValue: new Guid("c3333333-3333-3333-3333-111111111111"),
                column: "DepartmentId",
                value: new Guid("dbbbbbbb-bbbb-bbbb-bbbb-111111111111"));

            migrationBuilder.UpdateData(
                table: "CinemaShiftTemplateEntity",
                keyColumn: "ShiftTemplateId",
                keyValue: new Guid("c3333333-3333-3333-3333-222222222222"),
                column: "DepartmentId",
                value: new Guid("dbbbbbbb-bbbb-bbbb-bbbb-111111111111"));

            migrationBuilder.UpdateData(
                table: "CinemaShiftTemplateEntity",
                keyColumn: "ShiftTemplateId",
                keyValue: new Guid("c3333333-3333-3333-3333-333333333333"),
                column: "DepartmentId",
                value: new Guid("dbbbbbbb-bbbb-bbbb-bbbb-111111111111"));

            migrationBuilder.UpdateData(
                table: "CinemaShiftTemplateEntity",
                keyColumn: "ShiftTemplateId",
                keyValue: new Guid("c3333333-3333-3333-3333-444444444444"),
                column: "DepartmentId",
                value: new Guid("dbbbbbbb-bbbb-bbbb-bbbb-222222222222"));

            migrationBuilder.UpdateData(
                table: "CinemaShiftTemplateEntity",
                keyColumn: "ShiftTemplateId",
                keyValue: new Guid("c3333333-3333-3333-3333-555555555555"),
                column: "DepartmentId",
                value: new Guid("dbbbbbbb-bbbb-bbbb-bbbb-222222222222"));

            migrationBuilder.InsertData(
                table: "DepartmentEntity",
                columns: new[] { "DepartmentId", "CashierType", "CinemaId", "DepartmentName", "DepartmentType", "IsActive", "SharedUserId" },
                values: new object[,]
                {
                    { new Guid("d1111111-1111-1111-1111-111111111111"), 0, new Guid("11111111-1111-1111-1111-111111111111"), "Quầy vé", 0, true, null },
                    { new Guid("d1111111-1111-1111-1111-222222222222"), 1, new Guid("11111111-1111-1111-1111-111111111111"), "Quầy bắp nước", 0, true, null },
                    { new Guid("d2222222-2222-2222-2222-111111111111"), 0, new Guid("22222222-2222-2222-2222-222222222222"), "Quầy vé", 0, true, null },
                    { new Guid("d2222222-2222-2222-2222-222222222222"), 1, new Guid("22222222-2222-2222-2222-222222222222"), "Quầy bắp nước", 0, true, null },
                    { new Guid("dbbbbbbb-bbbb-bbbb-bbbb-111111111111"), 0, new Guid("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"), "Quầy vé", 0, true, null },
                    { new Guid("dbbbbbbb-bbbb-bbbb-bbbb-222222222222"), 1, new Guid("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"), "Quầy bắp nước", 0, true, null }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "DepartmentEntity",
                keyColumn: "DepartmentId",
                keyValue: new Guid("d1111111-1111-1111-1111-111111111111"));

            migrationBuilder.DeleteData(
                table: "DepartmentEntity",
                keyColumn: "DepartmentId",
                keyValue: new Guid("d1111111-1111-1111-1111-222222222222"));

            migrationBuilder.DeleteData(
                table: "DepartmentEntity",
                keyColumn: "DepartmentId",
                keyValue: new Guid("d2222222-2222-2222-2222-111111111111"));

            migrationBuilder.DeleteData(
                table: "DepartmentEntity",
                keyColumn: "DepartmentId",
                keyValue: new Guid("d2222222-2222-2222-2222-222222222222"));

            migrationBuilder.DeleteData(
                table: "DepartmentEntity",
                keyColumn: "DepartmentId",
                keyValue: new Guid("dbbbbbbb-bbbb-bbbb-bbbb-111111111111"));

            migrationBuilder.DeleteData(
                table: "DepartmentEntity",
                keyColumn: "DepartmentId",
                keyValue: new Guid("dbbbbbbb-bbbb-bbbb-bbbb-222222222222"));

            migrationBuilder.UpdateData(
                table: "CinemaShiftTemplateEntity",
                keyColumn: "ShiftTemplateId",
                keyValue: new Guid("a1111111-1111-1111-1111-111111111111"),
                column: "DepartmentId",
                value: null);

            migrationBuilder.UpdateData(
                table: "CinemaShiftTemplateEntity",
                keyColumn: "ShiftTemplateId",
                keyValue: new Guid("a1111111-1111-1111-1111-222222222222"),
                column: "DepartmentId",
                value: null);

            migrationBuilder.UpdateData(
                table: "CinemaShiftTemplateEntity",
                keyColumn: "ShiftTemplateId",
                keyValue: new Guid("a1111111-1111-1111-1111-333333333333"),
                column: "DepartmentId",
                value: null);

            migrationBuilder.UpdateData(
                table: "CinemaShiftTemplateEntity",
                keyColumn: "ShiftTemplateId",
                keyValue: new Guid("a1111111-1111-1111-1111-444444444444"),
                column: "DepartmentId",
                value: null);

            migrationBuilder.UpdateData(
                table: "CinemaShiftTemplateEntity",
                keyColumn: "ShiftTemplateId",
                keyValue: new Guid("a1111111-1111-1111-1111-555555555555"),
                column: "DepartmentId",
                value: null);

            migrationBuilder.UpdateData(
                table: "CinemaShiftTemplateEntity",
                keyColumn: "ShiftTemplateId",
                keyValue: new Guid("b2222222-2222-2222-2222-111111111111"),
                column: "DepartmentId",
                value: null);

            migrationBuilder.UpdateData(
                table: "CinemaShiftTemplateEntity",
                keyColumn: "ShiftTemplateId",
                keyValue: new Guid("b2222222-2222-2222-2222-222222222222"),
                column: "DepartmentId",
                value: null);

            migrationBuilder.UpdateData(
                table: "CinemaShiftTemplateEntity",
                keyColumn: "ShiftTemplateId",
                keyValue: new Guid("b2222222-2222-2222-2222-333333333333"),
                column: "DepartmentId",
                value: null);

            migrationBuilder.UpdateData(
                table: "CinemaShiftTemplateEntity",
                keyColumn: "ShiftTemplateId",
                keyValue: new Guid("b2222222-2222-2222-2222-444444444444"),
                column: "DepartmentId",
                value: null);

            migrationBuilder.UpdateData(
                table: "CinemaShiftTemplateEntity",
                keyColumn: "ShiftTemplateId",
                keyValue: new Guid("b2222222-2222-2222-2222-555555555555"),
                column: "DepartmentId",
                value: null);

            migrationBuilder.UpdateData(
                table: "CinemaShiftTemplateEntity",
                keyColumn: "ShiftTemplateId",
                keyValue: new Guid("c3333333-3333-3333-3333-111111111111"),
                column: "DepartmentId",
                value: null);

            migrationBuilder.UpdateData(
                table: "CinemaShiftTemplateEntity",
                keyColumn: "ShiftTemplateId",
                keyValue: new Guid("c3333333-3333-3333-3333-222222222222"),
                column: "DepartmentId",
                value: null);

            migrationBuilder.UpdateData(
                table: "CinemaShiftTemplateEntity",
                keyColumn: "ShiftTemplateId",
                keyValue: new Guid("c3333333-3333-3333-3333-333333333333"),
                column: "DepartmentId",
                value: null);

            migrationBuilder.UpdateData(
                table: "CinemaShiftTemplateEntity",
                keyColumn: "ShiftTemplateId",
                keyValue: new Guid("c3333333-3333-3333-3333-444444444444"),
                column: "DepartmentId",
                value: null);

            migrationBuilder.UpdateData(
                table: "CinemaShiftTemplateEntity",
                keyColumn: "ShiftTemplateId",
                keyValue: new Guid("c3333333-3333-3333-3333-555555555555"),
                column: "DepartmentId",
                value: null);
        }
    }
}
