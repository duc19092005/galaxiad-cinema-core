using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace DataAccess.Migrations
{
    /// <inheritdoc />
    public partial class UpdateRefreshTokenColumnLength : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "MovieScheduleInfoEntity",
                keyColumn: "MovieScheduleInfoId",
                keyValue: new Guid("4bd1d1ce-b458-41ea-ba86-51c98b210309"));

            migrationBuilder.DeleteData(
                table: "MovieScheduleInfoEntity",
                keyColumn: "MovieScheduleInfoId",
                keyValue: new Guid("5d54c117-7b08-4587-a159-f70e4f35e4b5"));

            migrationBuilder.AlterColumn<string>(
                name: "RefreshToken",
                table: "UserInfoEntity",
                type: "varchar(500)",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "varchar(100)",
                oldNullable: true);

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

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "MovieScheduleInfoEntity",
                keyColumn: "MovieScheduleInfoId",
                keyValue: new Guid("32a9ef22-5211-4641-a024-7deab5cf520b"));

            migrationBuilder.DeleteData(
                table: "MovieScheduleInfoEntity",
                keyColumn: "MovieScheduleInfoId",
                keyValue: new Guid("aa3a1cc3-a6d6-49ad-ba0c-1b382e6ed5c5"));

            migrationBuilder.AlterColumn<string>(
                name: "RefreshToken",
                table: "UserInfoEntity",
                type: "varchar(100)",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "varchar(500)",
                oldNullable: true);

            migrationBuilder.UpdateData(
                table: "AuditoriumInfoEntities",
                keyColumn: "AuditoriumId",
                keyValue: new Guid("33333333-3333-3333-3333-333333333333"),
                column: "UpdatedAt",
                value: new DateTime(2026, 4, 4, 18, 50, 16, 59, DateTimeKind.Local).AddTicks(4216));

            migrationBuilder.UpdateData(
                table: "AuditoriumInfoEntities",
                keyColumn: "AuditoriumId",
                keyValue: new Guid("44444444-4444-4444-4444-444444444444"),
                column: "UpdatedAt",
                value: new DateTime(2026, 4, 4, 18, 50, 16, 59, DateTimeKind.Local).AddTicks(4218));

            migrationBuilder.UpdateData(
                table: "AuditoriumInfoEntities",
                keyColumn: "AuditoriumId",
                keyValue: new Guid("55555555-5555-5555-5555-555555555555"),
                column: "UpdatedAt",
                value: new DateTime(2026, 4, 4, 18, 50, 16, 59, DateTimeKind.Local).AddTicks(4221));

            migrationBuilder.UpdateData(
                table: "CinemaInfoEntity",
                keyColumn: "CinemaId",
                keyValue: new Guid("11111111-1111-1111-1111-111111111111"),
                column: "UpdatedAt",
                value: new DateTime(2026, 4, 4, 18, 50, 16, 59, DateTimeKind.Local).AddTicks(4167));

            migrationBuilder.UpdateData(
                table: "CinemaInfoEntity",
                keyColumn: "CinemaId",
                keyValue: new Guid("22222222-2222-2222-2222-222222222222"),
                column: "UpdatedAt",
                value: new DateTime(2026, 4, 4, 18, 50, 16, 59, DateTimeKind.Local).AddTicks(4172));

            migrationBuilder.UpdateData(
                table: "CinemaInfoEntity",
                keyColumn: "CinemaId",
                keyValue: new Guid("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
                column: "UpdatedAt",
                value: new DateTime(2026, 4, 4, 18, 50, 16, 59, DateTimeKind.Local).AddTicks(4175));

            migrationBuilder.UpdateData(
                table: "MovieInfoEntity",
                keyColumn: "MovieId",
                keyValue: new Guid("66666666-6666-6666-6666-666666666666"),
                column: "UpdatedAt",
                value: new DateTime(2026, 4, 4, 18, 50, 16, 59, DateTimeKind.Local).AddTicks(5088));

            migrationBuilder.UpdateData(
                table: "MovieInfoEntity",
                keyColumn: "MovieId",
                keyValue: new Guid("77777777-7777-7777-7777-777777777777"),
                column: "UpdatedAt",
                value: new DateTime(2026, 4, 4, 18, 50, 16, 59, DateTimeKind.Local).AddTicks(5118));

            migrationBuilder.UpdateData(
                table: "MovieInfoEntity",
                keyColumn: "MovieId",
                keyValue: new Guid("88888888-8888-8888-8888-888888888888"),
                column: "UpdatedAt",
                value: new DateTime(2026, 4, 4, 18, 50, 16, 59, DateTimeKind.Local).AddTicks(5122));

            migrationBuilder.InsertData(
                table: "MovieScheduleInfoEntity",
                columns: new[] { "MovieScheduleInfoId", "ActiveAt", "AuditoriumId", "CreatedAt", "CreatedByUserId", "DeletedAt", "DeletedByUserId", "EndedTime", "IsActive", "IsDeleted", "MovieFormatId", "MovieId", "StartTime", "UpdatedAt", "UpdatedByUserId" },
                values: new object[,]
                {
                    { new Guid("4bd1d1ce-b458-41ea-ba86-51c98b210309"), new DateTime(2026, 3, 19, 19, 0, 0, 0, DateTimeKind.Unspecified), new Guid("33333333-3333-3333-3333-333333333333"), new DateTime(2026, 4, 4, 18, 50, 16, 59, DateTimeKind.Local).AddTicks(5258), new Guid("7b5d2c1e-9f8a-3e7b-c1d2-a0e9f8c7b6a5"), null, null, new DateTime(2026, 3, 19, 21, 56, 0, 0, DateTimeKind.Unspecified), true, false, new Guid("3fbc4a32-15f5-47e0-b98a-784f1b8a9612"), new Guid("66666666-6666-6666-6666-666666666666"), new DateTime(2026, 3, 19, 19, 0, 0, 0, DateTimeKind.Unspecified), new DateTime(2026, 4, 4, 18, 50, 16, 59, DateTimeKind.Local).AddTicks(5259), null },
                    { new Guid("5d54c117-7b08-4587-a159-f70e4f35e4b5"), new DateTime(2026, 3, 19, 20, 0, 0, 0, DateTimeKind.Unspecified), new Guid("44444444-4444-4444-4444-444444444444"), new DateTime(2026, 4, 4, 18, 50, 16, 59, DateTimeKind.Local).AddTicks(5295), new Guid("e4e1f7d8-c3b2-4a90-8c67-2f5a1b3d9e0c"), null, null, new DateTime(2026, 3, 19, 23, 0, 0, 0, DateTimeKind.Unspecified), true, false, new Guid("d29b0f1c-8e2a-4c5b-bc3d-1a2f3e4d5c6b"), new Guid("77777777-7777-7777-7777-777777777777"), new DateTime(2026, 3, 19, 20, 0, 0, 0, DateTimeKind.Unspecified), new DateTime(2026, 4, 4, 18, 50, 16, 59, DateTimeKind.Local).AddTicks(5295), null }
                });
        }
    }
}
