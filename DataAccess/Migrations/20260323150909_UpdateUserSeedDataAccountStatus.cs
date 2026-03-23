using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace DataAccess.Migrations
{
    /// <inheritdoc />
    public partial class UpdateUserSeedDataAccountStatus : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "MovieScheduleInfoEntity",
                keyColumn: "MovieScheduleInfoId",
                keyValue: new Guid("43f2b23d-0d1a-4bf9-827d-d7956151d8ac"));

            migrationBuilder.DeleteData(
                table: "MovieScheduleInfoEntity",
                keyColumn: "MovieScheduleInfoId",
                keyValue: new Guid("8131e3ed-ebe2-47d9-b5f6-b8411257b950"));

            migrationBuilder.UpdateData(
                table: "AuditoriumInfoEntities",
                keyColumn: "AuditoriumId",
                keyValue: new Guid("33333333-3333-3333-3333-333333333333"),
                column: "UpdatedAt",
                value: new DateTime(2026, 3, 23, 22, 9, 5, 161, DateTimeKind.Local).AddTicks(2246));

            migrationBuilder.UpdateData(
                table: "AuditoriumInfoEntities",
                keyColumn: "AuditoriumId",
                keyValue: new Guid("44444444-4444-4444-4444-444444444444"),
                column: "UpdatedAt",
                value: new DateTime(2026, 3, 23, 22, 9, 5, 161, DateTimeKind.Local).AddTicks(2251));

            migrationBuilder.UpdateData(
                table: "AuditoriumInfoEntities",
                keyColumn: "AuditoriumId",
                keyValue: new Guid("55555555-5555-5555-5555-555555555555"),
                column: "UpdatedAt",
                value: new DateTime(2026, 3, 23, 22, 9, 5, 161, DateTimeKind.Local).AddTicks(2351));

            migrationBuilder.UpdateData(
                table: "CinemaInfoEntity",
                keyColumn: "CinemaId",
                keyValue: new Guid("11111111-1111-1111-1111-111111111111"),
                column: "UpdatedAt",
                value: new DateTime(2026, 3, 23, 22, 9, 5, 161, DateTimeKind.Local).AddTicks(2169));

            migrationBuilder.UpdateData(
                table: "CinemaInfoEntity",
                keyColumn: "CinemaId",
                keyValue: new Guid("22222222-2222-2222-2222-222222222222"),
                column: "UpdatedAt",
                value: new DateTime(2026, 3, 23, 22, 9, 5, 161, DateTimeKind.Local).AddTicks(2181));

            migrationBuilder.UpdateData(
                table: "CinemaInfoEntity",
                keyColumn: "CinemaId",
                keyValue: new Guid("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
                column: "UpdatedAt",
                value: new DateTime(2026, 3, 23, 22, 9, 5, 161, DateTimeKind.Local).AddTicks(2185));

            migrationBuilder.UpdateData(
                table: "MovieInfoEntity",
                keyColumn: "MovieId",
                keyValue: new Guid("66666666-6666-6666-6666-666666666666"),
                column: "UpdatedAt",
                value: new DateTime(2026, 3, 23, 22, 9, 5, 161, DateTimeKind.Local).AddTicks(3979));

            migrationBuilder.UpdateData(
                table: "MovieInfoEntity",
                keyColumn: "MovieId",
                keyValue: new Guid("77777777-7777-7777-7777-777777777777"),
                column: "UpdatedAt",
                value: new DateTime(2026, 3, 23, 22, 9, 5, 161, DateTimeKind.Local).AddTicks(4020));

            migrationBuilder.UpdateData(
                table: "MovieInfoEntity",
                keyColumn: "MovieId",
                keyValue: new Guid("88888888-8888-8888-8888-888888888888"),
                column: "UpdatedAt",
                value: new DateTime(2026, 3, 23, 22, 9, 5, 161, DateTimeKind.Local).AddTicks(4026));

            migrationBuilder.InsertData(
                table: "MovieScheduleInfoEntity",
                columns: new[] { "MovieScheduleInfoId", "ActiveAt", "AuditoriumId", "CreatedAt", "CreatedByUserId", "DeletedAt", "DeletedByUserId", "EndedTime", "IsActive", "IsDeleted", "MovieFormatId", "MovieId", "StartTime", "UpdatedAt", "UpdatedByUserId" },
                values: new object[,]
                {
                    { new Guid("4085e6e5-5fb5-4f99-a8ec-4ca0ad356ea2"), new DateTime(2026, 3, 19, 19, 0, 0, 0, DateTimeKind.Unspecified), new Guid("33333333-3333-3333-3333-333333333333"), new DateTime(2026, 3, 23, 22, 9, 5, 161, DateTimeKind.Local).AddTicks(4154), new Guid("7b5d2c1e-9f8a-3e7b-c1d2-a0e9f8c7b6a5"), null, null, new DateTime(2026, 3, 19, 21, 56, 0, 0, DateTimeKind.Unspecified), true, false, new Guid("3fbc4a32-15f5-47e0-b98a-784f1b8a9612"), new Guid("66666666-6666-6666-6666-666666666666"), new DateTime(2026, 3, 19, 19, 0, 0, 0, DateTimeKind.Unspecified), new DateTime(2026, 3, 23, 22, 9, 5, 161, DateTimeKind.Local).AddTicks(4155), null },
                    { new Guid("b9dc5c43-a725-46cb-8bda-1db95444d1a5"), new DateTime(2026, 3, 19, 20, 0, 0, 0, DateTimeKind.Unspecified), new Guid("44444444-4444-4444-4444-444444444444"), new DateTime(2026, 3, 23, 22, 9, 5, 161, DateTimeKind.Local).AddTicks(4293), new Guid("e4e1f7d8-c3b2-4a90-8c67-2f5a1b3d9e0c"), null, null, new DateTime(2026, 3, 19, 23, 0, 0, 0, DateTimeKind.Unspecified), true, false, new Guid("d29b0f1c-8e2a-4c5b-bc3d-1a2f3e4d5c6b"), new Guid("77777777-7777-7777-7777-777777777777"), new DateTime(2026, 3, 19, 20, 0, 0, 0, DateTimeKind.Unspecified), new DateTime(2026, 3, 23, 22, 9, 5, 161, DateTimeKind.Local).AddTicks(4294), null }
                });

            migrationBuilder.UpdateData(
                table: "UserInfoEntity",
                keyColumn: "UserId",
                keyValue: new Guid("7b5d2c1e-9f8a-3e7b-c1d2-a0e9f8c7b6a5"),
                column: "AccountStatus",
                value: 1);

            migrationBuilder.UpdateData(
                table: "UserInfoEntity",
                keyColumn: "UserId",
                keyValue: new Guid("b2c3d4e5-f6a7-8b9c-d0e1-f2a3b4c5d6e7"),
                column: "AccountStatus",
                value: 1);

            migrationBuilder.UpdateData(
                table: "UserInfoEntity",
                keyColumn: "UserId",
                keyValue: new Guid("e4e1f7d8-c3b2-4a90-8c67-2f5a1b3d9e0c"),
                column: "AccountStatus",
                value: 1);

            migrationBuilder.UpdateData(
                table: "UserInfoEntity",
                keyColumn: "UserId",
                keyValue: new Guid("f1a0e9b8-d7c6-5e4f-a3b2-1d0c9b8a7f6e"),
                column: "AccountStatus",
                value: 1);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "MovieScheduleInfoEntity",
                keyColumn: "MovieScheduleInfoId",
                keyValue: new Guid("4085e6e5-5fb5-4f99-a8ec-4ca0ad356ea2"));

            migrationBuilder.DeleteData(
                table: "MovieScheduleInfoEntity",
                keyColumn: "MovieScheduleInfoId",
                keyValue: new Guid("b9dc5c43-a725-46cb-8bda-1db95444d1a5"));

            migrationBuilder.UpdateData(
                table: "AuditoriumInfoEntities",
                keyColumn: "AuditoriumId",
                keyValue: new Guid("33333333-3333-3333-3333-333333333333"),
                column: "UpdatedAt",
                value: new DateTime(2026, 3, 18, 10, 8, 19, 611, DateTimeKind.Local).AddTicks(3566));

            migrationBuilder.UpdateData(
                table: "AuditoriumInfoEntities",
                keyColumn: "AuditoriumId",
                keyValue: new Guid("44444444-4444-4444-4444-444444444444"),
                column: "UpdatedAt",
                value: new DateTime(2026, 3, 18, 10, 8, 19, 611, DateTimeKind.Local).AddTicks(3569));

            migrationBuilder.UpdateData(
                table: "AuditoriumInfoEntities",
                keyColumn: "AuditoriumId",
                keyValue: new Guid("55555555-5555-5555-5555-555555555555"),
                column: "UpdatedAt",
                value: new DateTime(2026, 3, 18, 10, 8, 19, 611, DateTimeKind.Local).AddTicks(3571));

            migrationBuilder.UpdateData(
                table: "CinemaInfoEntity",
                keyColumn: "CinemaId",
                keyValue: new Guid("11111111-1111-1111-1111-111111111111"),
                column: "UpdatedAt",
                value: new DateTime(2026, 3, 18, 10, 8, 19, 611, DateTimeKind.Local).AddTicks(3518));

            migrationBuilder.UpdateData(
                table: "CinemaInfoEntity",
                keyColumn: "CinemaId",
                keyValue: new Guid("22222222-2222-2222-2222-222222222222"),
                column: "UpdatedAt",
                value: new DateTime(2026, 3, 18, 10, 8, 19, 611, DateTimeKind.Local).AddTicks(3523));

            migrationBuilder.UpdateData(
                table: "CinemaInfoEntity",
                keyColumn: "CinemaId",
                keyValue: new Guid("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
                column: "UpdatedAt",
                value: new DateTime(2026, 3, 18, 10, 8, 19, 611, DateTimeKind.Local).AddTicks(3526));

            migrationBuilder.UpdateData(
                table: "MovieInfoEntity",
                keyColumn: "MovieId",
                keyValue: new Guid("66666666-6666-6666-6666-666666666666"),
                column: "UpdatedAt",
                value: new DateTime(2026, 3, 18, 10, 8, 19, 611, DateTimeKind.Local).AddTicks(4471));

            migrationBuilder.UpdateData(
                table: "MovieInfoEntity",
                keyColumn: "MovieId",
                keyValue: new Guid("77777777-7777-7777-7777-777777777777"),
                column: "UpdatedAt",
                value: new DateTime(2026, 3, 18, 10, 8, 19, 611, DateTimeKind.Local).AddTicks(4500));

            migrationBuilder.UpdateData(
                table: "MovieInfoEntity",
                keyColumn: "MovieId",
                keyValue: new Guid("88888888-8888-8888-8888-888888888888"),
                column: "UpdatedAt",
                value: new DateTime(2026, 3, 18, 10, 8, 19, 611, DateTimeKind.Local).AddTicks(4504));

            migrationBuilder.InsertData(
                table: "MovieScheduleInfoEntity",
                columns: new[] { "MovieScheduleInfoId", "ActiveAt", "AuditoriumId", "CreatedAt", "CreatedByUserId", "DeletedAt", "DeletedByUserId", "EndedTime", "IsActive", "IsDeleted", "MovieFormatId", "MovieId", "StartTime", "UpdatedAt", "UpdatedByUserId" },
                values: new object[,]
                {
                    { new Guid("43f2b23d-0d1a-4bf9-827d-d7956151d8ac"), new DateTime(2026, 3, 19, 20, 0, 0, 0, DateTimeKind.Unspecified), new Guid("44444444-4444-4444-4444-444444444444"), new DateTime(2026, 3, 18, 10, 8, 19, 611, DateTimeKind.Local).AddTicks(4660), new Guid("e4e1f7d8-c3b2-4a90-8c67-2f5a1b3d9e0c"), null, null, new DateTime(2026, 3, 19, 23, 0, 0, 0, DateTimeKind.Unspecified), true, false, new Guid("d29b0f1c-8e2a-4c5b-bc3d-1a2f3e4d5c6b"), new Guid("77777777-7777-7777-7777-777777777777"), new DateTime(2026, 3, 19, 20, 0, 0, 0, DateTimeKind.Unspecified), new DateTime(2026, 3, 18, 10, 8, 19, 611, DateTimeKind.Local).AddTicks(4661), null },
                    { new Guid("8131e3ed-ebe2-47d9-b5f6-b8411257b950"), new DateTime(2026, 3, 19, 19, 0, 0, 0, DateTimeKind.Unspecified), new Guid("33333333-3333-3333-3333-333333333333"), new DateTime(2026, 3, 18, 10, 8, 19, 611, DateTimeKind.Local).AddTicks(4579), new Guid("7b5d2c1e-9f8a-3e7b-c1d2-a0e9f8c7b6a5"), null, null, new DateTime(2026, 3, 19, 21, 56, 0, 0, DateTimeKind.Unspecified), true, false, new Guid("3fbc4a32-15f5-47e0-b98a-784f1b8a9612"), new Guid("66666666-6666-6666-6666-666666666666"), new DateTime(2026, 3, 19, 19, 0, 0, 0, DateTimeKind.Unspecified), new DateTime(2026, 3, 18, 10, 8, 19, 611, DateTimeKind.Local).AddTicks(4580), null }
                });

            migrationBuilder.UpdateData(
                table: "UserInfoEntity",
                keyColumn: "UserId",
                keyValue: new Guid("7b5d2c1e-9f8a-3e7b-c1d2-a0e9f8c7b6a5"),
                column: "AccountStatus",
                value: 0);

            migrationBuilder.UpdateData(
                table: "UserInfoEntity",
                keyColumn: "UserId",
                keyValue: new Guid("b2c3d4e5-f6a7-8b9c-d0e1-f2a3b4c5d6e7"),
                column: "AccountStatus",
                value: 0);

            migrationBuilder.UpdateData(
                table: "UserInfoEntity",
                keyColumn: "UserId",
                keyValue: new Guid("e4e1f7d8-c3b2-4a90-8c67-2f5a1b3d9e0c"),
                column: "AccountStatus",
                value: 0);

            migrationBuilder.UpdateData(
                table: "UserInfoEntity",
                keyColumn: "UserId",
                keyValue: new Guid("f1a0e9b8-d7c6-5e4f-a3b2-1d0c9b8a7f6e"),
                column: "AccountStatus",
                value: 0);
        }
    }
}
