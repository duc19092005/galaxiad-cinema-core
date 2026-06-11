using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace DataAccess.Migrations
{
    /// <inheritdoc />
    public partial class AddRewardPointsAndVouchers : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "MovieScheduleInfoEntity",
                keyColumn: "MovieScheduleInfoId",
                keyValue: new Guid("32a9ef22-5211-4641-a024-7deab5cf520b"));

            migrationBuilder.DeleteData(
                table: "MovieScheduleInfoEntity",
                keyColumn: "MovieScheduleInfoId",
                keyValue: new Guid("aa3a1cc3-a6d6-49ad-ba0c-1b382e6ed5c5"));

            migrationBuilder.AddColumn<int>(
                name: "RemainingQuantity",
                table: "VoucherInfoEntity",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<DateTime>(
                name: "ValidFrom",
                table: "VoucherInfoEntity",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "ValidTo",
                table: "VoucherInfoEntity",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "VoucherPointsCost",
                table: "VoucherInfoEntity",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "VoucherQuantity",
                table: "VoucherInfoEntity",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<long>(
                name: "RewardPoints",
                table: "UserInfoEntity",
                type: "bigint",
                nullable: false,
                defaultValue: 0L);



            migrationBuilder.CreateTable(
                name: "UserVoucherEntity",
                columns: table => new
                {
                    UserVoucherId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    UserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    VoucherId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    IsUsed = table.Column<bool>(type: "bit", nullable: false),
                    PurchasedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UsedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserVoucherEntity", x => x.UserVoucherId);
                    table.ForeignKey(
                        name: "FK_UserVoucherEntity_UserInfoEntity_UserId",
                        column: x => x.UserId,
                        principalTable: "UserInfoEntity",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_UserVoucherEntity_VoucherInfoEntity_VoucherId",
                        column: x => x.VoucherId,
                        principalTable: "VoucherInfoEntity",
                        principalColumn: "voucherId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.UpdateData(
                table: "AuditoriumInfoEntities",
                keyColumn: "AuditoriumId",
                keyValue: new Guid("33333333-3333-3333-3333-333333333333"),
                column: "UpdatedAt",
                value: new DateTime(2026, 6, 11, 9, 55, 39, 564, DateTimeKind.Local).AddTicks(6314));

            migrationBuilder.UpdateData(
                table: "AuditoriumInfoEntities",
                keyColumn: "AuditoriumId",
                keyValue: new Guid("44444444-4444-4444-4444-444444444444"),
                column: "UpdatedAt",
                value: new DateTime(2026, 6, 11, 9, 55, 39, 564, DateTimeKind.Local).AddTicks(6317));

            migrationBuilder.UpdateData(
                table: "AuditoriumInfoEntities",
                keyColumn: "AuditoriumId",
                keyValue: new Guid("55555555-5555-5555-5555-555555555555"),
                column: "UpdatedAt",
                value: new DateTime(2026, 6, 11, 9, 55, 39, 564, DateTimeKind.Local).AddTicks(6319));

            migrationBuilder.UpdateData(
                table: "CinemaInfoEntity",
                keyColumn: "CinemaId",
                keyValue: new Guid("11111111-1111-1111-1111-111111111111"),
                column: "UpdatedAt",
                value: new DateTime(2026, 6, 11, 9, 55, 39, 564, DateTimeKind.Local).AddTicks(6268));

            migrationBuilder.UpdateData(
                table: "CinemaInfoEntity",
                keyColumn: "CinemaId",
                keyValue: new Guid("22222222-2222-2222-2222-222222222222"),
                column: "UpdatedAt",
                value: new DateTime(2026, 6, 11, 9, 55, 39, 564, DateTimeKind.Local).AddTicks(6273));

            migrationBuilder.UpdateData(
                table: "CinemaInfoEntity",
                keyColumn: "CinemaId",
                keyValue: new Guid("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
                column: "UpdatedAt",
                value: new DateTime(2026, 6, 11, 9, 55, 39, 564, DateTimeKind.Local).AddTicks(6276));

            migrationBuilder.UpdateData(
                table: "MovieInfoEntity",
                keyColumn: "MovieId",
                keyValue: new Guid("66666666-6666-6666-6666-666666666666"),
                column: "UpdatedAt",
                value: new DateTime(2026, 6, 11, 9, 55, 39, 564, DateTimeKind.Local).AddTicks(7198));

            migrationBuilder.UpdateData(
                table: "MovieInfoEntity",
                keyColumn: "MovieId",
                keyValue: new Guid("77777777-7777-7777-7777-777777777777"),
                column: "UpdatedAt",
                value: new DateTime(2026, 6, 11, 9, 55, 39, 564, DateTimeKind.Local).AddTicks(7223));

            migrationBuilder.UpdateData(
                table: "MovieInfoEntity",
                keyColumn: "MovieId",
                keyValue: new Guid("88888888-8888-8888-8888-888888888888"),
                column: "UpdatedAt",
                value: new DateTime(2026, 6, 11, 9, 55, 39, 564, DateTimeKind.Local).AddTicks(7228));

            migrationBuilder.InsertData(
                table: "MovieScheduleInfoEntity",
                columns: new[] { "MovieScheduleInfoId", "ActiveAt", "AuditoriumId", "CreatedAt", "CreatedByUserId", "DeletedAt", "DeletedByUserId", "EndedTime", "IsActive", "IsDeleted", "MovieFormatId", "MovieId", "StartTime", "UpdatedAt", "UpdatedByUserId" },
                values: new object[,]
                {
                    { new Guid("1eabe182-919b-4706-ba80-36ace316a932"), new DateTime(2026, 3, 19, 19, 0, 0, 0, DateTimeKind.Unspecified), new Guid("33333333-3333-3333-3333-333333333333"), new DateTime(2026, 6, 11, 9, 55, 39, 564, DateTimeKind.Local).AddTicks(7341), new Guid("7b5d2c1e-9f8a-3e7b-c1d2-a0e9f8c7b6a5"), null, null, new DateTime(2026, 3, 19, 21, 56, 0, 0, DateTimeKind.Unspecified), true, false, new Guid("3fbc4a32-15f5-47e0-b98a-784f1b8a9612"), new Guid("66666666-6666-6666-6666-666666666666"), new DateTime(2026, 3, 19, 19, 0, 0, 0, DateTimeKind.Unspecified), new DateTime(2026, 6, 11, 9, 55, 39, 564, DateTimeKind.Local).AddTicks(7342), null },
                    { new Guid("b3af67cc-d579-4416-9fbe-5ac202d26ec8"), new DateTime(2026, 3, 19, 20, 0, 0, 0, DateTimeKind.Unspecified), new Guid("44444444-4444-4444-4444-444444444444"), new DateTime(2026, 6, 11, 9, 55, 39, 564, DateTimeKind.Local).AddTicks(7375), new Guid("e4e1f7d8-c3b2-4a90-8c67-2f5a1b3d9e0c"), null, null, new DateTime(2026, 3, 19, 23, 0, 0, 0, DateTimeKind.Unspecified), true, false, new Guid("d29b0f1c-8e2a-4c5b-bc3d-1a2f3e4d5c6b"), new Guid("77777777-7777-7777-7777-777777777777"), new DateTime(2026, 3, 19, 20, 0, 0, 0, DateTimeKind.Unspecified), new DateTime(2026, 6, 11, 9, 55, 39, 564, DateTimeKind.Local).AddTicks(7376), null }
                });

            migrationBuilder.UpdateData(
                table: "UserInfoEntity",
                keyColumn: "UserId",
                keyValue: new Guid("7b5d2c1e-9f8a-3e7b-c1d2-a0e9f8c7b6a5"),
                column: "RewardPoints",
                value: 0L);

            migrationBuilder.UpdateData(
                table: "UserInfoEntity",
                keyColumn: "UserId",
                keyValue: new Guid("b2c3d4e5-f6a7-8b9c-d0e1-f2a3b4c5d6e7"),
                column: "RewardPoints",
                value: 0L);

            migrationBuilder.UpdateData(
                table: "UserInfoEntity",
                keyColumn: "UserId",
                keyValue: new Guid("e4e1f7d8-c3b2-4a90-8c67-2f5a1b3d9e0c"),
                column: "RewardPoints",
                value: 0L);

            migrationBuilder.UpdateData(
                table: "UserInfoEntity",
                keyColumn: "UserId",
                keyValue: new Guid("f1a0e9b8-d7c6-5e4f-a3b2-1d0c9b8a7f6e"),
                column: "RewardPoints",
                value: 0L);



            migrationBuilder.CreateIndex(
                name: "IX_UserVoucherEntity_UserId",
                table: "UserVoucherEntity",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_UserVoucherEntity_VoucherId",
                table: "UserVoucherEntity",
                column: "VoucherId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {


            migrationBuilder.DropTable(
                name: "UserVoucherEntity");

            migrationBuilder.DeleteData(
                table: "MovieScheduleInfoEntity",
                keyColumn: "MovieScheduleInfoId",
                keyValue: new Guid("1eabe182-919b-4706-ba80-36ace316a932"));

            migrationBuilder.DeleteData(
                table: "MovieScheduleInfoEntity",
                keyColumn: "MovieScheduleInfoId",
                keyValue: new Guid("b3af67cc-d579-4416-9fbe-5ac202d26ec8"));

            migrationBuilder.DropColumn(
                name: "RemainingQuantity",
                table: "VoucherInfoEntity");

            migrationBuilder.DropColumn(
                name: "ValidFrom",
                table: "VoucherInfoEntity");

            migrationBuilder.DropColumn(
                name: "ValidTo",
                table: "VoucherInfoEntity");

            migrationBuilder.DropColumn(
                name: "VoucherPointsCost",
                table: "VoucherInfoEntity");

            migrationBuilder.DropColumn(
                name: "VoucherQuantity",
                table: "VoucherInfoEntity");

            migrationBuilder.DropColumn(
                name: "RewardPoints",
                table: "UserInfoEntity");

            migrationBuilder.UpdateData(
                table: "AuditoriumInfoEntities",
                keyColumn: "AuditoriumId",
                keyValue: new Guid("33333333-3333-3333-3333-333333333333"),
                column: "UpdatedAt",
                value: new DateTime(2026, 4, 5, 13, 10, 25, 63, DateTimeKind.Local).AddTicks(1282));

            migrationBuilder.UpdateData(
                table: "AuditoriumInfoEntities",
                keyColumn: "AuditoriumId",
                keyValue: new Guid("44444444-4444-4444-4444-444444444444"),
                column: "UpdatedAt",
                value: new DateTime(2026, 4, 5, 13, 10, 25, 63, DateTimeKind.Local).AddTicks(1287));

            migrationBuilder.UpdateData(
                table: "AuditoriumInfoEntities",
                keyColumn: "AuditoriumId",
                keyValue: new Guid("55555555-5555-5555-5555-555555555555"),
                column: "UpdatedAt",
                value: new DateTime(2026, 4, 5, 13, 10, 25, 63, DateTimeKind.Local).AddTicks(1290));

            migrationBuilder.UpdateData(
                table: "CinemaInfoEntity",
                keyColumn: "CinemaId",
                keyValue: new Guid("11111111-1111-1111-1111-111111111111"),
                column: "UpdatedAt",
                value: new DateTime(2026, 4, 5, 13, 10, 25, 63, DateTimeKind.Local).AddTicks(1204));

            migrationBuilder.UpdateData(
                table: "CinemaInfoEntity",
                keyColumn: "CinemaId",
                keyValue: new Guid("22222222-2222-2222-2222-222222222222"),
                column: "UpdatedAt",
                value: new DateTime(2026, 4, 5, 13, 10, 25, 63, DateTimeKind.Local).AddTicks(1210));

            migrationBuilder.UpdateData(
                table: "CinemaInfoEntity",
                keyColumn: "CinemaId",
                keyValue: new Guid("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
                column: "UpdatedAt",
                value: new DateTime(2026, 4, 5, 13, 10, 25, 63, DateTimeKind.Local).AddTicks(1215));

            migrationBuilder.UpdateData(
                table: "MovieInfoEntity",
                keyColumn: "MovieId",
                keyValue: new Guid("66666666-6666-6666-6666-666666666666"),
                column: "UpdatedAt",
                value: new DateTime(2026, 4, 5, 13, 10, 25, 63, DateTimeKind.Local).AddTicks(2490));

            migrationBuilder.UpdateData(
                table: "MovieInfoEntity",
                keyColumn: "MovieId",
                keyValue: new Guid("77777777-7777-7777-7777-777777777777"),
                column: "UpdatedAt",
                value: new DateTime(2026, 4, 5, 13, 10, 25, 63, DateTimeKind.Local).AddTicks(2520));

            migrationBuilder.UpdateData(
                table: "MovieInfoEntity",
                keyColumn: "MovieId",
                keyValue: new Guid("88888888-8888-8888-8888-888888888888"),
                column: "UpdatedAt",
                value: new DateTime(2026, 4, 5, 13, 10, 25, 63, DateTimeKind.Local).AddTicks(2524));

            migrationBuilder.InsertData(
                table: "MovieScheduleInfoEntity",
                columns: new[] { "MovieScheduleInfoId", "ActiveAt", "AuditoriumId", "CreatedAt", "CreatedByUserId", "DeletedAt", "DeletedByUserId", "EndedTime", "IsActive", "IsDeleted", "MovieFormatId", "MovieId", "StartTime", "UpdatedAt", "UpdatedByUserId" },
                values: new object[,]
                {
                    { new Guid("32a9ef22-5211-4641-a024-7deab5cf520b"), new DateTime(2026, 3, 19, 19, 0, 0, 0, DateTimeKind.Unspecified), new Guid("33333333-3333-3333-3333-333333333333"), new DateTime(2026, 4, 5, 13, 10, 25, 63, DateTimeKind.Local).AddTicks(2686), new Guid("7b5d2c1e-9f8a-3e7b-c1d2-a0e9f8c7b6a5"), null, null, new DateTime(2026, 3, 19, 21, 56, 0, 0, DateTimeKind.Unspecified), true, false, new Guid("3fbc4a32-15f5-47e0-b98a-784f1b8a9612"), new Guid("66666666-6666-6666-6666-666666666666"), new DateTime(2026, 3, 19, 19, 0, 0, 0, DateTimeKind.Unspecified), new DateTime(2026, 4, 5, 13, 10, 25, 63, DateTimeKind.Local).AddTicks(2687), null },
                    { new Guid("aa3a1cc3-a6d6-49ad-ba0c-1b382e6ed5c5"), new DateTime(2026, 3, 19, 20, 0, 0, 0, DateTimeKind.Unspecified), new Guid("44444444-4444-4444-4444-444444444444"), new DateTime(2026, 4, 5, 13, 10, 25, 63, DateTimeKind.Local).AddTicks(2718), new Guid("e4e1f7d8-c3b2-4a90-8c67-2f5a1b3d9e0c"), null, null, new DateTime(2026, 3, 19, 23, 0, 0, 0, DateTimeKind.Unspecified), true, false, new Guid("d29b0f1c-8e2a-4c5b-bc3d-1a2f3e4d5c6b"), new Guid("77777777-7777-7777-7777-777777777777"), new DateTime(2026, 3, 19, 20, 0, 0, 0, DateTimeKind.Unspecified), new DateTime(2026, 4, 5, 13, 10, 25, 63, DateTimeKind.Local).AddTicks(2719), null }
                });
        }
    }
}
