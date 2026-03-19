using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace DataAccess.Migrations
{
    /// <inheritdoc />
    public partial class add_new_col : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "MovieScheduleInfoEntity",
                keyColumn: "MovieScheduleInfoId",
                keyValue: new Guid("b9d5eb84-478a-4dfe-a914-24fe302f7477"));

            migrationBuilder.DeleteData(
                table: "MovieScheduleInfoEntity",
                keyColumn: "MovieScheduleInfoId",
                keyValue: new Guid("eb69c94e-936e-4fc9-acb4-a68720ec1fac"));

            migrationBuilder.AddColumn<Guid>(
                name: "UserSegmentId",
                table: "OrderDetailsInfoEntity",
                type: "uniqueidentifier",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

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

            migrationBuilder.CreateIndex(
                name: "IX_OrderDetailsInfoEntity_UserSegmentId",
                table: "OrderDetailsInfoEntity",
                column: "UserSegmentId");

            migrationBuilder.AddForeignKey(
                name: "FK_OrderDetailsInfoEntity_UserSegmentsInfoEntity_UserSegmentId",
                table: "OrderDetailsInfoEntity",
                column: "UserSegmentId",
                principalTable: "UserSegmentsInfoEntity",
                principalColumn: "UserSegmentId",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_OrderDetailsInfoEntity_UserSegmentsInfoEntity_UserSegmentId",
                table: "OrderDetailsInfoEntity");

            migrationBuilder.DropIndex(
                name: "IX_OrderDetailsInfoEntity_UserSegmentId",
                table: "OrderDetailsInfoEntity");

            migrationBuilder.DeleteData(
                table: "MovieScheduleInfoEntity",
                keyColumn: "MovieScheduleInfoId",
                keyValue: new Guid("43f2b23d-0d1a-4bf9-827d-d7956151d8ac"));

            migrationBuilder.DeleteData(
                table: "MovieScheduleInfoEntity",
                keyColumn: "MovieScheduleInfoId",
                keyValue: new Guid("8131e3ed-ebe2-47d9-b5f6-b8411257b950"));

            migrationBuilder.DropColumn(
                name: "UserSegmentId",
                table: "OrderDetailsInfoEntity");

            migrationBuilder.UpdateData(
                table: "AuditoriumInfoEntities",
                keyColumn: "AuditoriumId",
                keyValue: new Guid("33333333-3333-3333-3333-333333333333"),
                column: "UpdatedAt",
                value: new DateTime(2026, 3, 18, 1, 43, 55, 759, DateTimeKind.Local).AddTicks(7115));

            migrationBuilder.UpdateData(
                table: "AuditoriumInfoEntities",
                keyColumn: "AuditoriumId",
                keyValue: new Guid("44444444-4444-4444-4444-444444444444"),
                column: "UpdatedAt",
                value: new DateTime(2026, 3, 18, 1, 43, 55, 759, DateTimeKind.Local).AddTicks(7118));

            migrationBuilder.UpdateData(
                table: "AuditoriumInfoEntities",
                keyColumn: "AuditoriumId",
                keyValue: new Guid("55555555-5555-5555-5555-555555555555"),
                column: "UpdatedAt",
                value: new DateTime(2026, 3, 18, 1, 43, 55, 759, DateTimeKind.Local).AddTicks(7121));

            migrationBuilder.UpdateData(
                table: "CinemaInfoEntity",
                keyColumn: "CinemaId",
                keyValue: new Guid("11111111-1111-1111-1111-111111111111"),
                column: "UpdatedAt",
                value: new DateTime(2026, 3, 18, 1, 43, 55, 759, DateTimeKind.Local).AddTicks(7071));

            migrationBuilder.UpdateData(
                table: "CinemaInfoEntity",
                keyColumn: "CinemaId",
                keyValue: new Guid("22222222-2222-2222-2222-222222222222"),
                column: "UpdatedAt",
                value: new DateTime(2026, 3, 18, 1, 43, 55, 759, DateTimeKind.Local).AddTicks(7075));

            migrationBuilder.UpdateData(
                table: "CinemaInfoEntity",
                keyColumn: "CinemaId",
                keyValue: new Guid("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
                column: "UpdatedAt",
                value: new DateTime(2026, 3, 18, 1, 43, 55, 759, DateTimeKind.Local).AddTicks(7078));

            migrationBuilder.UpdateData(
                table: "MovieInfoEntity",
                keyColumn: "MovieId",
                keyValue: new Guid("66666666-6666-6666-6666-666666666666"),
                column: "UpdatedAt",
                value: new DateTime(2026, 3, 18, 1, 43, 55, 759, DateTimeKind.Local).AddTicks(8158));

            migrationBuilder.UpdateData(
                table: "MovieInfoEntity",
                keyColumn: "MovieId",
                keyValue: new Guid("77777777-7777-7777-7777-777777777777"),
                column: "UpdatedAt",
                value: new DateTime(2026, 3, 18, 1, 43, 55, 759, DateTimeKind.Local).AddTicks(8183));

            migrationBuilder.UpdateData(
                table: "MovieInfoEntity",
                keyColumn: "MovieId",
                keyValue: new Guid("88888888-8888-8888-8888-888888888888"),
                column: "UpdatedAt",
                value: new DateTime(2026, 3, 18, 1, 43, 55, 759, DateTimeKind.Local).AddTicks(8187));

            migrationBuilder.InsertData(
                table: "MovieScheduleInfoEntity",
                columns: new[] { "MovieScheduleInfoId", "ActiveAt", "AuditoriumId", "CreatedAt", "CreatedByUserId", "DeletedAt", "DeletedByUserId", "EndedTime", "IsActive", "IsDeleted", "MovieFormatId", "MovieId", "StartTime", "UpdatedAt", "UpdatedByUserId" },
                values: new object[,]
                {
                    { new Guid("b9d5eb84-478a-4dfe-a914-24fe302f7477"), new DateTime(2026, 3, 19, 20, 0, 0, 0, DateTimeKind.Unspecified), new Guid("44444444-4444-4444-4444-444444444444"), new DateTime(2026, 3, 18, 1, 43, 55, 759, DateTimeKind.Local).AddTicks(8310), new Guid("e4e1f7d8-c3b2-4a90-8c67-2f5a1b3d9e0c"), null, null, new DateTime(2026, 3, 19, 23, 0, 0, 0, DateTimeKind.Unspecified), true, false, new Guid("d29b0f1c-8e2a-4c5b-bc3d-1a2f3e4d5c6b"), new Guid("77777777-7777-7777-7777-777777777777"), new DateTime(2026, 3, 19, 20, 0, 0, 0, DateTimeKind.Unspecified), new DateTime(2026, 3, 18, 1, 43, 55, 759, DateTimeKind.Local).AddTicks(8311), null },
                    { new Guid("eb69c94e-936e-4fc9-acb4-a68720ec1fac"), new DateTime(2026, 3, 19, 19, 0, 0, 0, DateTimeKind.Unspecified), new Guid("33333333-3333-3333-3333-333333333333"), new DateTime(2026, 3, 18, 1, 43, 55, 759, DateTimeKind.Local).AddTicks(8275), new Guid("7b5d2c1e-9f8a-3e7b-c1d2-a0e9f8c7b6a5"), null, null, new DateTime(2026, 3, 19, 21, 56, 0, 0, DateTimeKind.Unspecified), true, false, new Guid("3fbc4a32-15f5-47e0-b98a-784f1b8a9612"), new Guid("66666666-6666-6666-6666-666666666666"), new DateTime(2026, 3, 19, 19, 0, 0, 0, DateTimeKind.Unspecified), new DateTime(2026, 3, 18, 1, 43, 55, 759, DateTimeKind.Local).AddTicks(8276), null }
                });
        }
    }
}
