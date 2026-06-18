using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace DataAccess.Migrations
{
    /// <inheritdoc />
    public partial class SimplifyAuditUserLinks : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_AuditLogEntity_UserInfoEntity_ActorUserId",
                table: "AuditLogEntity");

            migrationBuilder.DropForeignKey(
                name: "FK_AuditoriumInfoEntities_UserInfoEntity_CreatedByUserId",
                table: "AuditoriumInfoEntities");

            migrationBuilder.DropForeignKey(
                name: "FK_AuditoriumInfoEntities_UserInfoEntity_DeletedByUserId",
                table: "AuditoriumInfoEntities");

            migrationBuilder.DropForeignKey(
                name: "FK_AuditoriumInfoEntities_UserInfoEntity_UpdatedByUserId",
                table: "AuditoriumInfoEntities");

            migrationBuilder.DropForeignKey(
                name: "FK_CinemaDiscountInfoEntity_UserInfoEntity_CreatedByUserId",
                table: "CinemaDiscountInfoEntity");

            migrationBuilder.DropForeignKey(
                name: "FK_CinemaDiscountInfoEntity_UserInfoEntity_DeletedByUserId",
                table: "CinemaDiscountInfoEntity");

            migrationBuilder.DropForeignKey(
                name: "FK_CinemaDiscountInfoEntity_UserInfoEntity_UpdatedByUserId",
                table: "CinemaDiscountInfoEntity");

            migrationBuilder.DropForeignKey(
                name: "FK_CinemaInfoEntity_UserInfoEntity_CreatedByUserId",
                table: "CinemaInfoEntity");

            migrationBuilder.DropForeignKey(
                name: "FK_CinemaInfoEntity_UserInfoEntity_DeletedByUserId",
                table: "CinemaInfoEntity");

            migrationBuilder.DropForeignKey(
                name: "FK_CinemaInfoEntity_UserInfoEntity_UpdatedByUserId",
                table: "CinemaInfoEntity");

            migrationBuilder.DropForeignKey(
                name: "FK_CinemaSurchargeInfosEntity_UserInfoEntity_CreatedByUserId",
                table: "CinemaSurchargeInfosEntity");

            migrationBuilder.DropForeignKey(
                name: "FK_CinemaSurchargeInfosEntity_UserInfoEntity_DeletedByUserId",
                table: "CinemaSurchargeInfosEntity");

            migrationBuilder.DropForeignKey(
                name: "FK_CinemaSurchargeInfosEntity_UserInfoEntity_UpdatedByUserId",
                table: "CinemaSurchargeInfosEntity");

            migrationBuilder.DropForeignKey(
                name: "FK_MovieFormatInfoEntity_UserInfoEntity_CreatedByUserId",
                table: "MovieFormatInfoEntity");

            migrationBuilder.DropForeignKey(
                name: "FK_MovieFormatInfoEntity_UserInfoEntity_DeletedByUserId",
                table: "MovieFormatInfoEntity");

            migrationBuilder.DropForeignKey(
                name: "FK_MovieFormatInfoEntity_UserInfoEntity_UpdatedByUserId",
                table: "MovieFormatInfoEntity");

            migrationBuilder.DropForeignKey(
                name: "FK_MovieInfoEntity_UserInfoEntity_CreatedByUserId",
                table: "MovieInfoEntity");

            migrationBuilder.DropForeignKey(
                name: "FK_MovieInfoEntity_UserInfoEntity_DeletedByUserId",
                table: "MovieInfoEntity");

            migrationBuilder.DropForeignKey(
                name: "FK_MovieInfoEntity_UserInfoEntity_UpdatedByUserId",
                table: "MovieInfoEntity");

            migrationBuilder.DropForeignKey(
                name: "FK_MovieScheduleInfoEntity_UserInfoEntity_CreatedByUserId",
                table: "MovieScheduleInfoEntity");

            migrationBuilder.DropForeignKey(
                name: "FK_MovieScheduleInfoEntity_UserInfoEntity_DeletedByUserId",
                table: "MovieScheduleInfoEntity");

            migrationBuilder.DropForeignKey(
                name: "FK_MovieScheduleInfoEntity_UserInfoEntity_UpdatedByUserId",
                table: "MovieScheduleInfoEntity");

            migrationBuilder.DropIndex(
                name: "IX_MovieScheduleInfoEntity_CreatedByUserId",
                table: "MovieScheduleInfoEntity");

            migrationBuilder.DropIndex(
                name: "IX_MovieScheduleInfoEntity_DeletedByUserId",
                table: "MovieScheduleInfoEntity");

            migrationBuilder.DropIndex(
                name: "IX_MovieScheduleInfoEntity_UpdatedByUserId",
                table: "MovieScheduleInfoEntity");

            migrationBuilder.DropIndex(
                name: "IX_MovieInfoEntity_CreatedByUserId",
                table: "MovieInfoEntity");

            migrationBuilder.DropIndex(
                name: "IX_MovieInfoEntity_DeletedByUserId",
                table: "MovieInfoEntity");

            migrationBuilder.DropIndex(
                name: "IX_MovieInfoEntity_UpdatedByUserId",
                table: "MovieInfoEntity");

            migrationBuilder.DropIndex(
                name: "IX_MovieFormatInfoEntity_CreatedByUserId",
                table: "MovieFormatInfoEntity");

            migrationBuilder.DropIndex(
                name: "IX_MovieFormatInfoEntity_DeletedByUserId",
                table: "MovieFormatInfoEntity");

            migrationBuilder.DropIndex(
                name: "IX_MovieFormatInfoEntity_UpdatedByUserId",
                table: "MovieFormatInfoEntity");

            migrationBuilder.DropIndex(
                name: "IX_CinemaSurchargeInfosEntity_CreatedByUserId",
                table: "CinemaSurchargeInfosEntity");

            migrationBuilder.DropIndex(
                name: "IX_CinemaSurchargeInfosEntity_DeletedByUserId",
                table: "CinemaSurchargeInfosEntity");

            migrationBuilder.DropIndex(
                name: "IX_CinemaSurchargeInfosEntity_UpdatedByUserId",
                table: "CinemaSurchargeInfosEntity");

            migrationBuilder.DropIndex(
                name: "IX_CinemaInfoEntity_CreatedByUserId",
                table: "CinemaInfoEntity");

            migrationBuilder.DropIndex(
                name: "IX_CinemaInfoEntity_DeletedByUserId",
                table: "CinemaInfoEntity");

            migrationBuilder.DropIndex(
                name: "IX_CinemaInfoEntity_UpdatedByUserId",
                table: "CinemaInfoEntity");

            migrationBuilder.DropIndex(
                name: "IX_CinemaDiscountInfoEntity_CreatedByUserId",
                table: "CinemaDiscountInfoEntity");

            migrationBuilder.DropIndex(
                name: "IX_CinemaDiscountInfoEntity_DeletedByUserId",
                table: "CinemaDiscountInfoEntity");

            migrationBuilder.DropIndex(
                name: "IX_CinemaDiscountInfoEntity_UpdatedByUserId",
                table: "CinemaDiscountInfoEntity");

            migrationBuilder.DropIndex(
                name: "IX_AuditoriumInfoEntities_CreatedByUserId",
                table: "AuditoriumInfoEntities");

            migrationBuilder.DropIndex(
                name: "IX_AuditoriumInfoEntities_DeletedByUserId",
                table: "AuditoriumInfoEntities");

            migrationBuilder.DropIndex(
                name: "IX_AuditoriumInfoEntities_UpdatedByUserId",
                table: "AuditoriumInfoEntities");

            migrationBuilder.DropIndex(
                name: "IX_AuditLogEntity_ActorUserId",
                table: "AuditLogEntity");

            migrationBuilder.DeleteData(
                table: "MovieScheduleInfoEntity",
                keyColumn: "MovieScheduleInfoId",
                keyValue: new Guid("73ee35f5-5f22-4966-9fb5-ce7309a219b5"));

            migrationBuilder.DeleteData(
                table: "MovieScheduleInfoEntity",
                keyColumn: "MovieScheduleInfoId",
                keyValue: new Guid("897adf24-f3b0-4d38-bbbe-32b8832f360d"));

            migrationBuilder.UpdateData(
                table: "AuditoriumInfoEntities",
                keyColumn: "AuditoriumId",
                keyValue: new Guid("33333333-3333-3333-3333-333333333333"),
                column: "UpdatedAt",
                value: new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.UpdateData(
                table: "AuditoriumInfoEntities",
                keyColumn: "AuditoriumId",
                keyValue: new Guid("44444444-4444-4444-4444-444444444444"),
                column: "UpdatedAt",
                value: new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.UpdateData(
                table: "AuditoriumInfoEntities",
                keyColumn: "AuditoriumId",
                keyValue: new Guid("55555555-5555-5555-5555-555555555555"),
                column: "UpdatedAt",
                value: new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.UpdateData(
                table: "CinemaInfoEntity",
                keyColumn: "CinemaId",
                keyValue: new Guid("11111111-1111-1111-1111-111111111111"),
                column: "UpdatedAt",
                value: new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.UpdateData(
                table: "CinemaInfoEntity",
                keyColumn: "CinemaId",
                keyValue: new Guid("22222222-2222-2222-2222-222222222222"),
                column: "UpdatedAt",
                value: new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.UpdateData(
                table: "CinemaInfoEntity",
                keyColumn: "CinemaId",
                keyValue: new Guid("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
                column: "UpdatedAt",
                value: new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.UpdateData(
                table: "MovieInfoEntity",
                keyColumn: "MovieId",
                keyValue: new Guid("66666666-6666-6666-6666-666666666666"),
                column: "UpdatedAt",
                value: new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.UpdateData(
                table: "MovieInfoEntity",
                keyColumn: "MovieId",
                keyValue: new Guid("77777777-7777-7777-7777-777777777777"),
                column: "UpdatedAt",
                value: new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.UpdateData(
                table: "MovieInfoEntity",
                keyColumn: "MovieId",
                keyValue: new Guid("88888888-8888-8888-8888-888888888888"),
                column: "UpdatedAt",
                value: new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.InsertData(
                table: "MovieScheduleInfoEntity",
                columns: new[] { "MovieScheduleInfoId", "ActiveAt", "AuditoriumId", "CreatedAt", "CreatedByUserId", "DeletedAt", "DeletedByUserId", "EndedTime", "IsActive", "IsDeleted", "MovieFormatId", "MovieId", "StartTime", "UpdatedAt", "UpdatedByUserId" },
                values: new object[,]
                {
                    { new Guid("99999999-9999-9999-9999-999999999991"), new DateTime(2026, 3, 19, 19, 0, 0, 0, DateTimeKind.Unspecified), new Guid("33333333-3333-3333-3333-333333333333"), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new Guid("7b5d2c1e-9f8a-3e7b-c1d2-a0e9f8c7b6a5"), null, null, new DateTime(2026, 3, 19, 21, 56, 0, 0, DateTimeKind.Unspecified), true, false, new Guid("3fbc4a32-15f5-47e0-b98a-784f1b8a9612"), new Guid("66666666-6666-6666-6666-666666666666"), new DateTime(2026, 3, 19, 19, 0, 0, 0, DateTimeKind.Unspecified), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), null },
                    { new Guid("99999999-9999-9999-9999-999999999992"), new DateTime(2026, 3, 19, 20, 0, 0, 0, DateTimeKind.Unspecified), new Guid("44444444-4444-4444-4444-444444444444"), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new Guid("e4e1f7d8-c3b2-4a90-8c67-2f5a1b3d9e0c"), null, null, new DateTime(2026, 3, 19, 23, 0, 0, 0, DateTimeKind.Unspecified), true, false, new Guid("d29b0f1c-8e2a-4c5b-bc3d-1a2f3e4d5c6b"), new Guid("77777777-7777-7777-7777-777777777777"), new DateTime(2026, 3, 19, 20, 0, 0, 0, DateTimeKind.Unspecified), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), null }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "MovieScheduleInfoEntity",
                keyColumn: "MovieScheduleInfoId",
                keyValue: new Guid("99999999-9999-9999-9999-999999999991"));

            migrationBuilder.DeleteData(
                table: "MovieScheduleInfoEntity",
                keyColumn: "MovieScheduleInfoId",
                keyValue: new Guid("99999999-9999-9999-9999-999999999992"));

            migrationBuilder.UpdateData(
                table: "AuditoriumInfoEntities",
                keyColumn: "AuditoriumId",
                keyValue: new Guid("33333333-3333-3333-3333-333333333333"),
                column: "UpdatedAt",
                value: new DateTime(2026, 6, 13, 0, 30, 51, 23, DateTimeKind.Local).AddTicks(8106));

            migrationBuilder.UpdateData(
                table: "AuditoriumInfoEntities",
                keyColumn: "AuditoriumId",
                keyValue: new Guid("44444444-4444-4444-4444-444444444444"),
                column: "UpdatedAt",
                value: new DateTime(2026, 6, 13, 0, 30, 51, 23, DateTimeKind.Local).AddTicks(8110));

            migrationBuilder.UpdateData(
                table: "AuditoriumInfoEntities",
                keyColumn: "AuditoriumId",
                keyValue: new Guid("55555555-5555-5555-5555-555555555555"),
                column: "UpdatedAt",
                value: new DateTime(2026, 6, 13, 0, 30, 51, 23, DateTimeKind.Local).AddTicks(8113));

            migrationBuilder.UpdateData(
                table: "CinemaInfoEntity",
                keyColumn: "CinemaId",
                keyValue: new Guid("11111111-1111-1111-1111-111111111111"),
                column: "UpdatedAt",
                value: new DateTime(2026, 6, 13, 0, 30, 51, 23, DateTimeKind.Local).AddTicks(8031));

            migrationBuilder.UpdateData(
                table: "CinemaInfoEntity",
                keyColumn: "CinemaId",
                keyValue: new Guid("22222222-2222-2222-2222-222222222222"),
                column: "UpdatedAt",
                value: new DateTime(2026, 6, 13, 0, 30, 51, 23, DateTimeKind.Local).AddTicks(8049));

            migrationBuilder.UpdateData(
                table: "CinemaInfoEntity",
                keyColumn: "CinemaId",
                keyValue: new Guid("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
                column: "UpdatedAt",
                value: new DateTime(2026, 6, 13, 0, 30, 51, 23, DateTimeKind.Local).AddTicks(8054));

            migrationBuilder.UpdateData(
                table: "MovieInfoEntity",
                keyColumn: "MovieId",
                keyValue: new Guid("66666666-6666-6666-6666-666666666666"),
                column: "UpdatedAt",
                value: new DateTime(2026, 6, 13, 0, 30, 51, 23, DateTimeKind.Local).AddTicks(9077));

            migrationBuilder.UpdateData(
                table: "MovieInfoEntity",
                keyColumn: "MovieId",
                keyValue: new Guid("77777777-7777-7777-7777-777777777777"),
                column: "UpdatedAt",
                value: new DateTime(2026, 6, 13, 0, 30, 51, 23, DateTimeKind.Local).AddTicks(9108));

            migrationBuilder.UpdateData(
                table: "MovieInfoEntity",
                keyColumn: "MovieId",
                keyValue: new Guid("88888888-8888-8888-8888-888888888888"),
                column: "UpdatedAt",
                value: new DateTime(2026, 6, 13, 0, 30, 51, 23, DateTimeKind.Local).AddTicks(9113));

            migrationBuilder.InsertData(
                table: "MovieScheduleInfoEntity",
                columns: new[] { "MovieScheduleInfoId", "ActiveAt", "AuditoriumId", "CreatedAt", "CreatedByUserId", "DeletedAt", "DeletedByUserId", "EndedTime", "IsActive", "IsDeleted", "MovieFormatId", "MovieId", "StartTime", "UpdatedAt", "UpdatedByUserId" },
                values: new object[,]
                {
                    { new Guid("73ee35f5-5f22-4966-9fb5-ce7309a219b5"), new DateTime(2026, 3, 19, 19, 0, 0, 0, DateTimeKind.Unspecified), new Guid("33333333-3333-3333-3333-333333333333"), new DateTime(2026, 6, 13, 0, 30, 51, 23, DateTimeKind.Local).AddTicks(9253), new Guid("7b5d2c1e-9f8a-3e7b-c1d2-a0e9f8c7b6a5"), null, null, new DateTime(2026, 3, 19, 21, 56, 0, 0, DateTimeKind.Unspecified), true, false, new Guid("3fbc4a32-15f5-47e0-b98a-784f1b8a9612"), new Guid("66666666-6666-6666-6666-666666666666"), new DateTime(2026, 3, 19, 19, 0, 0, 0, DateTimeKind.Unspecified), new DateTime(2026, 6, 13, 0, 30, 51, 23, DateTimeKind.Local).AddTicks(9254), null },
                    { new Guid("897adf24-f3b0-4d38-bbbe-32b8832f360d"), new DateTime(2026, 3, 19, 20, 0, 0, 0, DateTimeKind.Unspecified), new Guid("44444444-4444-4444-4444-444444444444"), new DateTime(2026, 6, 13, 0, 30, 51, 23, DateTimeKind.Local).AddTicks(9354), new Guid("e4e1f7d8-c3b2-4a90-8c67-2f5a1b3d9e0c"), null, null, new DateTime(2026, 3, 19, 23, 0, 0, 0, DateTimeKind.Unspecified), true, false, new Guid("d29b0f1c-8e2a-4c5b-bc3d-1a2f3e4d5c6b"), new Guid("77777777-7777-7777-7777-777777777777"), new DateTime(2026, 3, 19, 20, 0, 0, 0, DateTimeKind.Unspecified), new DateTime(2026, 6, 13, 0, 30, 51, 23, DateTimeKind.Local).AddTicks(9355), null }
                });

            migrationBuilder.CreateIndex(
                name: "IX_MovieScheduleInfoEntity_CreatedByUserId",
                table: "MovieScheduleInfoEntity",
                column: "CreatedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_MovieScheduleInfoEntity_DeletedByUserId",
                table: "MovieScheduleInfoEntity",
                column: "DeletedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_MovieScheduleInfoEntity_UpdatedByUserId",
                table: "MovieScheduleInfoEntity",
                column: "UpdatedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_MovieInfoEntity_CreatedByUserId",
                table: "MovieInfoEntity",
                column: "CreatedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_MovieInfoEntity_DeletedByUserId",
                table: "MovieInfoEntity",
                column: "DeletedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_MovieInfoEntity_UpdatedByUserId",
                table: "MovieInfoEntity",
                column: "UpdatedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_MovieFormatInfoEntity_CreatedByUserId",
                table: "MovieFormatInfoEntity",
                column: "CreatedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_MovieFormatInfoEntity_DeletedByUserId",
                table: "MovieFormatInfoEntity",
                column: "DeletedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_MovieFormatInfoEntity_UpdatedByUserId",
                table: "MovieFormatInfoEntity",
                column: "UpdatedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_CinemaSurchargeInfosEntity_CreatedByUserId",
                table: "CinemaSurchargeInfosEntity",
                column: "CreatedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_CinemaSurchargeInfosEntity_DeletedByUserId",
                table: "CinemaSurchargeInfosEntity",
                column: "DeletedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_CinemaSurchargeInfosEntity_UpdatedByUserId",
                table: "CinemaSurchargeInfosEntity",
                column: "UpdatedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_CinemaInfoEntity_CreatedByUserId",
                table: "CinemaInfoEntity",
                column: "CreatedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_CinemaInfoEntity_DeletedByUserId",
                table: "CinemaInfoEntity",
                column: "DeletedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_CinemaInfoEntity_UpdatedByUserId",
                table: "CinemaInfoEntity",
                column: "UpdatedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_CinemaDiscountInfoEntity_CreatedByUserId",
                table: "CinemaDiscountInfoEntity",
                column: "CreatedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_CinemaDiscountInfoEntity_DeletedByUserId",
                table: "CinemaDiscountInfoEntity",
                column: "DeletedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_CinemaDiscountInfoEntity_UpdatedByUserId",
                table: "CinemaDiscountInfoEntity",
                column: "UpdatedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_AuditoriumInfoEntities_CreatedByUserId",
                table: "AuditoriumInfoEntities",
                column: "CreatedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_AuditoriumInfoEntities_DeletedByUserId",
                table: "AuditoriumInfoEntities",
                column: "DeletedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_AuditoriumInfoEntities_UpdatedByUserId",
                table: "AuditoriumInfoEntities",
                column: "UpdatedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_AuditLogEntity_ActorUserId",
                table: "AuditLogEntity",
                column: "ActorUserId");

            migrationBuilder.AddForeignKey(
                name: "FK_AuditLogEntity_UserInfoEntity_ActorUserId",
                table: "AuditLogEntity",
                column: "ActorUserId",
                principalTable: "UserInfoEntity",
                principalColumn: "UserId",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_AuditoriumInfoEntities_UserInfoEntity_CreatedByUserId",
                table: "AuditoriumInfoEntities",
                column: "CreatedByUserId",
                principalTable: "UserInfoEntity",
                principalColumn: "UserId",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_AuditoriumInfoEntities_UserInfoEntity_DeletedByUserId",
                table: "AuditoriumInfoEntities",
                column: "DeletedByUserId",
                principalTable: "UserInfoEntity",
                principalColumn: "UserId",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_AuditoriumInfoEntities_UserInfoEntity_UpdatedByUserId",
                table: "AuditoriumInfoEntities",
                column: "UpdatedByUserId",
                principalTable: "UserInfoEntity",
                principalColumn: "UserId",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_CinemaDiscountInfoEntity_UserInfoEntity_CreatedByUserId",
                table: "CinemaDiscountInfoEntity",
                column: "CreatedByUserId",
                principalTable: "UserInfoEntity",
                principalColumn: "UserId",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_CinemaDiscountInfoEntity_UserInfoEntity_DeletedByUserId",
                table: "CinemaDiscountInfoEntity",
                column: "DeletedByUserId",
                principalTable: "UserInfoEntity",
                principalColumn: "UserId",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_CinemaDiscountInfoEntity_UserInfoEntity_UpdatedByUserId",
                table: "CinemaDiscountInfoEntity",
                column: "UpdatedByUserId",
                principalTable: "UserInfoEntity",
                principalColumn: "UserId",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_CinemaInfoEntity_UserInfoEntity_CreatedByUserId",
                table: "CinemaInfoEntity",
                column: "CreatedByUserId",
                principalTable: "UserInfoEntity",
                principalColumn: "UserId",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_CinemaInfoEntity_UserInfoEntity_DeletedByUserId",
                table: "CinemaInfoEntity",
                column: "DeletedByUserId",
                principalTable: "UserInfoEntity",
                principalColumn: "UserId",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_CinemaInfoEntity_UserInfoEntity_UpdatedByUserId",
                table: "CinemaInfoEntity",
                column: "UpdatedByUserId",
                principalTable: "UserInfoEntity",
                principalColumn: "UserId",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_CinemaSurchargeInfosEntity_UserInfoEntity_CreatedByUserId",
                table: "CinemaSurchargeInfosEntity",
                column: "CreatedByUserId",
                principalTable: "UserInfoEntity",
                principalColumn: "UserId",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_CinemaSurchargeInfosEntity_UserInfoEntity_DeletedByUserId",
                table: "CinemaSurchargeInfosEntity",
                column: "DeletedByUserId",
                principalTable: "UserInfoEntity",
                principalColumn: "UserId",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_CinemaSurchargeInfosEntity_UserInfoEntity_UpdatedByUserId",
                table: "CinemaSurchargeInfosEntity",
                column: "UpdatedByUserId",
                principalTable: "UserInfoEntity",
                principalColumn: "UserId",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_MovieFormatInfoEntity_UserInfoEntity_CreatedByUserId",
                table: "MovieFormatInfoEntity",
                column: "CreatedByUserId",
                principalTable: "UserInfoEntity",
                principalColumn: "UserId",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_MovieFormatInfoEntity_UserInfoEntity_DeletedByUserId",
                table: "MovieFormatInfoEntity",
                column: "DeletedByUserId",
                principalTable: "UserInfoEntity",
                principalColumn: "UserId",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_MovieFormatInfoEntity_UserInfoEntity_UpdatedByUserId",
                table: "MovieFormatInfoEntity",
                column: "UpdatedByUserId",
                principalTable: "UserInfoEntity",
                principalColumn: "UserId",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_MovieInfoEntity_UserInfoEntity_CreatedByUserId",
                table: "MovieInfoEntity",
                column: "CreatedByUserId",
                principalTable: "UserInfoEntity",
                principalColumn: "UserId",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_MovieInfoEntity_UserInfoEntity_DeletedByUserId",
                table: "MovieInfoEntity",
                column: "DeletedByUserId",
                principalTable: "UserInfoEntity",
                principalColumn: "UserId",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_MovieInfoEntity_UserInfoEntity_UpdatedByUserId",
                table: "MovieInfoEntity",
                column: "UpdatedByUserId",
                principalTable: "UserInfoEntity",
                principalColumn: "UserId",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_MovieScheduleInfoEntity_UserInfoEntity_CreatedByUserId",
                table: "MovieScheduleInfoEntity",
                column: "CreatedByUserId",
                principalTable: "UserInfoEntity",
                principalColumn: "UserId",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_MovieScheduleInfoEntity_UserInfoEntity_DeletedByUserId",
                table: "MovieScheduleInfoEntity",
                column: "DeletedByUserId",
                principalTable: "UserInfoEntity",
                principalColumn: "UserId",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_MovieScheduleInfoEntity_UserInfoEntity_UpdatedByUserId",
                table: "MovieScheduleInfoEntity",
                column: "UpdatedByUserId",
                principalTable: "UserInfoEntity",
                principalColumn: "UserId",
                onDelete: ReferentialAction.Restrict);
        }
    }
}
