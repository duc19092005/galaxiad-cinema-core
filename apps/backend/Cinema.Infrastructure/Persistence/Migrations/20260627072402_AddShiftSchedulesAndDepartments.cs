using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Cinema.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddShiftSchedulesAndDepartments : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_StaffShiftRegistrationEntity_CinemaShiftTemplateEntity_ShiftTemplateId",
                table: "StaffShiftRegistrationEntity");

            migrationBuilder.DropIndex(
                name: "IX_StaffShiftRegistrationEntity_StaffId_ShiftTemplateId_RegistrationDate",
                table: "StaffShiftRegistrationEntity");

            migrationBuilder.AlterColumn<Guid>(
                name: "ShiftTemplateId",
                table: "StaffShiftRegistrationEntity",
                type: "uniqueidentifier",
                nullable: true,
                oldClrType: typeof(Guid),
                oldType: "uniqueidentifier");

            migrationBuilder.AddColumn<Guid>(
                name: "ShiftScheduleId",
                table: "StaffShiftRegistrationEntity",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "DepartmentId",
                table: "CinemaShiftTemplateEntity",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "CinemaShiftScheduleEntity",
                columns: table => new
                {
                    ShiftScheduleId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CinemaId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    DepartmentId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Date = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ShiftName = table.Column<string>(type: "nvarchar(50)", nullable: false),
                    StartTime = table.Column<TimeSpan>(type: "time", nullable: false),
                    EndTime = table.Column<TimeSpan>(type: "time", nullable: false),
                    MaxStaff = table.Column<int>(type: "int", nullable: false),
                    RoleId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    DeletionStatus = table.Column<string>(type: "varchar(30)", nullable: false),
                    DeletionReason = table.Column<string>(type: "nvarchar(500)", nullable: true),
                    DeletionRequestedByUserId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    DeletionRequestedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CinemaShiftScheduleEntity", x => x.ShiftScheduleId);
                    table.ForeignKey(
                        name: "FK_CinemaShiftScheduleEntity_CinemaInfoEntity_CinemaId",
                        column: x => x.CinemaId,
                        principalTable: "CinemaInfoEntity",
                        principalColumn: "CinemaId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_CinemaShiftScheduleEntity_DepartmentEntity_DepartmentId",
                        column: x => x.DepartmentId,
                        principalTable: "DepartmentEntity",
                        principalColumn: "DepartmentId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_CinemaShiftScheduleEntity_RoleListInfoEntity_RoleId",
                        column: x => x.RoleId,
                        principalTable: "RoleListInfoEntity",
                        principalColumn: "RoleId",
                        onDelete: ReferentialAction.Restrict);
                });

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

            migrationBuilder.CreateIndex(
                name: "IX_StaffShiftRegistrationEntity_ShiftScheduleId",
                table: "StaffShiftRegistrationEntity",
                column: "ShiftScheduleId");

            migrationBuilder.CreateIndex(
                name: "IX_StaffShiftRegistrationEntity_StaffId_ShiftScheduleId",
                table: "StaffShiftRegistrationEntity",
                columns: new[] { "StaffId", "ShiftScheduleId" },
                unique: true,
                filter: "[ShiftScheduleId] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_StaffShiftRegistrationEntity_StaffId_ShiftTemplateId_RegistrationDate",
                table: "StaffShiftRegistrationEntity",
                columns: new[] { "StaffId", "ShiftTemplateId", "RegistrationDate" },
                unique: true,
                filter: "[ShiftTemplateId] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_CinemaShiftTemplateEntity_DepartmentId",
                table: "CinemaShiftTemplateEntity",
                column: "DepartmentId");

            migrationBuilder.CreateIndex(
                name: "IX_CinemaShiftScheduleEntity_CinemaId",
                table: "CinemaShiftScheduleEntity",
                column: "CinemaId");

            migrationBuilder.CreateIndex(
                name: "IX_CinemaShiftScheduleEntity_DepartmentId",
                table: "CinemaShiftScheduleEntity",
                column: "DepartmentId");

            migrationBuilder.CreateIndex(
                name: "IX_CinemaShiftScheduleEntity_RoleId",
                table: "CinemaShiftScheduleEntity",
                column: "RoleId");

            migrationBuilder.AddForeignKey(
                name: "FK_CinemaShiftTemplateEntity_DepartmentEntity_DepartmentId",
                table: "CinemaShiftTemplateEntity",
                column: "DepartmentId",
                principalTable: "DepartmentEntity",
                principalColumn: "DepartmentId",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_StaffShiftRegistrationEntity_CinemaShiftScheduleEntity_ShiftScheduleId",
                table: "StaffShiftRegistrationEntity",
                column: "ShiftScheduleId",
                principalTable: "CinemaShiftScheduleEntity",
                principalColumn: "ShiftScheduleId",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_StaffShiftRegistrationEntity_CinemaShiftTemplateEntity_ShiftTemplateId",
                table: "StaffShiftRegistrationEntity",
                column: "ShiftTemplateId",
                principalTable: "CinemaShiftTemplateEntity",
                principalColumn: "ShiftTemplateId",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_CinemaShiftTemplateEntity_DepartmentEntity_DepartmentId",
                table: "CinemaShiftTemplateEntity");

            migrationBuilder.DropForeignKey(
                name: "FK_StaffShiftRegistrationEntity_CinemaShiftScheduleEntity_ShiftScheduleId",
                table: "StaffShiftRegistrationEntity");

            migrationBuilder.DropForeignKey(
                name: "FK_StaffShiftRegistrationEntity_CinemaShiftTemplateEntity_ShiftTemplateId",
                table: "StaffShiftRegistrationEntity");

            migrationBuilder.DropTable(
                name: "CinemaShiftScheduleEntity");

            migrationBuilder.DropIndex(
                name: "IX_StaffShiftRegistrationEntity_ShiftScheduleId",
                table: "StaffShiftRegistrationEntity");

            migrationBuilder.DropIndex(
                name: "IX_StaffShiftRegistrationEntity_StaffId_ShiftScheduleId",
                table: "StaffShiftRegistrationEntity");

            migrationBuilder.DropIndex(
                name: "IX_StaffShiftRegistrationEntity_StaffId_ShiftTemplateId_RegistrationDate",
                table: "StaffShiftRegistrationEntity");

            migrationBuilder.DropIndex(
                name: "IX_CinemaShiftTemplateEntity_DepartmentId",
                table: "CinemaShiftTemplateEntity");

            migrationBuilder.DropColumn(
                name: "ShiftScheduleId",
                table: "StaffShiftRegistrationEntity");

            migrationBuilder.DropColumn(
                name: "DepartmentId",
                table: "CinemaShiftTemplateEntity");

            migrationBuilder.AlterColumn<Guid>(
                name: "ShiftTemplateId",
                table: "StaffShiftRegistrationEntity",
                type: "uniqueidentifier",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"),
                oldClrType: typeof(Guid),
                oldType: "uniqueidentifier",
                oldNullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_StaffShiftRegistrationEntity_StaffId_ShiftTemplateId_RegistrationDate",
                table: "StaffShiftRegistrationEntity",
                columns: new[] { "StaffId", "ShiftTemplateId", "RegistrationDate" },
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_StaffShiftRegistrationEntity_CinemaShiftTemplateEntity_ShiftTemplateId",
                table: "StaffShiftRegistrationEntity",
                column: "ShiftTemplateId",
                principalTable: "CinemaShiftTemplateEntity",
                principalColumn: "ShiftTemplateId",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
