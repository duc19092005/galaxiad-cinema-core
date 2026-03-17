using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace DataAccess.Migrations
{
    /// <inheritdoc />
    public partial class RefactorManagerIdsAndSeedProfessionalData : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Tạm thời disable constraints để dọn dẹp và seed lại từ đầu chuyên nghiệp
            migrationBuilder.Sql("EXEC sp_MSforeachtable 'ALTER TABLE ? NOCHECK CONSTRAINT ALL'");

            // Xóa sạch dữ liệu cũ liên quan đến Cinema/Movie để tránh xung đột
            migrationBuilder.Sql("DELETE FROM [OrderDetailsInfoEntity]");
            migrationBuilder.Sql("DELETE FROM [OrderInfoEntity]");
            migrationBuilder.Sql("DELETE FROM [MovieScheduleInfoEntity]");
            migrationBuilder.Sql("DELETE FROM [SeatsInfoEntity]");
            migrationBuilder.Sql("DELETE FROM [AuditoriumFormatInfosEntity]");
            migrationBuilder.Sql("DELETE FROM [AuditoriumInfoEntities]");
            migrationBuilder.Sql("DELETE FROM [CinemaDiscountInfoEntity]");
            migrationBuilder.Sql("DELETE FROM [CinemaSurchargeInfosEntity]");
            migrationBuilder.Sql("DELETE FROM [CinemaInfoEntity]");
            migrationBuilder.Sql("DELETE FROM [MovieGenreMovieInfoEntity]");
            migrationBuilder.Sql("DELETE FROM [MovieFormatMovieInfoEntity]");
            migrationBuilder.Sql("DELETE FROM [MovieFormatInfoEntity]");
            migrationBuilder.Sql("DELETE FROM [MovieInfoEntity]");
            migrationBuilder.Sql("DELETE FROM [UserRoleInfoEntity]");

            migrationBuilder.DropForeignKey(
                name: "FK_CinemaInfoEntity_UserInfoEntity_ManagerId",
                table: "CinemaInfoEntity");

            migrationBuilder.DropForeignKey(
                name: "FK_MovieInfoEntity_UserInfoEntity_ManagerId",
                table: "MovieInfoEntity");

            migrationBuilder.DropIndex(
                name: "IX_MovieInfoEntity_ManagerId",
                table: "MovieInfoEntity");

            migrationBuilder.DropIndex(
                name: "IX_CinemaInfoEntity_ManagerId",
                table: "CinemaInfoEntity");

            migrationBuilder.DeleteData(
                table: "MovieFormatMovieInfoEntity",
                keyColumns: new[] { "FormatId", "MovieId" },
                keyValues: new object[] { new Guid("d29b0f1c-8e2a-4c5b-bc3d-1a2f3e4d5c6b"), new Guid("66666666-6666-6666-6666-666666666666") });

            migrationBuilder.DeleteData(
                table: "MovieFormatMovieInfoEntity",
                keyColumns: new[] { "FormatId", "MovieId" },
                keyValues: new object[] { new Guid("3fbc4a32-15f5-47e0-b98a-784f1b8a9612"), new Guid("77777777-7777-7777-7777-777777777777") });

            migrationBuilder.DeleteData(
                table: "MovieFormatMovieInfoEntity",
                keyColumns: new[] { "FormatId", "MovieId" },
                keyValues: new object[] { new Guid("7a5e82b1-c4d3-4a92-9e11-3f4b52c1a8d9"), new Guid("77777777-7777-7777-7777-777777777777") });

            migrationBuilder.DeleteData(
                table: "MovieGenreMovieInfoEntity",
                keyColumns: new[] { "MovieGenreId", "MovieId" },
                keyValues: new object[] { new Guid("a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d"), new Guid("77777777-7777-7777-7777-777777777777") });

            migrationBuilder.DeleteData(
                table: "MovieGenreMovieInfoEntity",
                keyColumns: new[] { "MovieGenreId", "MovieId" },
                keyValues: new object[] { new Guid("d4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f8a"), new Guid("66666666-6666-6666-6666-666666666666") });

            migrationBuilder.DeleteData(
                table: "MovieGenreMovieInfoEntity",
                keyColumns: new[] { "MovieGenreId", "MovieId" },
                keyValues: new object[] { new Guid("f6a7b8c9-d0e1-4f2a-3b4c-5d6e7f8a9b0c"), new Guid("77777777-7777-7777-7777-777777777777") });

            migrationBuilder.DeleteData(
                table: "MovieScheduleInfoEntity",
                keyColumn: "MovieScheduleInfoId",
                keyValue: new Guid("00000000-0000-0000-0000-000000000001"));

            migrationBuilder.DeleteData(
                table: "MovieScheduleInfoEntity",
                keyColumn: "MovieScheduleInfoId",
                keyValue: new Guid("00000000-0000-0000-0000-000000000002"));

            migrationBuilder.DeleteData(
                table: "MovieScheduleInfoEntity",
                keyColumn: "MovieScheduleInfoId",
                keyValue: new Guid("00000000-0000-0000-0000-000000000003"));

            migrationBuilder.DeleteData(
                table: "MovieScheduleInfoEntity",
                keyColumn: "MovieScheduleInfoId",
                keyValue: new Guid("00000000-0000-0000-0000-000000000004"));

            migrationBuilder.DeleteData(
                table: "MovieScheduleInfoEntity",
                keyColumn: "MovieScheduleInfoId",
                keyValue: new Guid("00000001-0000-0000-0000-000000000001"));

            migrationBuilder.DeleteData(
                table: "MovieScheduleInfoEntity",
                keyColumn: "MovieScheduleInfoId",
                keyValue: new Guid("00000001-0000-0000-0000-000000000002"));

            migrationBuilder.DeleteData(
                table: "MovieScheduleInfoEntity",
                keyColumn: "MovieScheduleInfoId",
                keyValue: new Guid("00000001-0000-0000-0000-000000000003"));

            migrationBuilder.DeleteData(
                table: "MovieScheduleInfoEntity",
                keyColumn: "MovieScheduleInfoId",
                keyValue: new Guid("00000001-0000-0000-0000-000000000004"));

            migrationBuilder.DeleteData(
                table: "MovieScheduleInfoEntity",
                keyColumn: "MovieScheduleInfoId",
                keyValue: new Guid("00000002-0000-0000-0000-000000000001"));

            migrationBuilder.DeleteData(
                table: "MovieScheduleInfoEntity",
                keyColumn: "MovieScheduleInfoId",
                keyValue: new Guid("00000002-0000-0000-0000-000000000002"));

            migrationBuilder.DeleteData(
                table: "MovieScheduleInfoEntity",
                keyColumn: "MovieScheduleInfoId",
                keyValue: new Guid("00000002-0000-0000-0000-000000000003"));

            migrationBuilder.DeleteData(
                table: "MovieScheduleInfoEntity",
                keyColumn: "MovieScheduleInfoId",
                keyValue: new Guid("00000002-0000-0000-0000-000000000004"));

            migrationBuilder.DeleteData(
                table: "MovieScheduleInfoEntity",
                keyColumn: "MovieScheduleInfoId",
                keyValue: new Guid("00000003-0000-0000-0000-000000000001"));

            migrationBuilder.DeleteData(
                table: "MovieScheduleInfoEntity",
                keyColumn: "MovieScheduleInfoId",
                keyValue: new Guid("00000003-0000-0000-0000-000000000002"));

            migrationBuilder.DeleteData(
                table: "MovieScheduleInfoEntity",
                keyColumn: "MovieScheduleInfoId",
                keyValue: new Guid("00000003-0000-0000-0000-000000000003"));

            migrationBuilder.DeleteData(
                table: "MovieScheduleInfoEntity",
                keyColumn: "MovieScheduleInfoId",
                keyValue: new Guid("00000003-0000-0000-0000-000000000004"));

            migrationBuilder.DeleteData(
                table: "MovieScheduleInfoEntity",
                keyColumn: "MovieScheduleInfoId",
                keyValue: new Guid("00000004-0000-0000-0000-000000000001"));

            migrationBuilder.DeleteData(
                table: "MovieScheduleInfoEntity",
                keyColumn: "MovieScheduleInfoId",
                keyValue: new Guid("00000004-0000-0000-0000-000000000002"));

            migrationBuilder.DeleteData(
                table: "MovieScheduleInfoEntity",
                keyColumn: "MovieScheduleInfoId",
                keyValue: new Guid("00000004-0000-0000-0000-000000000003"));

            migrationBuilder.DeleteData(
                table: "MovieScheduleInfoEntity",
                keyColumn: "MovieScheduleInfoId",
                keyValue: new Guid("00000004-0000-0000-0000-000000000004"));

            migrationBuilder.DeleteData(
                table: "MovieScheduleInfoEntity",
                keyColumn: "MovieScheduleInfoId",
                keyValue: new Guid("00000005-0000-0000-0000-000000000001"));

            migrationBuilder.DeleteData(
                table: "MovieScheduleInfoEntity",
                keyColumn: "MovieScheduleInfoId",
                keyValue: new Guid("00000005-0000-0000-0000-000000000002"));

            migrationBuilder.DeleteData(
                table: "MovieScheduleInfoEntity",
                keyColumn: "MovieScheduleInfoId",
                keyValue: new Guid("00000005-0000-0000-0000-000000000003"));

            migrationBuilder.DeleteData(
                table: "MovieScheduleInfoEntity",
                keyColumn: "MovieScheduleInfoId",
                keyValue: new Guid("00000005-0000-0000-0000-000000000004"));

            migrationBuilder.DeleteData(
                table: "MovieScheduleInfoEntity",
                keyColumn: "MovieScheduleInfoId",
                keyValue: new Guid("00000006-0000-0000-0000-000000000001"));

            migrationBuilder.DeleteData(
                table: "MovieScheduleInfoEntity",
                keyColumn: "MovieScheduleInfoId",
                keyValue: new Guid("00000006-0000-0000-0000-000000000002"));

            migrationBuilder.DeleteData(
                table: "MovieScheduleInfoEntity",
                keyColumn: "MovieScheduleInfoId",
                keyValue: new Guid("00000006-0000-0000-0000-000000000003"));

            migrationBuilder.DeleteData(
                table: "MovieScheduleInfoEntity",
                keyColumn: "MovieScheduleInfoId",
                keyValue: new Guid("00000006-0000-0000-0000-000000000004"));

            migrationBuilder.DeleteData(
                table: "MovieScheduleInfoEntity",
                keyColumn: "MovieScheduleInfoId",
                keyValue: new Guid("00000007-0000-0000-0000-000000000001"));

            migrationBuilder.DeleteData(
                table: "MovieScheduleInfoEntity",
                keyColumn: "MovieScheduleInfoId",
                keyValue: new Guid("00000007-0000-0000-0000-000000000002"));

            migrationBuilder.DeleteData(
                table: "MovieScheduleInfoEntity",
                keyColumn: "MovieScheduleInfoId",
                keyValue: new Guid("00000007-0000-0000-0000-000000000003"));

            migrationBuilder.DeleteData(
                table: "MovieScheduleInfoEntity",
                keyColumn: "MovieScheduleInfoId",
                keyValue: new Guid("00000007-0000-0000-0000-000000000004"));

            migrationBuilder.DeleteData(
                table: "MovieScheduleInfoEntity",
                keyColumn: "MovieScheduleInfoId",
                keyValue: new Guid("00000008-0000-0000-0000-000000000001"));

            migrationBuilder.DeleteData(
                table: "MovieScheduleInfoEntity",
                keyColumn: "MovieScheduleInfoId",
                keyValue: new Guid("00000008-0000-0000-0000-000000000002"));

            migrationBuilder.DeleteData(
                table: "MovieScheduleInfoEntity",
                keyColumn: "MovieScheduleInfoId",
                keyValue: new Guid("00000008-0000-0000-0000-000000000003"));

            migrationBuilder.DeleteData(
                table: "MovieScheduleInfoEntity",
                keyColumn: "MovieScheduleInfoId",
                keyValue: new Guid("00000008-0000-0000-0000-000000000004"));

            migrationBuilder.DeleteData(
                table: "MovieScheduleInfoEntity",
                keyColumn: "MovieScheduleInfoId",
                keyValue: new Guid("00000009-0000-0000-0000-000000000001"));

            migrationBuilder.DeleteData(
                table: "MovieScheduleInfoEntity",
                keyColumn: "MovieScheduleInfoId",
                keyValue: new Guid("00000009-0000-0000-0000-000000000002"));

            migrationBuilder.DeleteData(
                table: "MovieScheduleInfoEntity",
                keyColumn: "MovieScheduleInfoId",
                keyValue: new Guid("00000009-0000-0000-0000-000000000003"));

            migrationBuilder.DeleteData(
                table: "MovieScheduleInfoEntity",
                keyColumn: "MovieScheduleInfoId",
                keyValue: new Guid("00000009-0000-0000-0000-000000000004"));

            migrationBuilder.DeleteData(
                table: "MovieScheduleInfoEntity",
                keyColumn: "MovieScheduleInfoId",
                keyValue: new Guid("0000000a-0000-0000-0000-000000000001"));

            migrationBuilder.DeleteData(
                table: "MovieScheduleInfoEntity",
                keyColumn: "MovieScheduleInfoId",
                keyValue: new Guid("0000000a-0000-0000-0000-000000000002"));

            migrationBuilder.DeleteData(
                table: "MovieScheduleInfoEntity",
                keyColumn: "MovieScheduleInfoId",
                keyValue: new Guid("0000000a-0000-0000-0000-000000000003"));

            migrationBuilder.DeleteData(
                table: "MovieScheduleInfoEntity",
                keyColumn: "MovieScheduleInfoId",
                keyValue: new Guid("0000000a-0000-0000-0000-000000000004"));

            migrationBuilder.DeleteData(
                table: "MovieScheduleInfoEntity",
                keyColumn: "MovieScheduleInfoId",
                keyValue: new Guid("0000000b-0000-0000-0000-000000000001"));

            migrationBuilder.DeleteData(
                table: "MovieScheduleInfoEntity",
                keyColumn: "MovieScheduleInfoId",
                keyValue: new Guid("0000000b-0000-0000-0000-000000000002"));

            migrationBuilder.DeleteData(
                table: "MovieScheduleInfoEntity",
                keyColumn: "MovieScheduleInfoId",
                keyValue: new Guid("0000000b-0000-0000-0000-000000000003"));

            migrationBuilder.DeleteData(
                table: "MovieScheduleInfoEntity",
                keyColumn: "MovieScheduleInfoId",
                keyValue: new Guid("0000000b-0000-0000-0000-000000000004"));

            migrationBuilder.DeleteData(
                table: "MovieScheduleInfoEntity",
                keyColumn: "MovieScheduleInfoId",
                keyValue: new Guid("0000000c-0000-0000-0000-000000000001"));

            migrationBuilder.DeleteData(
                table: "MovieScheduleInfoEntity",
                keyColumn: "MovieScheduleInfoId",
                keyValue: new Guid("0000000c-0000-0000-0000-000000000002"));

            migrationBuilder.DeleteData(
                table: "MovieScheduleInfoEntity",
                keyColumn: "MovieScheduleInfoId",
                keyValue: new Guid("0000000c-0000-0000-0000-000000000003"));

            migrationBuilder.DeleteData(
                table: "MovieScheduleInfoEntity",
                keyColumn: "MovieScheduleInfoId",
                keyValue: new Guid("0000000c-0000-0000-0000-000000000004"));

            migrationBuilder.DeleteData(
                table: "MovieScheduleInfoEntity",
                keyColumn: "MovieScheduleInfoId",
                keyValue: new Guid("0000000d-0000-0000-0000-000000000001"));

            migrationBuilder.DeleteData(
                table: "MovieScheduleInfoEntity",
                keyColumn: "MovieScheduleInfoId",
                keyValue: new Guid("0000000d-0000-0000-0000-000000000002"));

            migrationBuilder.DeleteData(
                table: "MovieScheduleInfoEntity",
                keyColumn: "MovieScheduleInfoId",
                keyValue: new Guid("0000000d-0000-0000-0000-000000000003"));

            migrationBuilder.DeleteData(
                table: "MovieScheduleInfoEntity",
                keyColumn: "MovieScheduleInfoId",
                keyValue: new Guid("0000000d-0000-0000-0000-000000000004"));

            migrationBuilder.DeleteData(
                table: "MovieScheduleInfoEntity",
                keyColumn: "MovieScheduleInfoId",
                keyValue: new Guid("0000000e-0000-0000-0000-000000000001"));

            migrationBuilder.DeleteData(
                table: "MovieScheduleInfoEntity",
                keyColumn: "MovieScheduleInfoId",
                keyValue: new Guid("0000000e-0000-0000-0000-000000000002"));

            migrationBuilder.DeleteData(
                table: "MovieScheduleInfoEntity",
                keyColumn: "MovieScheduleInfoId",
                keyValue: new Guid("0000000e-0000-0000-0000-000000000003"));

            migrationBuilder.DeleteData(
                table: "MovieScheduleInfoEntity",
                keyColumn: "MovieScheduleInfoId",
                keyValue: new Guid("0000000e-0000-0000-0000-000000000004"));

            migrationBuilder.DeleteData(
                table: "MovieScheduleInfoEntity",
                keyColumn: "MovieScheduleInfoId",
                keyValue: new Guid("0000000f-0000-0000-0000-000000000001"));

            migrationBuilder.DeleteData(
                table: "MovieScheduleInfoEntity",
                keyColumn: "MovieScheduleInfoId",
                keyValue: new Guid("0000000f-0000-0000-0000-000000000002"));

            migrationBuilder.DeleteData(
                table: "MovieScheduleInfoEntity",
                keyColumn: "MovieScheduleInfoId",
                keyValue: new Guid("0000000f-0000-0000-0000-000000000003"));

            migrationBuilder.DeleteData(
                table: "MovieScheduleInfoEntity",
                keyColumn: "MovieScheduleInfoId",
                keyValue: new Guid("0000000f-0000-0000-0000-000000000004"));

            migrationBuilder.DeleteData(
                table: "MovieScheduleInfoEntity",
                keyColumn: "MovieScheduleInfoId",
                keyValue: new Guid("00000010-0000-0000-0000-000000000001"));

            migrationBuilder.DeleteData(
                table: "MovieScheduleInfoEntity",
                keyColumn: "MovieScheduleInfoId",
                keyValue: new Guid("00000010-0000-0000-0000-000000000002"));

            migrationBuilder.DeleteData(
                table: "MovieScheduleInfoEntity",
                keyColumn: "MovieScheduleInfoId",
                keyValue: new Guid("00000010-0000-0000-0000-000000000003"));

            migrationBuilder.DeleteData(
                table: "MovieScheduleInfoEntity",
                keyColumn: "MovieScheduleInfoId",
                keyValue: new Guid("00000010-0000-0000-0000-000000000004"));

            migrationBuilder.DeleteData(
                table: "MovieScheduleInfoEntity",
                keyColumn: "MovieScheduleInfoId",
                keyValue: new Guid("00000011-0000-0000-0000-000000000001"));

            migrationBuilder.DeleteData(
                table: "MovieScheduleInfoEntity",
                keyColumn: "MovieScheduleInfoId",
                keyValue: new Guid("00000011-0000-0000-0000-000000000002"));

            migrationBuilder.DeleteData(
                table: "MovieScheduleInfoEntity",
                keyColumn: "MovieScheduleInfoId",
                keyValue: new Guid("00000011-0000-0000-0000-000000000003"));

            migrationBuilder.DeleteData(
                table: "MovieScheduleInfoEntity",
                keyColumn: "MovieScheduleInfoId",
                keyValue: new Guid("00000011-0000-0000-0000-000000000004"));

            migrationBuilder.DeleteData(
                table: "MovieScheduleInfoEntity",
                keyColumn: "MovieScheduleInfoId",
                keyValue: new Guid("00000012-0000-0000-0000-000000000001"));

            migrationBuilder.DeleteData(
                table: "MovieScheduleInfoEntity",
                keyColumn: "MovieScheduleInfoId",
                keyValue: new Guid("00000012-0000-0000-0000-000000000002"));

            migrationBuilder.DeleteData(
                table: "MovieScheduleInfoEntity",
                keyColumn: "MovieScheduleInfoId",
                keyValue: new Guid("00000012-0000-0000-0000-000000000003"));

            migrationBuilder.DeleteData(
                table: "MovieScheduleInfoEntity",
                keyColumn: "MovieScheduleInfoId",
                keyValue: new Guid("00000012-0000-0000-0000-000000000004"));

            migrationBuilder.DeleteData(
                table: "MovieScheduleInfoEntity",
                keyColumn: "MovieScheduleInfoId",
                keyValue: new Guid("00000013-0000-0000-0000-000000000001"));

            migrationBuilder.DeleteData(
                table: "MovieScheduleInfoEntity",
                keyColumn: "MovieScheduleInfoId",
                keyValue: new Guid("00000013-0000-0000-0000-000000000002"));

            migrationBuilder.DeleteData(
                table: "MovieScheduleInfoEntity",
                keyColumn: "MovieScheduleInfoId",
                keyValue: new Guid("00000013-0000-0000-0000-000000000003"));

            migrationBuilder.DeleteData(
                table: "MovieScheduleInfoEntity",
                keyColumn: "MovieScheduleInfoId",
                keyValue: new Guid("00000013-0000-0000-0000-000000000004"));

            migrationBuilder.DeleteData(
                table: "MovieScheduleInfoEntity",
                keyColumn: "MovieScheduleInfoId",
                keyValue: new Guid("00000014-0000-0000-0000-000000000001"));

            migrationBuilder.DeleteData(
                table: "MovieScheduleInfoEntity",
                keyColumn: "MovieScheduleInfoId",
                keyValue: new Guid("00000014-0000-0000-0000-000000000002"));

            migrationBuilder.DeleteData(
                table: "MovieScheduleInfoEntity",
                keyColumn: "MovieScheduleInfoId",
                keyValue: new Guid("00000014-0000-0000-0000-000000000003"));

            migrationBuilder.DeleteData(
                table: "MovieScheduleInfoEntity",
                keyColumn: "MovieScheduleInfoId",
                keyValue: new Guid("00000014-0000-0000-0000-000000000004"));

            migrationBuilder.DeleteData(
                table: "MovieScheduleInfoEntity",
                keyColumn: "MovieScheduleInfoId",
                keyValue: new Guid("00000015-0000-0000-0000-000000000001"));

            migrationBuilder.DeleteData(
                table: "MovieScheduleInfoEntity",
                keyColumn: "MovieScheduleInfoId",
                keyValue: new Guid("00000015-0000-0000-0000-000000000002"));

            migrationBuilder.DeleteData(
                table: "MovieScheduleInfoEntity",
                keyColumn: "MovieScheduleInfoId",
                keyValue: new Guid("00000015-0000-0000-0000-000000000003"));

            migrationBuilder.DeleteData(
                table: "MovieScheduleInfoEntity",
                keyColumn: "MovieScheduleInfoId",
                keyValue: new Guid("00000015-0000-0000-0000-000000000004"));

            migrationBuilder.DeleteData(
                table: "MovieScheduleInfoEntity",
                keyColumn: "MovieScheduleInfoId",
                keyValue: new Guid("00000016-0000-0000-0000-000000000001"));

            migrationBuilder.DeleteData(
                table: "MovieScheduleInfoEntity",
                keyColumn: "MovieScheduleInfoId",
                keyValue: new Guid("00000016-0000-0000-0000-000000000002"));

            migrationBuilder.DeleteData(
                table: "MovieScheduleInfoEntity",
                keyColumn: "MovieScheduleInfoId",
                keyValue: new Guid("00000016-0000-0000-0000-000000000003"));

            migrationBuilder.DeleteData(
                table: "MovieScheduleInfoEntity",
                keyColumn: "MovieScheduleInfoId",
                keyValue: new Guid("00000016-0000-0000-0000-000000000004"));

            migrationBuilder.DeleteData(
                table: "MovieScheduleInfoEntity",
                keyColumn: "MovieScheduleInfoId",
                keyValue: new Guid("00000017-0000-0000-0000-000000000001"));

            migrationBuilder.DeleteData(
                table: "MovieScheduleInfoEntity",
                keyColumn: "MovieScheduleInfoId",
                keyValue: new Guid("00000017-0000-0000-0000-000000000002"));

            migrationBuilder.DeleteData(
                table: "MovieScheduleInfoEntity",
                keyColumn: "MovieScheduleInfoId",
                keyValue: new Guid("00000017-0000-0000-0000-000000000003"));

            migrationBuilder.DeleteData(
                table: "MovieScheduleInfoEntity",
                keyColumn: "MovieScheduleInfoId",
                keyValue: new Guid("00000017-0000-0000-0000-000000000004"));

            migrationBuilder.DeleteData(
                table: "MovieScheduleInfoEntity",
                keyColumn: "MovieScheduleInfoId",
                keyValue: new Guid("00000018-0000-0000-0000-000000000001"));

            migrationBuilder.DeleteData(
                table: "MovieScheduleInfoEntity",
                keyColumn: "MovieScheduleInfoId",
                keyValue: new Guid("00000018-0000-0000-0000-000000000002"));

            migrationBuilder.DeleteData(
                table: "MovieScheduleInfoEntity",
                keyColumn: "MovieScheduleInfoId",
                keyValue: new Guid("00000018-0000-0000-0000-000000000003"));

            migrationBuilder.DeleteData(
                table: "MovieScheduleInfoEntity",
                keyColumn: "MovieScheduleInfoId",
                keyValue: new Guid("00000018-0000-0000-0000-000000000004"));

            migrationBuilder.DeleteData(
                table: "MovieScheduleInfoEntity",
                keyColumn: "MovieScheduleInfoId",
                keyValue: new Guid("00000019-0000-0000-0000-000000000001"));

            migrationBuilder.DeleteData(
                table: "MovieScheduleInfoEntity",
                keyColumn: "MovieScheduleInfoId",
                keyValue: new Guid("00000019-0000-0000-0000-000000000002"));

            migrationBuilder.DeleteData(
                table: "MovieScheduleInfoEntity",
                keyColumn: "MovieScheduleInfoId",
                keyValue: new Guid("00000019-0000-0000-0000-000000000003"));

            migrationBuilder.DeleteData(
                table: "MovieScheduleInfoEntity",
                keyColumn: "MovieScheduleInfoId",
                keyValue: new Guid("00000019-0000-0000-0000-000000000004"));

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "0a986063-932c-4e0c-97ce-a2bf4da664e8");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "0b5807cb-8178-4d7f-909d-ae438a4a3711");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "16502009-6c61-4aa3-a3ed-261998411fb5");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "17d9c54b-5fd7-43fe-b787-bfe67e91271d");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "19a1d4ce-10b6-4a21-8506-f4b7af97c1bb");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "19b2a72b-cd0d-4b63-82df-03641891f03b");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "1e650045-0bf5-4391-9561-4cb789d9943d");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "21fc0ae2-89d0-486a-a220-e837ca41b5ae");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "22c66d8f-fc81-48e0-97cb-311d7650d413");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "2d1aa774-5234-45bc-b36c-e465b68229a0");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "3b056c76-0908-4133-b170-7c41c499026b");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "3beaccfa-9bbb-43b4-b7e2-4cde3894c8e6");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "3f52063b-0480-423c-a8fc-c50a3a57d2e5");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "3fc1d76c-7b1a-4d7f-afe8-99eabd9f2130");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "46e361c6-4f15-47bb-8887-6daeab630911");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "49bebaab-0448-47c4-9222-ea67b46aa3ce");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "4ce51737-bdb4-4832-ac24-9412cceab1d9");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "51041ca6-90d1-49e3-8667-3125109e8703");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "5515eb1d-7f1e-4513-a86b-8b42425484c7");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "5b828390-69c9-42c7-a931-a54c17309c7a");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "6045c0b1-473e-4f04-9054-e8533c8ed8da");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "6f6cfc50-5fd7-4847-8ea2-373bd8f3844e");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "75efe13c-ebe6-4f45-8793-827cba3a533e");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "7a2117d5-c111-4fb8-b20e-7826822a327d");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "7d8ef90f-bd54-4985-8b83-b0c6b8d0ab77");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "7e20cfa3-6ed8-4fb9-8614-cbe378560733");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "7faceacb-f6af-451a-9ec9-8692c6175183");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "803c3269-cb62-4c84-abae-f2cc1de8dbc0");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "849e6060-c847-4615-903d-48e1e033e038");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "9055108e-07ac-4d0d-b19d-f3333909b30f");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "a2f5c7f5-6e10-41da-ad4e-11a69287705f");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "a6f405c3-c894-457f-972f-760cf482e9fe");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "af922b63-e1e5-4985-9f50-abd4b0336b5d");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "c4e2b2e7-9157-4ef5-b9a6-bf6d1f4bc23a");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "c9ad02a4-ed0a-437f-a216-a7cde99259e6");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "cf98f34f-1f43-498a-ae3c-ef70024db6b4");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "d2eb62c7-635e-450e-9660-e0a2d9ba760c");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "d6d578f4-3fe8-4c75-aa10-b282d12412c1");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "e6eea0b2-f689-49d3-b674-a771fe221a6d");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "ebce8708-10ee-4fa5-9fc6-01f149befd72");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "ec891806-22dd-4241-825a-8a308004d4e9");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "f06cbcee-2268-4228-953a-2c4706f38dc5");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "f3b19264-4b8f-4efc-9428-298bb0d671f2");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "f84b507d-d635-4e9e-81aa-341da7b05023");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "fafa8d22-3586-45c8-94b7-231a359302a7");

            migrationBuilder.DeleteData(
                table: "UserProfileEntity",
                keyColumn: "UserId",
                keyValue: new Guid("7e272a3a-6288-4589-9d0e-f4203a5f3fe0"));

            migrationBuilder.DeleteData(
                table: "UserProfileEntity",
                keyColumn: "UserId",
                keyValue: new Guid("a1b2c3d4-e5f6-7a8b-c9d0-e1f2a3b4c5d6"));

            migrationBuilder.DeleteData(
                table: "UserRoleInfoEntity",
                keyColumns: new[] { "RoleId", "UserId" },
                keyValues: new object[] { new Guid("1a8f7b9c-d4e5-4f6a-b7c8-9d0e1f2a3b4c"), new Guid("a1b2c3d4-e5f6-7a8b-c9d0-e1f2a3b4c5d6") });

            migrationBuilder.DeleteData(
                table: "UserRoleInfoEntity",
                keyColumns: new[] { "RoleId", "UserId" },
                keyValues: new object[] { new Guid("3c0d9e1f-a6b7-c8d9-e0f1-2a3b4c5d6e7f"), new Guid("7e272a3a-6288-4589-9d0e-f4203a5f3fe0") });

            migrationBuilder.DeleteData(
                table: "UserRoleInfoEntity",
                keyColumns: new[] { "RoleId", "UserId" },
                keyValues: new object[] { new Guid("5e2f1a3b-c8d9-e0f1-a2b3-4c5d6e7f8a9b"), new Guid("7e272a3a-6288-4589-9d0e-f4203a5f3fe0") });

            migrationBuilder.DeleteData(
                table: "UserInfoEntity",
                keyColumn: "UserId",
                keyValue: new Guid("7e272a3a-6288-4589-9d0e-f4203a5f3fe0"));

            migrationBuilder.DeleteData(
                table: "UserInfoEntity",
                keyColumn: "UserId",
                keyValue: new Guid("a1b2c3d4-e5f6-7a8b-c9d0-e1f2a3b4c5d6"));

            migrationBuilder.DropColumn(
                name: "ManagerId",
                table: "MovieInfoEntity");

            migrationBuilder.DropColumn(
                name: "ManagerId",
                table: "CinemaInfoEntity");

            migrationBuilder.AddColumn<Guid>(
                name: "MovieManagerId",
                table: "MovieInfoEntity",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "FacilitiesManagerId",
                table: "CinemaInfoEntity",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "TheaterManagerId",
                table: "CinemaInfoEntity",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.UpdateData(
                table: "AuditoriumInfoEntities",
                keyColumn: "AuditoriumId",
                keyValue: new Guid("33333333-3333-3333-3333-333333333333"),
                columns: new[] { "AuditoriumNumber", "UpdatedAt" },
                values: new object[] { "Cinema 1 (2D)", new DateTime(2026, 3, 18, 0, 18, 3, 396, DateTimeKind.Local).AddTicks(6480) });

            migrationBuilder.UpdateData(
                table: "AuditoriumInfoEntities",
                keyColumn: "AuditoriumId",
                keyValue: new Guid("44444444-4444-4444-4444-444444444444"),
                columns: new[] { "AuditoriumNumber", "CinemaId", "CreatedByUserId", "UpdatedAt" },
                values: new object[] { "Cinema 2 (IMAX)", new Guid("22222222-2222-2222-2222-222222222222"), new Guid("e4e1f7d8-c3b2-4a90-8c67-2f5a1b3d9e0c"), new DateTime(2026, 3, 18, 0, 18, 3, 396, DateTimeKind.Local).AddTicks(6483) });

            migrationBuilder.UpdateData(
                table: "AuditoriumInfoEntities",
                keyColumn: "AuditoriumId",
                keyValue: new Guid("55555555-5555-5555-5555-555555555555"),
                columns: new[] { "AuditoriumNumber", "CinemaId", "CreatedByUserId", "UpdatedAt" },
                values: new object[] { "Cinema 3 (3D)", new Guid("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"), new Guid("f1a0e9b8-d7c6-5e4f-a3b2-1d0c9b8a7f6e"), new DateTime(2026, 3, 18, 0, 18, 3, 396, DateTimeKind.Local).AddTicks(6485) });

            migrationBuilder.UpdateData(
                table: "CinemaInfoEntity",
                keyColumn: "CinemaId",
                keyValue: new Guid("11111111-1111-1111-1111-111111111111"),
                columns: new[] { "CinemaDescription", "CinemaHotLineNumber", "CinemaLocation", "CinemaName", "FacilitiesManagerId", "TheaterManagerId", "UpdatedAt" },
                values: new object[] { "Không gian điện ảnh trẻ trung, hiện đại bậc nhất Sài Gòn.", "19002235", "116 Nguyễn Du, Quận 1, TP. HCM", "Galaxy Cinema Nguyễn Du", null, new Guid("7b5d2c1e-9f8a-3e7b-c1d2-a0e9f8c7b6a5"), new DateTime(2026, 3, 18, 0, 18, 3, 396, DateTimeKind.Local).AddTicks(6431) });

            migrationBuilder.UpdateData(
                table: "CinemaInfoEntity",
                keyColumn: "CinemaId",
                keyValue: new Guid("22222222-2222-2222-2222-222222222222"),
                columns: new[] { "CinemaDescription", "CinemaHotLineNumber", "CinemaLocation", "CinemaName", "FacilitiesManagerId", "TheaterManagerId", "UpdatedAt" },
                values: new object[] { "Cụm rạp cao cấp với công nghệ âm thanh Dolby Atmos.", "0243724666", "Tầng 4, Lotte Mall West Lake, 272 Võ Chí Công, Tây Hồ", "Lotte Cinema West Lake", null, new Guid("e4e1f7d8-c3b2-4a90-8c67-2f5a1b3d9e0c"), new DateTime(2026, 3, 18, 0, 18, 3, 396, DateTimeKind.Local).AddTicks(6436) });

            migrationBuilder.InsertData(
                table: "CinemaInfoEntity",
                columns: new[] { "CinemaId", "ActiveAt", "CinemaCity", "CinemaDescription", "CinemaHotLineNumber", "CinemaLocation", "CinemaName", "CreatedAt", "CreatedByUserId", "DeletedAt", "DeletedByUserId", "FacilitiesManagerId", "IsActive", "IsDeleted", "TheaterManagerId", "UpdatedAt", "UpdatedByUserId" },
                values: new object[] { new Guid("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"), new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), "Hồ Chí Minh", "Tọa lạc tại biểu tượng của thành phố, mang lại trải nghiệm đẳng cấp.", "19002099", "Tầng 3 & 4, Tòa nhà Bitexco, 2 Hải Triều, Quận 1", "BHD Star Bitexco", new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new Guid("e4e1f7d8-c3b2-4a90-8c67-2f5a1b3d9e0c"), null, null, new Guid("f1a0e9b8-d7c6-5e4f-a3b2-1d0c9b8a7f6e"), true, false, null, new DateTime(2026, 3, 18, 0, 18, 3, 396, DateTimeKind.Local).AddTicks(6439), null });

            migrationBuilder.InsertData(
                table: "MovieFormatMovieInfoEntity",
                columns: new[] { "FormatId", "MovieId" },
                values: new object[] { new Guid("d29b0f1c-8e2a-4c5b-bc3d-1a2f3e4d5c6b"), new Guid("77777777-7777-7777-7777-777777777777") });

            migrationBuilder.InsertData(
                table: "MovieGenreMovieInfoEntity",
                columns: new[] { "MovieGenreId", "MovieId" },
                values: new object[] { new Guid("b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e"), new Guid("77777777-7777-7777-7777-777777777777") });

            migrationBuilder.UpdateData(
                table: "MovieInfoEntity",
                keyColumn: "MovieId",
                keyValue: new Guid("66666666-6666-6666-6666-666666666666"),
                columns: new[] { "ActiveAt", "Actors", "Director", "EndedDate", "MovieDescription", "MovieDuration", "MovieImageUrl", "MovieManagerId", "MovieName", "TrailerUrl", "UpdatedAt" },
                values: new object[] { new DateTime(2026, 3, 13, 0, 18, 3, 396, DateTimeKind.Local).AddTicks(6390), "Robert Pattinson, Zoë Kravitz, Paul Dano", "Matt Reeves", new DateTime(2026, 4, 12, 0, 18, 3, 396, DateTimeKind.Local).AddTicks(6390), "Batman ventures into Gotham City's underworld when a sadistic killer leaves behind a trail of cryptic clues.", 176, "https://res.cloudinary.com/dp6utffzy/image/upload/v171000000/the_batman_poster", new Guid("b2c3d4e5-f6a7-8b9c-d0e1-f2a3b4c5d6e7"), "The Batman", "https://www.youtube.com/watch?v=mqqft239u6Q", new DateTime(2026, 3, 18, 0, 18, 3, 396, DateTimeKind.Local).AddTicks(7055) });

            migrationBuilder.UpdateData(
                table: "MovieInfoEntity",
                keyColumn: "MovieId",
                keyValue: new Guid("77777777-7777-7777-7777-777777777777"),
                columns: new[] { "ActiveAt", "Actors", "CreatedByUserId", "Director", "EndedDate", "MovieDescription", "MovieDuration", "MovieImageUrl", "MovieManagerId", "MovieName", "MovieRequiredAgeId", "TrailerUrl", "UpdatedAt" },
                values: new object[] { new DateTime(2026, 3, 17, 0, 18, 3, 396, DateTimeKind.Local).AddTicks(6390), "Cillian Murphy, Emily Blunt, Matt Damon", new Guid("e4e1f7d8-c3b2-4a90-8c67-2f5a1b3d9e0c"), "Christopher Nolan", new DateTime(2026, 4, 17, 0, 18, 3, 396, DateTimeKind.Local).AddTicks(6390), "The story of American scientist J. Robert Oppenheimer and his role in the development of the atomic bomb.", 180, "https://res.cloudinary.com/dp6utffzy/image/upload/v171000000/oppenheimer_poster", new Guid("e4e1f7d8-c3b2-4a90-8c67-2f5a1b3d9e0c"), "Oppenheimer", new Guid("9f0e1d2c-3b4a-4d5e-6f7a-8b9c0d1e2f3a"), "https://www.youtube.com/watch?v=uYPbbksJxIg", new DateTime(2026, 3, 18, 0, 18, 3, 396, DateTimeKind.Local).AddTicks(7067) });

            migrationBuilder.InsertData(
                table: "MovieInfoEntity",
                columns: new[] { "MovieId", "ActiveAt", "Actors", "CreatedAt", "CreatedByUserId", "DeletedAt", "DeletedByUserId", "Director", "EndedDate", "IsActive", "IsCommingSoon", "IsDeleted", "MovieDescription", "MovieDuration", "MovieImageUrl", "MovieManagerId", "MovieName", "MovieRequiredAgeId", "TrailerUrl", "UpdatedAt", "UpdatedByUserId" },
                values: new object[] { new Guid("88888888-8888-8888-8888-888888888888"), new DateTime(2026, 3, 28, 0, 18, 3, 396, DateTimeKind.Local).AddTicks(6390), "Sam Worthington, Zoe Saldana, Sigourney Weaver", new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new Guid("b2c3d4e5-f6a7-8b9c-d0e1-f2a3b4c5d6e7"), null, null, "James Cameron", new DateTime(2026, 4, 27, 0, 18, 3, 396, DateTimeKind.Local).AddTicks(6390), true, true, false, "Jake Sully lives with his newfound family formed on the extrasolar moon Pandora.", 192, "https://res.cloudinary.com/dp6utffzy/image/upload/v171000000/avatar_poster", new Guid("b2c3d4e5-f6a7-8b9c-d0e1-f2a3b4c5d6e7"), "Avatar: The Way of Water", new Guid("5c1b2d4e-8a9b-4c0d-7f6e-1d2c3b4a5e0f"), "https://www.youtube.com/watch?v=d9MyW72ELq0", new DateTime(2026, 3, 18, 0, 18, 3, 396, DateTimeKind.Local).AddTicks(7071), null });

            migrationBuilder.InsertData(
                table: "MovieScheduleInfoEntity",
                columns: new[] { "MovieScheduleInfoId", "ActiveAt", "AuditoriumId", "CreatedAt", "CreatedByUserId", "DeletedAt", "DeletedByUserId", "EndedTime", "IsActive", "IsDeleted", "MovieFormatId", "MovieId", "StartTime", "UpdatedAt", "UpdatedByUserId" },
                values: new object[,]
                {
                    { new Guid("31ccca9e-3997-4e5e-80bc-aceca09d2566"), new DateTime(2026, 3, 19, 20, 0, 0, 0, DateTimeKind.Local), new Guid("44444444-4444-4444-4444-444444444444"), new DateTime(2026, 3, 18, 0, 18, 3, 396, DateTimeKind.Local).AddTicks(7156), new Guid("e4e1f7d8-c3b2-4a90-8c67-2f5a1b3d9e0c"), null, null, new DateTime(2026, 3, 19, 23, 0, 0, 0, DateTimeKind.Local), true, false, new Guid("d29b0f1c-8e2a-4c5b-bc3d-1a2f3e4d5c6b"), new Guid("77777777-7777-7777-7777-777777777777"), new DateTime(2026, 3, 19, 20, 0, 0, 0, DateTimeKind.Local), new DateTime(2026, 3, 18, 0, 18, 3, 396, DateTimeKind.Local).AddTicks(7157), null },
                    { new Guid("98ee446e-c0df-4aa2-b96e-4ddaa9111116"), new DateTime(2026, 3, 19, 19, 0, 0, 0, DateTimeKind.Local), new Guid("33333333-3333-3333-3333-333333333333"), new DateTime(2026, 3, 18, 0, 18, 3, 396, DateTimeKind.Local).AddTicks(7147), new Guid("7b5d2c1e-9f8a-3e7b-c1d2-a0e9f8c7b6a5"), null, null, new DateTime(2026, 3, 19, 21, 56, 0, 0, DateTimeKind.Local), true, false, new Guid("3fbc4a32-15f5-47e0-b98a-784f1b8a9612"), new Guid("66666666-6666-6666-6666-666666666666"), new DateTime(2026, 3, 19, 19, 0, 0, 0, DateTimeKind.Local), new DateTime(2026, 3, 18, 0, 18, 3, 396, DateTimeKind.Local).AddTicks(7148), null }
                });

            migrationBuilder.InsertData(
                table: "SeatsInfoEntity",
                columns: new[] { "SeatId", "AuditoriumId", "ColIndex", "CoordX", "CoordY", "RowIndex", "SeatNumber" },
                values: new object[,]
                {
                    { "090f59b4-7a66-4845-b3af-deb1d442cf03", new Guid("55555555-5555-5555-5555-555555555555"), 0, 0.0, 120.0, 2, "C1" },
                    { "0c247d3b-9a6c-4b81-8b29-bbdef38097bb", new Guid("33333333-3333-3333-3333-333333333333"), 5, 300.0, 0.0, 0, "A6" },
                    { "0d6fb674-237e-4de4-bb84-610d3e3aa975", new Guid("55555555-5555-5555-5555-555555555555"), 7, 420.0, 0.0, 0, "A8" },
                    { "0d89096a-8b1b-4af0-8a3b-84cd837896ac", new Guid("55555555-5555-5555-5555-555555555555"), 7, 420.0, 180.0, 3, "D8" },
                    { "11fe78ab-95e4-477f-a9f2-1b0d3f715279", new Guid("55555555-5555-5555-5555-555555555555"), 2, 120.0, 180.0, 3, "D3" },
                    { "120709c1-9f79-4471-b486-b6eada2216df", new Guid("33333333-3333-3333-3333-333333333333"), 3, 180.0, 60.0, 1, "B4" },
                    { "1d6c3bd5-8478-4e5f-a346-0c1f3a723bfb", new Guid("44444444-4444-4444-4444-444444444444"), 4, 240.0, 120.0, 2, "C5" },
                    { "1dd8610d-db39-4ab5-85af-50673dc46ac4", new Guid("44444444-4444-4444-4444-444444444444"), 4, 240.0, 60.0, 1, "B5" },
                    { "23568fff-0091-474d-ae2f-94f1a5a9d0fb", new Guid("44444444-4444-4444-4444-444444444444"), 7, 420.0, 180.0, 3, "D8" },
                    { "23e3b142-f451-4d8a-9a15-4da91dd796f9", new Guid("44444444-4444-4444-4444-444444444444"), 2, 120.0, 120.0, 2, "C3" },
                    { "247c65c7-103f-4df3-93f3-a7e007bf7890", new Guid("55555555-5555-5555-5555-555555555555"), 5, 300.0, 180.0, 3, "D6" },
                    { "2e51bf1c-6943-4e16-9eff-c751faa6f472", new Guid("44444444-4444-4444-4444-444444444444"), 2, 120.0, 60.0, 1, "B3" },
                    { "356712d2-9fc7-458b-be03-592c397c344f", new Guid("44444444-4444-4444-4444-444444444444"), 0, 0.0, 180.0, 3, "D1" },
                    { "35f55d1b-37df-4098-bace-d6d7a7cb5aea", new Guid("33333333-3333-3333-3333-333333333333"), 1, 60.0, 60.0, 1, "B2" },
                    { "3958562b-4f90-4569-afcc-a160176494e0", new Guid("33333333-3333-3333-3333-333333333333"), 4, 240.0, 120.0, 2, "C5" },
                    { "3977ba88-1395-41fe-9451-52f4de2b9dd3", new Guid("55555555-5555-5555-5555-555555555555"), 6, 360.0, 60.0, 1, "B7" },
                    { "3ccf69dc-7259-4f6a-a366-5d76fe418210", new Guid("55555555-5555-5555-5555-555555555555"), 3, 180.0, 120.0, 2, "C4" },
                    { "3dce0dbb-0c18-4e21-acb2-c5719acfd13e", new Guid("55555555-5555-5555-5555-555555555555"), 3, 180.0, 60.0, 1, "B4" },
                    { "3e6cb6ef-e511-4e10-9007-ade017d52aed", new Guid("33333333-3333-3333-3333-333333333333"), 2, 120.0, 120.0, 2, "C3" },
                    { "3e8c9fc2-e86c-418b-8bac-db22f7d6242d", new Guid("33333333-3333-3333-3333-333333333333"), 4, 240.0, 60.0, 1, "B5" },
                    { "40ca824f-9d05-47dc-85fe-cf36e5bb26d5", new Guid("55555555-5555-5555-5555-555555555555"), 2, 120.0, 60.0, 1, "B3" },
                    { "413e42bb-a753-4947-b1f6-4126adc41e03", new Guid("44444444-4444-4444-4444-444444444444"), 1, 60.0, 60.0, 1, "B2" },
                    { "415195d8-9540-4c95-9e2f-d8bff25c4498", new Guid("44444444-4444-4444-4444-444444444444"), 5, 300.0, 60.0, 1, "B6" },
                    { "423313b8-6bfa-4233-accc-6a326638362d", new Guid("33333333-3333-3333-3333-333333333333"), 3, 180.0, 120.0, 2, "C4" },
                    { "437cf7de-7b03-42f3-9e43-063facf8eb7a", new Guid("33333333-3333-3333-3333-333333333333"), 3, 180.0, 0.0, 0, "A4" },
                    { "4391fba0-88c4-4942-9cb6-8769837d21fc", new Guid("33333333-3333-3333-3333-333333333333"), 3, 180.0, 180.0, 3, "D4" },
                    { "4860dd50-f9fc-49bb-a611-cf0dc5966815", new Guid("44444444-4444-4444-4444-444444444444"), 2, 120.0, 0.0, 0, "A3" },
                    { "4f51b74f-c29a-476e-9049-a7afad7c04ff", new Guid("55555555-5555-5555-5555-555555555555"), 6, 360.0, 180.0, 3, "D7" },
                    { "4f5da076-3606-4c66-b071-ca9f28884b35", new Guid("44444444-4444-4444-4444-444444444444"), 6, 360.0, 0.0, 0, "A7" },
                    { "510f1d0a-1150-475e-a60c-6c481f305b35", new Guid("44444444-4444-4444-4444-444444444444"), 5, 300.0, 0.0, 0, "A6" },
                    { "5245155b-ccd8-4cd9-b279-a086c929c6ad", new Guid("55555555-5555-5555-5555-555555555555"), 1, 60.0, 60.0, 1, "B2" },
                    { "52c7c0e7-f241-469f-92ba-beff843ca737", new Guid("44444444-4444-4444-4444-444444444444"), 7, 420.0, 0.0, 0, "A8" },
                    { "56cb43db-4c0a-4e7a-9fae-77a54aec9b7b", new Guid("33333333-3333-3333-3333-333333333333"), 0, 0.0, 0.0, 0, "A1" },
                    { "5ce06109-e85c-49aa-a4db-cb83c8d60281", new Guid("55555555-5555-5555-5555-555555555555"), 7, 420.0, 120.0, 2, "C8" },
                    { "60f2db16-9a47-4dc3-885a-f4c7349689b8", new Guid("55555555-5555-5555-5555-555555555555"), 4, 240.0, 120.0, 2, "C5" },
                    { "63ee6db0-5c9e-4b61-a4e7-f8d26c9c7915", new Guid("44444444-4444-4444-4444-444444444444"), 3, 180.0, 120.0, 2, "C4" },
                    { "64a237b0-0428-4b31-949a-495a5ea2be34", new Guid("33333333-3333-3333-3333-333333333333"), 6, 360.0, 180.0, 3, "D7" },
                    { "6bdeb9e0-e6d3-43bb-9f6a-f0236adf91ae", new Guid("33333333-3333-3333-3333-333333333333"), 7, 420.0, 120.0, 2, "C8" },
                    { "7261bae1-6ae4-4d33-9dcb-f422f9d5dbec", new Guid("44444444-4444-4444-4444-444444444444"), 7, 420.0, 120.0, 2, "C8" },
                    { "728f8c3f-663c-40e7-aed4-a2cd7f2a6bb0", new Guid("44444444-4444-4444-4444-444444444444"), 7, 420.0, 60.0, 1, "B8" },
                    { "74a4cc8a-4e2c-41e3-8724-2d82c4b2d912", new Guid("33333333-3333-3333-3333-333333333333"), 6, 360.0, 120.0, 2, "C7" },
                    { "759cd405-1291-4f05-be96-a546ea361b97", new Guid("55555555-5555-5555-5555-555555555555"), 1, 60.0, 0.0, 0, "A2" },
                    { "75f0b581-3ffc-49f4-aca9-c7b1f82e6928", new Guid("44444444-4444-4444-4444-444444444444"), 1, 60.0, 0.0, 0, "A2" },
                    { "77e87867-75fe-4b16-8f7a-09a784d5b6cf", new Guid("33333333-3333-3333-3333-333333333333"), 5, 300.0, 120.0, 2, "C6" },
                    { "7df37070-5d2f-4e1a-9c6c-9e95208c481d", new Guid("33333333-3333-3333-3333-333333333333"), 5, 300.0, 180.0, 3, "D6" },
                    { "7e0ffc09-e5fb-4f3a-a87c-395898124350", new Guid("44444444-4444-4444-4444-444444444444"), 0, 0.0, 60.0, 1, "B1" },
                    { "7fa3d12e-14b4-48d2-acd7-2828e5fbd164", new Guid("44444444-4444-4444-4444-444444444444"), 5, 300.0, 180.0, 3, "D6" },
                    { "7fa907ad-eeb3-466e-9e31-f5c33efcbd15", new Guid("44444444-4444-4444-4444-444444444444"), 2, 120.0, 180.0, 3, "D3" },
                    { "811f36f6-6448-4c56-95e1-92774723a60c", new Guid("55555555-5555-5555-5555-555555555555"), 4, 240.0, 60.0, 1, "B5" },
                    { "85c237c8-be9b-4862-8d00-778e57d77144", new Guid("44444444-4444-4444-4444-444444444444"), 1, 60.0, 120.0, 2, "C2" },
                    { "869f3fa9-a204-47cf-814b-66b0689ce0cf", new Guid("33333333-3333-3333-3333-333333333333"), 7, 420.0, 180.0, 3, "D8" },
                    { "8a920867-7308-43b6-b269-136214d525b4", new Guid("33333333-3333-3333-3333-333333333333"), 2, 120.0, 0.0, 0, "A3" },
                    { "8ba90016-96b1-4a0d-9f3b-3ff8888a897d", new Guid("55555555-5555-5555-5555-555555555555"), 1, 60.0, 120.0, 2, "C2" },
                    { "8bf48024-75a6-447e-b312-9d83c5c4eb22", new Guid("44444444-4444-4444-4444-444444444444"), 6, 360.0, 180.0, 3, "D7" },
                    { "8c9bc55e-05fc-4a1d-84d1-d6aa67e300b1", new Guid("33333333-3333-3333-3333-333333333333"), 0, 0.0, 60.0, 1, "B1" },
                    { "8f76aef9-aa4b-46d5-b7d2-9bab7d49735f", new Guid("44444444-4444-4444-4444-444444444444"), 3, 180.0, 0.0, 0, "A4" },
                    { "90ef239a-5c70-46e8-b878-53fa219b4dca", new Guid("55555555-5555-5555-5555-555555555555"), 1, 60.0, 180.0, 3, "D2" },
                    { "925d1eb5-7873-4f3f-a38c-c24d49ca92fa", new Guid("33333333-3333-3333-3333-333333333333"), 1, 60.0, 120.0, 2, "C2" },
                    { "92a10d6a-caa0-4271-9462-fd29bd0cb735", new Guid("33333333-3333-3333-3333-333333333333"), 2, 120.0, 180.0, 3, "D3" },
                    { "93d18932-9f83-4e5b-922b-995e9b0d6f32", new Guid("44444444-4444-4444-4444-444444444444"), 4, 240.0, 180.0, 3, "D5" },
                    { "93e52974-271a-4dad-a556-fa3ee428cd9a", new Guid("44444444-4444-4444-4444-444444444444"), 0, 0.0, 0.0, 0, "A1" },
                    { "94b01968-9e50-4eb4-8633-f17b732f6759", new Guid("55555555-5555-5555-5555-555555555555"), 5, 300.0, 60.0, 1, "B6" },
                    { "9599701b-689a-446b-92f7-a29c268ad30d", new Guid("33333333-3333-3333-3333-333333333333"), 0, 0.0, 120.0, 2, "C1" },
                    { "9692bd41-8153-4888-a1d2-7a82ddb029fe", new Guid("44444444-4444-4444-4444-444444444444"), 0, 0.0, 120.0, 2, "C1" },
                    { "981bbbca-2efa-459c-8083-50724b438bc5", new Guid("55555555-5555-5555-5555-555555555555"), 6, 360.0, 0.0, 0, "A7" },
                    { "9c996384-405f-4a2f-95a3-5131b9991899", new Guid("33333333-3333-3333-3333-333333333333"), 6, 360.0, 60.0, 1, "B7" },
                    { "a870044d-539a-45ca-8b3d-94ebb70af92f", new Guid("44444444-4444-4444-4444-444444444444"), 5, 300.0, 120.0, 2, "C6" },
                    { "a9499c4a-e52c-4f6a-bc4f-590f85fbd8af", new Guid("33333333-3333-3333-3333-333333333333"), 5, 300.0, 60.0, 1, "B6" },
                    { "af9fadb3-37ba-4f91-8c51-90fd731af491", new Guid("44444444-4444-4444-4444-444444444444"), 6, 360.0, 60.0, 1, "B7" },
                    { "b0025438-107e-478d-a201-bd6646f13c98", new Guid("33333333-3333-3333-3333-333333333333"), 0, 0.0, 180.0, 3, "D1" },
                    { "b0274b5a-fcb8-44f4-b75b-6f2c1ba46930", new Guid("55555555-5555-5555-5555-555555555555"), 0, 0.0, 0.0, 0, "A1" },
                    { "b3fa9f27-e3bf-4ee1-a37f-f3fd1687da6c", new Guid("33333333-3333-3333-3333-333333333333"), 1, 60.0, 180.0, 3, "D2" },
                    { "b4dfe1f7-720f-48ed-8e78-77e1cac9a5f9", new Guid("33333333-3333-3333-3333-333333333333"), 4, 240.0, 180.0, 3, "D5" },
                    { "bb8abb9b-601f-4a62-87bd-3910cd4d542c", new Guid("55555555-5555-5555-5555-555555555555"), 4, 240.0, 180.0, 3, "D5" },
                    { "be2906e6-39dd-4a4e-8176-cdb372562687", new Guid("55555555-5555-5555-5555-555555555555"), 2, 120.0, 120.0, 2, "C3" },
                    { "c27b898b-8d57-4cea-ab23-5c096e442c2a", new Guid("44444444-4444-4444-4444-444444444444"), 3, 180.0, 60.0, 1, "B4" },
                    { "c49e24d9-02fe-4722-8f3a-31fe1cf8d3bc", new Guid("33333333-3333-3333-3333-333333333333"), 1, 60.0, 0.0, 0, "A2" },
                    { "c7c79f6f-de06-4301-afdf-a056ecce1621", new Guid("55555555-5555-5555-5555-555555555555"), 4, 240.0, 0.0, 0, "A5" },
                    { "cab5c7ba-a39c-4121-9e7c-66656b321745", new Guid("33333333-3333-3333-3333-333333333333"), 6, 360.0, 0.0, 0, "A7" },
                    { "ccea2c5f-d152-4362-a376-906581e8f19e", new Guid("55555555-5555-5555-5555-555555555555"), 5, 300.0, 0.0, 0, "A6" },
                    { "ccfaf0e2-b364-443e-b6b1-e9d8d408ad7f", new Guid("33333333-3333-3333-3333-333333333333"), 2, 120.0, 60.0, 1, "B3" },
                    { "d4497d2f-be3a-4e0b-91ca-6210c72f6680", new Guid("55555555-5555-5555-5555-555555555555"), 3, 180.0, 180.0, 3, "D4" },
                    { "d7bbfa0c-12ba-456c-83d9-1d8d84dbc675", new Guid("55555555-5555-5555-5555-555555555555"), 0, 0.0, 180.0, 3, "D1" },
                    { "d8e1f324-cfb5-4607-92e5-b44e80085284", new Guid("55555555-5555-5555-5555-555555555555"), 6, 360.0, 120.0, 2, "C7" },
                    { "e474c4a8-b208-40f9-8e07-449c7d925cc1", new Guid("44444444-4444-4444-4444-444444444444"), 4, 240.0, 0.0, 0, "A5" },
                    { "e895c03e-819b-4053-b9fb-a08179949425", new Guid("55555555-5555-5555-5555-555555555555"), 5, 300.0, 120.0, 2, "C6" },
                    { "eae7ae7c-2269-42e5-a052-80ab912cd26d", new Guid("44444444-4444-4444-4444-444444444444"), 1, 60.0, 180.0, 3, "D2" },
                    { "ebe99864-5a94-4ec0-ba1d-820248bbefd0", new Guid("55555555-5555-5555-5555-555555555555"), 7, 420.0, 60.0, 1, "B8" },
                    { "ed84e2ed-a2c9-410e-80f4-c4de9e2a85b7", new Guid("33333333-3333-3333-3333-333333333333"), 4, 240.0, 0.0, 0, "A5" },
                    { "f035e269-9de6-42a7-8c70-62d53c934c87", new Guid("33333333-3333-3333-3333-333333333333"), 7, 420.0, 0.0, 0, "A8" },
                    { "f6b9191a-26db-4f8e-bde4-6b3fc0aff312", new Guid("55555555-5555-5555-5555-555555555555"), 2, 120.0, 0.0, 0, "A3" },
                    { "f87e88c5-f248-4647-aa54-6ee36be479f4", new Guid("55555555-5555-5555-5555-555555555555"), 0, 0.0, 60.0, 1, "B1" },
                    { "f9e42d5d-9dcc-4a02-a84d-8808932608f7", new Guid("44444444-4444-4444-4444-444444444444"), 3, 180.0, 180.0, 3, "D4" },
                    { "fafee727-bc6d-4b80-8427-ab73fc0ae82c", new Guid("44444444-4444-4444-4444-444444444444"), 6, 360.0, 120.0, 2, "C7" },
                    { "fdc20e2c-f52a-4824-bbe3-ab72e78ff8e4", new Guid("55555555-5555-5555-5555-555555555555"), 3, 180.0, 0.0, 0, "A4" },
                    { "fffc5367-ac9f-416e-8cdc-0437be8898f8", new Guid("33333333-3333-3333-3333-333333333333"), 7, 420.0, 60.0, 1, "B8" }
                });

            migrationBuilder.UpdateData(
                table: "UserInfoEntity",
                keyColumn: "UserId",
                keyValue: new Guid("7b5d2c1e-9f8a-3e7b-c1d2-a0e9f8c7b6a5"),
                column: "UserEmail",
                value: "theater.manager@cinema.com");

            migrationBuilder.UpdateData(
                table: "UserInfoEntity",
                keyColumn: "UserId",
                keyValue: new Guid("b2c3d4e5-f6a7-8b9c-d0e1-f2a3b4c5d6e7"),
                column: "UserEmail",
                value: "movie.manager@cinema.com");

            migrationBuilder.UpdateData(
                table: "UserInfoEntity",
                keyColumn: "UserId",
                keyValue: new Guid("f1a0e9b8-d7c6-5e4f-a3b2-1d0c9b8a7f6e"),
                column: "UserEmail",
                value: "facilities.manager@cinema.com");

            migrationBuilder.UpdateData(
                table: "UserProfileEntity",
                keyColumn: "UserId",
                keyValue: new Guid("7b5d2c1e-9f8a-3e7b-c1d2-a0e9f8c7b6a5"),
                column: "UserName",
                value: "Quản Lý Vận Hành Rạp");

            migrationBuilder.UpdateData(
                table: "UserProfileEntity",
                keyColumn: "UserId",
                keyValue: new Guid("b2c3d4e5-f6a7-8b9c-d0e1-f2a3b4c5d6e7"),
                column: "UserName",
                value: "Quản Lý Nội Dung Phim");

            migrationBuilder.UpdateData(
                table: "UserProfileEntity",
                keyColumn: "UserId",
                keyValue: new Guid("e4e1f7d8-c3b2-4a90-8c67-2f5a1b3d9e0c"),
                column: "UserName",
                value: "Tổng Quản Trị Hệ Thống");

            migrationBuilder.UpdateData(
                table: "UserProfileEntity",
                keyColumn: "UserId",
                keyValue: new Guid("f1a0e9b8-d7c6-5e4f-a3b2-1d0c9b8a7f6e"),
                column: "UserName",
                value: "Quản Lý Cơ Sở Vật Chất");

            migrationBuilder.InsertData(
                table: "UserRoleInfoEntity",
                columns: new[] { "RoleId", "UserId" },
                values: new object[,]
                {
                    { new Guid("4d1e0f2a-b7c8-d9e0-f1a2-3b4c5d6e7f8a"), new Guid("e4e1f7d8-c3b2-4a90-8c67-2f5a1b3d9e0c") },
                    { new Guid("5e2f1a3b-c8d9-e0f1-a2b3-4c5d6e7f8a9b"), new Guid("e4e1f7d8-c3b2-4a90-8c67-2f5a1b3d9e0c") },
                    { new Guid("6f3a2b4c-d9e0-f1a2-b3c4-d5e6f7a8b9c0"), new Guid("e4e1f7d8-c3b2-4a90-8c67-2f5a1b3d9e0c") }
                });

            migrationBuilder.InsertData(
                table: "MovieFormatMovieInfoEntity",
                columns: new[] { "FormatId", "MovieId" },
                values: new object[] { new Guid("7a5e82b1-c4d3-4a92-9e11-3f4b52c1a8d9"), new Guid("88888888-8888-8888-8888-888888888888") });

            migrationBuilder.InsertData(
                table: "MovieGenreMovieInfoEntity",
                columns: new[] { "MovieGenreId", "MovieId" },
                values: new object[] { new Guid("d4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f8a"), new Guid("88888888-8888-8888-8888-888888888888") });

            migrationBuilder.CreateIndex(
                name: "IX_MovieInfoEntity_MovieManagerId",
                table: "MovieInfoEntity",
                column: "MovieManagerId");

            migrationBuilder.CreateIndex(
                name: "IX_CinemaInfoEntity_FacilitiesManagerId",
                table: "CinemaInfoEntity",
                column: "FacilitiesManagerId");

            migrationBuilder.CreateIndex(
                name: "IX_CinemaInfoEntity_TheaterManagerId",
                table: "CinemaInfoEntity",
                column: "TheaterManagerId");

            migrationBuilder.AddForeignKey(
                name: "FK_CinemaInfoEntity_UserInfoEntity_FacilitiesManagerId",
                table: "CinemaInfoEntity",
                column: "FacilitiesManagerId",
                principalTable: "UserInfoEntity",
                principalColumn: "UserId",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_CinemaInfoEntity_UserInfoEntity_TheaterManagerId",
                table: "CinemaInfoEntity",
                column: "TheaterManagerId",
                principalTable: "UserInfoEntity",
                principalColumn: "UserId",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_MovieInfoEntity_UserInfoEntity_MovieManagerId",
                table: "MovieInfoEntity",
                column: "MovieManagerId",
                principalTable: "UserInfoEntity",
                principalColumn: "UserId",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_CinemaInfoEntity_UserInfoEntity_FacilitiesManagerId",
                table: "CinemaInfoEntity");

            migrationBuilder.DropForeignKey(
                name: "FK_CinemaInfoEntity_UserInfoEntity_TheaterManagerId",
                table: "CinemaInfoEntity");

            migrationBuilder.DropForeignKey(
                name: "FK_MovieInfoEntity_UserInfoEntity_MovieManagerId",
                table: "MovieInfoEntity");

            migrationBuilder.DropIndex(
                name: "IX_MovieInfoEntity_MovieManagerId",
                table: "MovieInfoEntity");

            migrationBuilder.DropIndex(
                name: "IX_CinemaInfoEntity_FacilitiesManagerId",
                table: "CinemaInfoEntity");

            migrationBuilder.DropIndex(
                name: "IX_CinemaInfoEntity_TheaterManagerId",
                table: "CinemaInfoEntity");

            migrationBuilder.DeleteData(
                table: "CinemaInfoEntity",
                keyColumn: "CinemaId",
                keyValue: new Guid("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"));

            migrationBuilder.DeleteData(
                table: "MovieFormatMovieInfoEntity",
                keyColumns: new[] { "FormatId", "MovieId" },
                keyValues: new object[] { new Guid("d29b0f1c-8e2a-4c5b-bc3d-1a2f3e4d5c6b"), new Guid("77777777-7777-7777-7777-777777777777") });

            migrationBuilder.DeleteData(
                table: "MovieFormatMovieInfoEntity",
                keyColumns: new[] { "FormatId", "MovieId" },
                keyValues: new object[] { new Guid("7a5e82b1-c4d3-4a92-9e11-3f4b52c1a8d9"), new Guid("88888888-8888-8888-8888-888888888888") });

            migrationBuilder.DeleteData(
                table: "MovieGenreMovieInfoEntity",
                keyColumns: new[] { "MovieGenreId", "MovieId" },
                keyValues: new object[] { new Guid("b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e"), new Guid("77777777-7777-7777-7777-777777777777") });

            migrationBuilder.DeleteData(
                table: "MovieGenreMovieInfoEntity",
                keyColumns: new[] { "MovieGenreId", "MovieId" },
                keyValues: new object[] { new Guid("d4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f8a"), new Guid("88888888-8888-8888-8888-888888888888") });

            migrationBuilder.DeleteData(
                table: "MovieScheduleInfoEntity",
                keyColumn: "MovieScheduleInfoId",
                keyValue: new Guid("31ccca9e-3997-4e5e-80bc-aceca09d2566"));

            migrationBuilder.DeleteData(
                table: "MovieScheduleInfoEntity",
                keyColumn: "MovieScheduleInfoId",
                keyValue: new Guid("98ee446e-c0df-4aa2-b96e-4ddaa9111116"));

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "090f59b4-7a66-4845-b3af-deb1d442cf03");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "0c247d3b-9a6c-4b81-8b29-bbdef38097bb");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "0d6fb674-237e-4de4-bb84-610d3e3aa975");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "0d89096a-8b1b-4af0-8a3b-84cd837896ac");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "11fe78ab-95e4-477f-a9f2-1b0d3f715279");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "120709c1-9f79-4471-b486-b6eada2216df");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "1d6c3bd5-8478-4e5f-a346-0c1f3a723bfb");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "1dd8610d-db39-4ab5-85af-50673dc46ac4");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "23568fff-0091-474d-ae2f-94f1a5a9d0fb");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "23e3b142-f451-4d8a-9a15-4da91dd796f9");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "247c65c7-103f-4df3-93f3-a7e007bf7890");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "2e51bf1c-6943-4e16-9eff-c751faa6f472");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "356712d2-9fc7-458b-be03-592c397c344f");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "35f55d1b-37df-4098-bace-d6d7a7cb5aea");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "3958562b-4f90-4569-afcc-a160176494e0");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "3977ba88-1395-41fe-9451-52f4de2b9dd3");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "3ccf69dc-7259-4f6a-a366-5d76fe418210");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "3dce0dbb-0c18-4e21-acb2-c5719acfd13e");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "3e6cb6ef-e511-4e10-9007-ade017d52aed");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "3e8c9fc2-e86c-418b-8bac-db22f7d6242d");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "40ca824f-9d05-47dc-85fe-cf36e5bb26d5");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "413e42bb-a753-4947-b1f6-4126adc41e03");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "415195d8-9540-4c95-9e2f-d8bff25c4498");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "423313b8-6bfa-4233-accc-6a326638362d");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "437cf7de-7b03-42f3-9e43-063facf8eb7a");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "4391fba0-88c4-4942-9cb6-8769837d21fc");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "4860dd50-f9fc-49bb-a611-cf0dc5966815");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "4f51b74f-c29a-476e-9049-a7afad7c04ff");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "4f5da076-3606-4c66-b071-ca9f28884b35");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "510f1d0a-1150-475e-a60c-6c481f305b35");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "5245155b-ccd8-4cd9-b279-a086c929c6ad");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "52c7c0e7-f241-469f-92ba-beff843ca737");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "56cb43db-4c0a-4e7a-9fae-77a54aec9b7b");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "5ce06109-e85c-49aa-a4db-cb83c8d60281");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "60f2db16-9a47-4dc3-885a-f4c7349689b8");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "63ee6db0-5c9e-4b61-a4e7-f8d26c9c7915");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "64a237b0-0428-4b31-949a-495a5ea2be34");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "6bdeb9e0-e6d3-43bb-9f6a-f0236adf91ae");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "7261bae1-6ae4-4d33-9dcb-f422f9d5dbec");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "728f8c3f-663c-40e7-aed4-a2cd7f2a6bb0");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "74a4cc8a-4e2c-41e3-8724-2d82c4b2d912");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "759cd405-1291-4f05-be96-a546ea361b97");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "75f0b581-3ffc-49f4-aca9-c7b1f82e6928");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "77e87867-75fe-4b16-8f7a-09a784d5b6cf");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "7df37070-5d2f-4e1a-9c6c-9e95208c481d");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "7e0ffc09-e5fb-4f3a-a87c-395898124350");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "7fa3d12e-14b4-48d2-acd7-2828e5fbd164");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "7fa907ad-eeb3-466e-9e31-f5c33efcbd15");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "811f36f6-6448-4c56-95e1-92774723a60c");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "85c237c8-be9b-4862-8d00-778e57d77144");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "869f3fa9-a204-47cf-814b-66b0689ce0cf");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "8a920867-7308-43b6-b269-136214d525b4");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "8ba90016-96b1-4a0d-9f3b-3ff8888a897d");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "8bf48024-75a6-447e-b312-9d83c5c4eb22");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "8c9bc55e-05fc-4a1d-84d1-d6aa67e300b1");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "8f76aef9-aa4b-46d5-b7d2-9bab7d49735f");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "90ef239a-5c70-46e8-b878-53fa219b4dca");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "925d1eb5-7873-4f3f-a38c-c24d49ca92fa");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "92a10d6a-caa0-4271-9462-fd29bd0cb735");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "93d18932-9f83-4e5b-922b-995e9b0d6f32");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "93e52974-271a-4dad-a556-fa3ee428cd9a");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "94b01968-9e50-4eb4-8633-f17b732f6759");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "9599701b-689a-446b-92f7-a29c268ad30d");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "9692bd41-8153-4888-a1d2-7a82ddb029fe");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "981bbbca-2efa-459c-8083-50724b438bc5");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "9c996384-405f-4a2f-95a3-5131b9991899");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "a870044d-539a-45ca-8b3d-94ebb70af92f");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "a9499c4a-e52c-4f6a-bc4f-590f85fbd8af");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "af9fadb3-37ba-4f91-8c51-90fd731af491");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "b0025438-107e-478d-a201-bd6646f13c98");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "b0274b5a-fcb8-44f4-b75b-6f2c1ba46930");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "b3fa9f27-e3bf-4ee1-a37f-f3fd1687da6c");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "b4dfe1f7-720f-48ed-8e78-77e1cac9a5f9");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "bb8abb9b-601f-4a62-87bd-3910cd4d542c");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "be2906e6-39dd-4a4e-8176-cdb372562687");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "c27b898b-8d57-4cea-ab23-5c096e442c2a");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "c49e24d9-02fe-4722-8f3a-31fe1cf8d3bc");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "c7c79f6f-de06-4301-afdf-a056ecce1621");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "cab5c7ba-a39c-4121-9e7c-66656b321745");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "ccea2c5f-d152-4362-a376-906581e8f19e");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "ccfaf0e2-b364-443e-b6b1-e9d8d408ad7f");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "d4497d2f-be3a-4e0b-91ca-6210c72f6680");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "d7bbfa0c-12ba-456c-83d9-1d8d84dbc675");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "d8e1f324-cfb5-4607-92e5-b44e80085284");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "e474c4a8-b208-40f9-8e07-449c7d925cc1");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "e895c03e-819b-4053-b9fb-a08179949425");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "eae7ae7c-2269-42e5-a052-80ab912cd26d");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "ebe99864-5a94-4ec0-ba1d-820248bbefd0");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "ed84e2ed-a2c9-410e-80f4-c4de9e2a85b7");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "f035e269-9de6-42a7-8c70-62d53c934c87");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "f6b9191a-26db-4f8e-bde4-6b3fc0aff312");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "f87e88c5-f248-4647-aa54-6ee36be479f4");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "f9e42d5d-9dcc-4a02-a84d-8808932608f7");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "fafee727-bc6d-4b80-8427-ab73fc0ae82c");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "fdc20e2c-f52a-4824-bbe3-ab72e78ff8e4");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "fffc5367-ac9f-416e-8cdc-0437be8898f8");

            migrationBuilder.DeleteData(
                table: "UserRoleInfoEntity",
                keyColumns: new[] { "RoleId", "UserId" },
                keyValues: new object[] { new Guid("4d1e0f2a-b7c8-d9e0-f1a2-3b4c5d6e7f8a"), new Guid("e4e1f7d8-c3b2-4a90-8c67-2f5a1b3d9e0c") });

            migrationBuilder.DeleteData(
                table: "UserRoleInfoEntity",
                keyColumns: new[] { "RoleId", "UserId" },
                keyValues: new object[] { new Guid("5e2f1a3b-c8d9-e0f1-a2b3-4c5d6e7f8a9b"), new Guid("e4e1f7d8-c3b2-4a90-8c67-2f5a1b3d9e0c") });

            migrationBuilder.DeleteData(
                table: "UserRoleInfoEntity",
                keyColumns: new[] { "RoleId", "UserId" },
                keyValues: new object[] { new Guid("6f3a2b4c-d9e0-f1a2-b3c4-d5e6f7a8b9c0"), new Guid("e4e1f7d8-c3b2-4a90-8c67-2f5a1b3d9e0c") });

            migrationBuilder.DeleteData(
                table: "MovieInfoEntity",
                keyColumn: "MovieId",
                keyValue: new Guid("88888888-8888-8888-8888-888888888888"));

            migrationBuilder.DropColumn(
                name: "MovieManagerId",
                table: "MovieInfoEntity");

            migrationBuilder.DropColumn(
                name: "FacilitiesManagerId",
                table: "CinemaInfoEntity");

            migrationBuilder.DropColumn(
                name: "TheaterManagerId",
                table: "CinemaInfoEntity");

            migrationBuilder.AddColumn<Guid>(
                name: "ManagerId",
                table: "MovieInfoEntity",
                type: "uniqueidentifier",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<Guid>(
                name: "ManagerId",
                table: "CinemaInfoEntity",
                type: "uniqueidentifier",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.UpdateData(
                table: "AuditoriumInfoEntities",
                keyColumn: "AuditoriumId",
                keyValue: new Guid("33333333-3333-3333-3333-333333333333"),
                columns: new[] { "AuditoriumNumber", "UpdatedAt" },
                values: new object[] { "Phòng 1 (2D)", new DateTime(2026, 3, 7, 1, 52, 1, 377, DateTimeKind.Local).AddTicks(1316) });

            migrationBuilder.UpdateData(
                table: "AuditoriumInfoEntities",
                keyColumn: "AuditoriumId",
                keyValue: new Guid("44444444-4444-4444-4444-444444444444"),
                columns: new[] { "AuditoriumNumber", "CinemaId", "CreatedByUserId", "UpdatedAt" },
                values: new object[] { "Phòng 2 (IMAX)", new Guid("11111111-1111-1111-1111-111111111111"), new Guid("7b5d2c1e-9f8a-3e7b-c1d2-a0e9f8c7b6a5"), new DateTime(2026, 3, 7, 1, 52, 1, 377, DateTimeKind.Local).AddTicks(1318) });

            migrationBuilder.UpdateData(
                table: "AuditoriumInfoEntities",
                keyColumn: "AuditoriumId",
                keyValue: new Guid("55555555-5555-5555-5555-555555555555"),
                columns: new[] { "AuditoriumNumber", "CinemaId", "CreatedByUserId", "UpdatedAt" },
                values: new object[] { "Phòng 1 (3D)", new Guid("22222222-2222-2222-2222-222222222222"), new Guid("7b5d2c1e-9f8a-3e7b-c1d2-a0e9f8c7b6a5"), new DateTime(2026, 3, 7, 1, 52, 1, 377, DateTimeKind.Local).AddTicks(1321) });

            migrationBuilder.UpdateData(
                table: "CinemaInfoEntity",
                keyColumn: "CinemaId",
                keyValue: new Guid("11111111-1111-1111-1111-111111111111"),
                columns: new[] { "CinemaDescription", "CinemaHotLineNumber", "CinemaLocation", "CinemaName", "ManagerId", "UpdatedAt" },
                values: new object[] { "Rạp chiếu phim hiện đại nhất Việt Nam", "1900 6017", "Tầng B1, Vincom Center Landmark 81, 772 Điện Biên Phủ, P.22, Q. Bình Thạnh", "CGV Vincom Center Landmark 81", new Guid("7b5d2c1e-9f8a-3e7b-c1d2-a0e9f8c7b6a5"), new DateTime(2026, 3, 7, 1, 52, 1, 377, DateTimeKind.Local).AddTicks(1279) });

            migrationBuilder.UpdateData(
                table: "CinemaInfoEntity",
                keyColumn: "CinemaId",
                keyValue: new Guid("22222222-2222-2222-2222-222222222222"),
                columns: new[] { "CinemaDescription", "CinemaHotLineNumber", "CinemaLocation", "CinemaName", "ManagerId", "UpdatedAt" },
                values: new object[] { "Trải nghiệm điện ảnh đỉnh cao", "0243837800", "Tầng 5 Keangnam Hanoi Landmark Tower, E6 Phạm Hùng", "Lotte Cinema Landmark", new Guid("7b5d2c1e-9f8a-3e7b-c1d2-a0e9f8c7b6a5"), new DateTime(2026, 3, 7, 1, 52, 1, 377, DateTimeKind.Local).AddTicks(1284) });

            migrationBuilder.InsertData(
                table: "MovieFormatMovieInfoEntity",
                columns: new[] { "FormatId", "MovieId" },
                values: new object[,]
                {
                    { new Guid("d29b0f1c-8e2a-4c5b-bc3d-1a2f3e4d5c6b"), new Guid("66666666-6666-6666-6666-666666666666") },
                    { new Guid("3fbc4a32-15f5-47e0-b98a-784f1b8a9612"), new Guid("77777777-7777-7777-7777-777777777777") },
                    { new Guid("7a5e82b1-c4d3-4a92-9e11-3f4b52c1a8d9"), new Guid("77777777-7777-7777-7777-777777777777") }
                });

            migrationBuilder.InsertData(
                table: "MovieGenreMovieInfoEntity",
                columns: new[] { "MovieGenreId", "MovieId" },
                values: new object[,]
                {
                    { new Guid("a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d"), new Guid("77777777-7777-7777-7777-777777777777") },
                    { new Guid("d4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f8a"), new Guid("66666666-6666-6666-6666-666666666666") },
                    { new Guid("f6a7b8c9-d0e1-4f2a-3b4c-5d6e7f8a9b0c"), new Guid("77777777-7777-7777-7777-777777777777") }
                });

            migrationBuilder.UpdateData(
                table: "MovieInfoEntity",
                keyColumn: "MovieId",
                keyValue: new Guid("66666666-6666-6666-6666-666666666666"),
                columns: new[] { "ActiveAt", "Actors", "Director", "EndedDate", "ManagerId", "MovieDescription", "MovieDuration", "MovieImageUrl", "MovieName", "TrailerUrl", "UpdatedAt" },
                values: new object[] { new DateTime(2026, 2, 25, 1, 52, 1, 377, DateTimeKind.Local).AddTicks(1248), "Timothée Chalamet, Zendaya, Rebecca Ferguson", "Denis Villeneuve", new DateTime(2026, 3, 27, 1, 52, 1, 377, DateTimeKind.Local).AddTicks(1248), new Guid("b2c3d4e5-f6a7-8b9c-d0e1-f2a3b4c5d6e7"), "Paul Atreides unites with Chani and the Fremen while on a warpath of revenge against the conspirators who destroyed his family.", 166, "https://res.cloudinary.com/dp6utffzy/image/upload/v170000000/dune2_poster", "Dune: Part Two", "https://www.youtube.com/watch?v=Way9Dexny3w", new DateTime(2026, 3, 7, 1, 52, 1, 377, DateTimeKind.Local).AddTicks(1676) });

            migrationBuilder.UpdateData(
                table: "MovieInfoEntity",
                keyColumn: "MovieId",
                keyValue: new Guid("77777777-7777-7777-7777-777777777777"),
                columns: new[] { "ActiveAt", "Actors", "CreatedByUserId", "Director", "EndedDate", "ManagerId", "MovieDescription", "MovieDuration", "MovieImageUrl", "MovieName", "MovieRequiredAgeId", "TrailerUrl", "UpdatedAt" },
                values: new object[] { new DateTime(2026, 3, 12, 1, 52, 1, 377, DateTimeKind.Local).AddTicks(1248), "Jack Black, Awkwafina, Viola Davis", new Guid("b2c3d4e5-f6a7-8b9c-d0e1-f2a3b4c5d6e7"), "Mike Mitchell", new DateTime(2026, 4, 11, 1, 52, 1, 377, DateTimeKind.Local).AddTicks(1248), new Guid("b2c3d4e5-f6a7-8b9c-d0e1-f2a3b4c5d6e7"), "After Po is tapped to become the Spiritual Leader of the Valley of Peace, he needs to find and train a new Dragon Warrior.", 94, "https://res.cloudinary.com/dp6utffzy/image/upload/v170000000/kfp4_poster", "Kung Fu Panda 4", new Guid("7a2f4b1d-9c3e-4d5a-8b2c-6f1e0a9d4b5c"), "https://www.youtube.com/watch?v=_inKs4eeHiI", new DateTime(2026, 3, 7, 1, 52, 1, 377, DateTimeKind.Local).AddTicks(1704) });

            migrationBuilder.InsertData(
                table: "MovieScheduleInfoEntity",
                columns: new[] { "MovieScheduleInfoId", "ActiveAt", "AuditoriumId", "CreatedAt", "CreatedByUserId", "DeletedAt", "DeletedByUserId", "EndedTime", "IsActive", "IsDeleted", "MovieFormatId", "MovieId", "StartTime", "UpdatedAt", "UpdatedByUserId" },
                values: new object[,]
                {
                    { new Guid("00000000-0000-0000-0000-000000000001"), new DateTime(2026, 3, 7, 22, 0, 0, 0, DateTimeKind.Unspecified), new Guid("33333333-3333-3333-3333-333333333333"), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new Guid("7b5d2c1e-9f8a-3e7b-c1d2-a0e9f8c7b6a5"), null, null, new DateTime(2026, 3, 8, 0, 46, 0, 0, DateTimeKind.Unspecified), true, false, new Guid("3fbc4a32-15f5-47e0-b98a-784f1b8a9612"), new Guid("66666666-6666-6666-6666-666666666666"), new DateTime(2026, 3, 7, 22, 0, 0, 0, DateTimeKind.Unspecified), new DateTime(2026, 3, 7, 1, 52, 1, 377, DateTimeKind.Local).AddTicks(1810), null },
                    { new Guid("00000000-0000-0000-0000-000000000002"), new DateTime(2026, 3, 7, 20, 0, 0, 0, DateTimeKind.Unspecified), new Guid("44444444-4444-4444-4444-444444444444"), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new Guid("7b5d2c1e-9f8a-3e7b-c1d2-a0e9f8c7b6a5"), null, null, new DateTime(2026, 3, 7, 22, 46, 0, 0, DateTimeKind.Unspecified), true, false, new Guid("d29b0f1c-8e2a-4c5b-bc3d-1a2f3e4d5c6b"), new Guid("66666666-6666-6666-6666-666666666666"), new DateTime(2026, 3, 7, 20, 0, 0, 0, DateTimeKind.Unspecified), new DateTime(2026, 3, 7, 1, 52, 1, 377, DateTimeKind.Local).AddTicks(1816), null },
                    { new Guid("00000000-0000-0000-0000-000000000003"), new DateTime(2026, 3, 7, 22, 30, 0, 0, DateTimeKind.Unspecified), new Guid("55555555-5555-5555-5555-555555555555"), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new Guid("7b5d2c1e-9f8a-3e7b-c1d2-a0e9f8c7b6a5"), null, null, new DateTime(2026, 3, 8, 1, 16, 0, 0, DateTimeKind.Unspecified), true, false, new Guid("7a5e82b1-c4d3-4a92-9e11-3f4b52c1a8d9"), new Guid("66666666-6666-6666-6666-666666666666"), new DateTime(2026, 3, 7, 22, 30, 0, 0, DateTimeKind.Unspecified), new DateTime(2026, 3, 7, 1, 52, 1, 377, DateTimeKind.Local).AddTicks(1820), null },
                    { new Guid("00000000-0000-0000-0000-000000000004"), new DateTime(2026, 3, 7, 14, 0, 0, 0, DateTimeKind.Unspecified), new Guid("55555555-5555-5555-5555-555555555555"), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new Guid("7b5d2c1e-9f8a-3e7b-c1d2-a0e9f8c7b6a5"), null, null, new DateTime(2026, 3, 7, 15, 34, 0, 0, DateTimeKind.Unspecified), true, false, new Guid("7a5e82b1-c4d3-4a92-9e11-3f4b52c1a8d9"), new Guid("77777777-7777-7777-7777-777777777777"), new DateTime(2026, 3, 7, 14, 0, 0, 0, DateTimeKind.Unspecified), new DateTime(2026, 3, 7, 1, 52, 1, 377, DateTimeKind.Local).AddTicks(1823), null },
                    { new Guid("00000001-0000-0000-0000-000000000001"), new DateTime(2026, 3, 8, 22, 0, 0, 0, DateTimeKind.Unspecified), new Guid("33333333-3333-3333-3333-333333333333"), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new Guid("7b5d2c1e-9f8a-3e7b-c1d2-a0e9f8c7b6a5"), null, null, new DateTime(2026, 3, 9, 0, 46, 0, 0, DateTimeKind.Unspecified), true, false, new Guid("3fbc4a32-15f5-47e0-b98a-784f1b8a9612"), new Guid("66666666-6666-6666-6666-666666666666"), new DateTime(2026, 3, 8, 22, 0, 0, 0, DateTimeKind.Unspecified), new DateTime(2026, 3, 7, 1, 52, 1, 377, DateTimeKind.Local).AddTicks(1827), null },
                    { new Guid("00000001-0000-0000-0000-000000000002"), new DateTime(2026, 3, 8, 20, 0, 0, 0, DateTimeKind.Unspecified), new Guid("44444444-4444-4444-4444-444444444444"), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new Guid("7b5d2c1e-9f8a-3e7b-c1d2-a0e9f8c7b6a5"), null, null, new DateTime(2026, 3, 8, 22, 46, 0, 0, DateTimeKind.Unspecified), true, false, new Guid("d29b0f1c-8e2a-4c5b-bc3d-1a2f3e4d5c6b"), new Guid("66666666-6666-6666-6666-666666666666"), new DateTime(2026, 3, 8, 20, 0, 0, 0, DateTimeKind.Unspecified), new DateTime(2026, 3, 7, 1, 52, 1, 377, DateTimeKind.Local).AddTicks(1829), null },
                    { new Guid("00000001-0000-0000-0000-000000000003"), new DateTime(2026, 3, 8, 22, 30, 0, 0, DateTimeKind.Unspecified), new Guid("55555555-5555-5555-5555-555555555555"), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new Guid("7b5d2c1e-9f8a-3e7b-c1d2-a0e9f8c7b6a5"), null, null, new DateTime(2026, 3, 9, 1, 16, 0, 0, DateTimeKind.Unspecified), true, false, new Guid("7a5e82b1-c4d3-4a92-9e11-3f4b52c1a8d9"), new Guid("66666666-6666-6666-6666-666666666666"), new DateTime(2026, 3, 8, 22, 30, 0, 0, DateTimeKind.Unspecified), new DateTime(2026, 3, 7, 1, 52, 1, 377, DateTimeKind.Local).AddTicks(1837), null },
                    { new Guid("00000001-0000-0000-0000-000000000004"), new DateTime(2026, 3, 8, 14, 0, 0, 0, DateTimeKind.Unspecified), new Guid("55555555-5555-5555-5555-555555555555"), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new Guid("7b5d2c1e-9f8a-3e7b-c1d2-a0e9f8c7b6a5"), null, null, new DateTime(2026, 3, 8, 15, 34, 0, 0, DateTimeKind.Unspecified), true, false, new Guid("7a5e82b1-c4d3-4a92-9e11-3f4b52c1a8d9"), new Guid("77777777-7777-7777-7777-777777777777"), new DateTime(2026, 3, 8, 14, 0, 0, 0, DateTimeKind.Unspecified), new DateTime(2026, 3, 7, 1, 52, 1, 377, DateTimeKind.Local).AddTicks(1839), null },
                    { new Guid("00000002-0000-0000-0000-000000000001"), new DateTime(2026, 3, 9, 22, 0, 0, 0, DateTimeKind.Unspecified), new Guid("33333333-3333-3333-3333-333333333333"), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new Guid("7b5d2c1e-9f8a-3e7b-c1d2-a0e9f8c7b6a5"), null, null, new DateTime(2026, 3, 10, 0, 46, 0, 0, DateTimeKind.Unspecified), true, false, new Guid("3fbc4a32-15f5-47e0-b98a-784f1b8a9612"), new Guid("66666666-6666-6666-6666-666666666666"), new DateTime(2026, 3, 9, 22, 0, 0, 0, DateTimeKind.Unspecified), new DateTime(2026, 3, 7, 1, 52, 1, 377, DateTimeKind.Local).AddTicks(1841), null },
                    { new Guid("00000002-0000-0000-0000-000000000002"), new DateTime(2026, 3, 9, 20, 0, 0, 0, DateTimeKind.Unspecified), new Guid("44444444-4444-4444-4444-444444444444"), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new Guid("7b5d2c1e-9f8a-3e7b-c1d2-a0e9f8c7b6a5"), null, null, new DateTime(2026, 3, 9, 22, 46, 0, 0, DateTimeKind.Unspecified), true, false, new Guid("d29b0f1c-8e2a-4c5b-bc3d-1a2f3e4d5c6b"), new Guid("66666666-6666-6666-6666-666666666666"), new DateTime(2026, 3, 9, 20, 0, 0, 0, DateTimeKind.Unspecified), new DateTime(2026, 3, 7, 1, 52, 1, 377, DateTimeKind.Local).AddTicks(1843), null },
                    { new Guid("00000002-0000-0000-0000-000000000003"), new DateTime(2026, 3, 9, 22, 30, 0, 0, DateTimeKind.Unspecified), new Guid("55555555-5555-5555-5555-555555555555"), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new Guid("7b5d2c1e-9f8a-3e7b-c1d2-a0e9f8c7b6a5"), null, null, new DateTime(2026, 3, 10, 1, 16, 0, 0, DateTimeKind.Unspecified), true, false, new Guid("7a5e82b1-c4d3-4a92-9e11-3f4b52c1a8d9"), new Guid("66666666-6666-6666-6666-666666666666"), new DateTime(2026, 3, 9, 22, 30, 0, 0, DateTimeKind.Unspecified), new DateTime(2026, 3, 7, 1, 52, 1, 377, DateTimeKind.Local).AddTicks(1847), null },
                    { new Guid("00000002-0000-0000-0000-000000000004"), new DateTime(2026, 3, 9, 14, 0, 0, 0, DateTimeKind.Unspecified), new Guid("55555555-5555-5555-5555-555555555555"), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new Guid("7b5d2c1e-9f8a-3e7b-c1d2-a0e9f8c7b6a5"), null, null, new DateTime(2026, 3, 9, 15, 34, 0, 0, DateTimeKind.Unspecified), true, false, new Guid("7a5e82b1-c4d3-4a92-9e11-3f4b52c1a8d9"), new Guid("77777777-7777-7777-7777-777777777777"), new DateTime(2026, 3, 9, 14, 0, 0, 0, DateTimeKind.Unspecified), new DateTime(2026, 3, 7, 1, 52, 1, 377, DateTimeKind.Local).AddTicks(1850), null },
                    { new Guid("00000003-0000-0000-0000-000000000001"), new DateTime(2026, 3, 10, 22, 0, 0, 0, DateTimeKind.Unspecified), new Guid("33333333-3333-3333-3333-333333333333"), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new Guid("7b5d2c1e-9f8a-3e7b-c1d2-a0e9f8c7b6a5"), null, null, new DateTime(2026, 3, 11, 0, 46, 0, 0, DateTimeKind.Unspecified), true, false, new Guid("3fbc4a32-15f5-47e0-b98a-784f1b8a9612"), new Guid("66666666-6666-6666-6666-666666666666"), new DateTime(2026, 3, 10, 22, 0, 0, 0, DateTimeKind.Unspecified), new DateTime(2026, 3, 7, 1, 52, 1, 377, DateTimeKind.Local).AddTicks(1852), null },
                    { new Guid("00000003-0000-0000-0000-000000000002"), new DateTime(2026, 3, 10, 20, 0, 0, 0, DateTimeKind.Unspecified), new Guid("44444444-4444-4444-4444-444444444444"), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new Guid("7b5d2c1e-9f8a-3e7b-c1d2-a0e9f8c7b6a5"), null, null, new DateTime(2026, 3, 10, 22, 46, 0, 0, DateTimeKind.Unspecified), true, false, new Guid("d29b0f1c-8e2a-4c5b-bc3d-1a2f3e4d5c6b"), new Guid("66666666-6666-6666-6666-666666666666"), new DateTime(2026, 3, 10, 20, 0, 0, 0, DateTimeKind.Unspecified), new DateTime(2026, 3, 7, 1, 52, 1, 377, DateTimeKind.Local).AddTicks(1854), null },
                    { new Guid("00000003-0000-0000-0000-000000000003"), new DateTime(2026, 3, 10, 22, 30, 0, 0, DateTimeKind.Unspecified), new Guid("55555555-5555-5555-5555-555555555555"), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new Guid("7b5d2c1e-9f8a-3e7b-c1d2-a0e9f8c7b6a5"), null, null, new DateTime(2026, 3, 11, 1, 16, 0, 0, DateTimeKind.Unspecified), true, false, new Guid("7a5e82b1-c4d3-4a92-9e11-3f4b52c1a8d9"), new Guid("66666666-6666-6666-6666-666666666666"), new DateTime(2026, 3, 10, 22, 30, 0, 0, DateTimeKind.Unspecified), new DateTime(2026, 3, 7, 1, 52, 1, 377, DateTimeKind.Local).AddTicks(1856), null },
                    { new Guid("00000003-0000-0000-0000-000000000004"), new DateTime(2026, 3, 10, 14, 0, 0, 0, DateTimeKind.Unspecified), new Guid("55555555-5555-5555-5555-555555555555"), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new Guid("7b5d2c1e-9f8a-3e7b-c1d2-a0e9f8c7b6a5"), null, null, new DateTime(2026, 3, 10, 15, 34, 0, 0, DateTimeKind.Unspecified), true, false, new Guid("7a5e82b1-c4d3-4a92-9e11-3f4b52c1a8d9"), new Guid("77777777-7777-7777-7777-777777777777"), new DateTime(2026, 3, 10, 14, 0, 0, 0, DateTimeKind.Unspecified), new DateTime(2026, 3, 7, 1, 52, 1, 377, DateTimeKind.Local).AddTicks(1858), null },
                    { new Guid("00000004-0000-0000-0000-000000000001"), new DateTime(2026, 3, 11, 22, 0, 0, 0, DateTimeKind.Unspecified), new Guid("33333333-3333-3333-3333-333333333333"), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new Guid("7b5d2c1e-9f8a-3e7b-c1d2-a0e9f8c7b6a5"), null, null, new DateTime(2026, 3, 12, 0, 46, 0, 0, DateTimeKind.Unspecified), true, false, new Guid("3fbc4a32-15f5-47e0-b98a-784f1b8a9612"), new Guid("66666666-6666-6666-6666-666666666666"), new DateTime(2026, 3, 11, 22, 0, 0, 0, DateTimeKind.Unspecified), new DateTime(2026, 3, 7, 1, 52, 1, 377, DateTimeKind.Local).AddTicks(1860), null },
                    { new Guid("00000004-0000-0000-0000-000000000002"), new DateTime(2026, 3, 11, 20, 0, 0, 0, DateTimeKind.Unspecified), new Guid("44444444-4444-4444-4444-444444444444"), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new Guid("7b5d2c1e-9f8a-3e7b-c1d2-a0e9f8c7b6a5"), null, null, new DateTime(2026, 3, 11, 22, 46, 0, 0, DateTimeKind.Unspecified), true, false, new Guid("d29b0f1c-8e2a-4c5b-bc3d-1a2f3e4d5c6b"), new Guid("66666666-6666-6666-6666-666666666666"), new DateTime(2026, 3, 11, 20, 0, 0, 0, DateTimeKind.Unspecified), new DateTime(2026, 3, 7, 1, 52, 1, 377, DateTimeKind.Local).AddTicks(1862), null },
                    { new Guid("00000004-0000-0000-0000-000000000003"), new DateTime(2026, 3, 11, 22, 30, 0, 0, DateTimeKind.Unspecified), new Guid("55555555-5555-5555-5555-555555555555"), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new Guid("7b5d2c1e-9f8a-3e7b-c1d2-a0e9f8c7b6a5"), null, null, new DateTime(2026, 3, 12, 1, 16, 0, 0, DateTimeKind.Unspecified), true, false, new Guid("7a5e82b1-c4d3-4a92-9e11-3f4b52c1a8d9"), new Guid("66666666-6666-6666-6666-666666666666"), new DateTime(2026, 3, 11, 22, 30, 0, 0, DateTimeKind.Unspecified), new DateTime(2026, 3, 7, 1, 52, 1, 377, DateTimeKind.Local).AddTicks(1867), null },
                    { new Guid("00000004-0000-0000-0000-000000000004"), new DateTime(2026, 3, 11, 14, 0, 0, 0, DateTimeKind.Unspecified), new Guid("55555555-5555-5555-5555-555555555555"), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new Guid("7b5d2c1e-9f8a-3e7b-c1d2-a0e9f8c7b6a5"), null, null, new DateTime(2026, 3, 11, 15, 34, 0, 0, DateTimeKind.Unspecified), true, false, new Guid("7a5e82b1-c4d3-4a92-9e11-3f4b52c1a8d9"), new Guid("77777777-7777-7777-7777-777777777777"), new DateTime(2026, 3, 11, 14, 0, 0, 0, DateTimeKind.Unspecified), new DateTime(2026, 3, 7, 1, 52, 1, 377, DateTimeKind.Local).AddTicks(1869), null },
                    { new Guid("00000005-0000-0000-0000-000000000001"), new DateTime(2026, 3, 12, 22, 0, 0, 0, DateTimeKind.Unspecified), new Guid("33333333-3333-3333-3333-333333333333"), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new Guid("7b5d2c1e-9f8a-3e7b-c1d2-a0e9f8c7b6a5"), null, null, new DateTime(2026, 3, 13, 0, 46, 0, 0, DateTimeKind.Unspecified), true, false, new Guid("3fbc4a32-15f5-47e0-b98a-784f1b8a9612"), new Guid("66666666-6666-6666-6666-666666666666"), new DateTime(2026, 3, 12, 22, 0, 0, 0, DateTimeKind.Unspecified), new DateTime(2026, 3, 7, 1, 52, 1, 377, DateTimeKind.Local).AddTicks(1871), null },
                    { new Guid("00000005-0000-0000-0000-000000000002"), new DateTime(2026, 3, 12, 20, 0, 0, 0, DateTimeKind.Unspecified), new Guid("44444444-4444-4444-4444-444444444444"), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new Guid("7b5d2c1e-9f8a-3e7b-c1d2-a0e9f8c7b6a5"), null, null, new DateTime(2026, 3, 12, 22, 46, 0, 0, DateTimeKind.Unspecified), true, false, new Guid("d29b0f1c-8e2a-4c5b-bc3d-1a2f3e4d5c6b"), new Guid("66666666-6666-6666-6666-666666666666"), new DateTime(2026, 3, 12, 20, 0, 0, 0, DateTimeKind.Unspecified), new DateTime(2026, 3, 7, 1, 52, 1, 377, DateTimeKind.Local).AddTicks(1873), null },
                    { new Guid("00000005-0000-0000-0000-000000000003"), new DateTime(2026, 3, 12, 22, 30, 0, 0, DateTimeKind.Unspecified), new Guid("55555555-5555-5555-5555-555555555555"), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new Guid("7b5d2c1e-9f8a-3e7b-c1d2-a0e9f8c7b6a5"), null, null, new DateTime(2026, 3, 13, 1, 16, 0, 0, DateTimeKind.Unspecified), true, false, new Guid("7a5e82b1-c4d3-4a92-9e11-3f4b52c1a8d9"), new Guid("66666666-6666-6666-6666-666666666666"), new DateTime(2026, 3, 12, 22, 30, 0, 0, DateTimeKind.Unspecified), new DateTime(2026, 3, 7, 1, 52, 1, 377, DateTimeKind.Local).AddTicks(1875), null },
                    { new Guid("00000005-0000-0000-0000-000000000004"), new DateTime(2026, 3, 12, 14, 0, 0, 0, DateTimeKind.Unspecified), new Guid("55555555-5555-5555-5555-555555555555"), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new Guid("7b5d2c1e-9f8a-3e7b-c1d2-a0e9f8c7b6a5"), null, null, new DateTime(2026, 3, 12, 15, 34, 0, 0, DateTimeKind.Unspecified), true, false, new Guid("7a5e82b1-c4d3-4a92-9e11-3f4b52c1a8d9"), new Guid("77777777-7777-7777-7777-777777777777"), new DateTime(2026, 3, 12, 14, 0, 0, 0, DateTimeKind.Unspecified), new DateTime(2026, 3, 7, 1, 52, 1, 377, DateTimeKind.Local).AddTicks(1877), null },
                    { new Guid("00000006-0000-0000-0000-000000000001"), new DateTime(2026, 3, 13, 22, 0, 0, 0, DateTimeKind.Unspecified), new Guid("33333333-3333-3333-3333-333333333333"), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new Guid("7b5d2c1e-9f8a-3e7b-c1d2-a0e9f8c7b6a5"), null, null, new DateTime(2026, 3, 14, 0, 46, 0, 0, DateTimeKind.Unspecified), true, false, new Guid("3fbc4a32-15f5-47e0-b98a-784f1b8a9612"), new Guid("66666666-6666-6666-6666-666666666666"), new DateTime(2026, 3, 13, 22, 0, 0, 0, DateTimeKind.Unspecified), new DateTime(2026, 3, 7, 1, 52, 1, 377, DateTimeKind.Local).AddTicks(1879), null },
                    { new Guid("00000006-0000-0000-0000-000000000002"), new DateTime(2026, 3, 13, 20, 0, 0, 0, DateTimeKind.Unspecified), new Guid("44444444-4444-4444-4444-444444444444"), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new Guid("7b5d2c1e-9f8a-3e7b-c1d2-a0e9f8c7b6a5"), null, null, new DateTime(2026, 3, 13, 22, 46, 0, 0, DateTimeKind.Unspecified), true, false, new Guid("d29b0f1c-8e2a-4c5b-bc3d-1a2f3e4d5c6b"), new Guid("66666666-6666-6666-6666-666666666666"), new DateTime(2026, 3, 13, 20, 0, 0, 0, DateTimeKind.Unspecified), new DateTime(2026, 3, 7, 1, 52, 1, 377, DateTimeKind.Local).AddTicks(1881), null },
                    { new Guid("00000006-0000-0000-0000-000000000003"), new DateTime(2026, 3, 13, 22, 30, 0, 0, DateTimeKind.Unspecified), new Guid("55555555-5555-5555-5555-555555555555"), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new Guid("7b5d2c1e-9f8a-3e7b-c1d2-a0e9f8c7b6a5"), null, null, new DateTime(2026, 3, 14, 1, 16, 0, 0, DateTimeKind.Unspecified), true, false, new Guid("7a5e82b1-c4d3-4a92-9e11-3f4b52c1a8d9"), new Guid("66666666-6666-6666-6666-666666666666"), new DateTime(2026, 3, 13, 22, 30, 0, 0, DateTimeKind.Unspecified), new DateTime(2026, 3, 7, 1, 52, 1, 377, DateTimeKind.Local).AddTicks(1883), null },
                    { new Guid("00000006-0000-0000-0000-000000000004"), new DateTime(2026, 3, 13, 14, 0, 0, 0, DateTimeKind.Unspecified), new Guid("55555555-5555-5555-5555-555555555555"), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new Guid("7b5d2c1e-9f8a-3e7b-c1d2-a0e9f8c7b6a5"), null, null, new DateTime(2026, 3, 13, 15, 34, 0, 0, DateTimeKind.Unspecified), true, false, new Guid("7a5e82b1-c4d3-4a92-9e11-3f4b52c1a8d9"), new Guid("77777777-7777-7777-7777-777777777777"), new DateTime(2026, 3, 13, 14, 0, 0, 0, DateTimeKind.Unspecified), new DateTime(2026, 3, 7, 1, 52, 1, 377, DateTimeKind.Local).AddTicks(1928), null },
                    { new Guid("00000007-0000-0000-0000-000000000001"), new DateTime(2026, 3, 14, 22, 0, 0, 0, DateTimeKind.Unspecified), new Guid("33333333-3333-3333-3333-333333333333"), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new Guid("7b5d2c1e-9f8a-3e7b-c1d2-a0e9f8c7b6a5"), null, null, new DateTime(2026, 3, 15, 0, 46, 0, 0, DateTimeKind.Unspecified), true, false, new Guid("3fbc4a32-15f5-47e0-b98a-784f1b8a9612"), new Guid("66666666-6666-6666-6666-666666666666"), new DateTime(2026, 3, 14, 22, 0, 0, 0, DateTimeKind.Unspecified), new DateTime(2026, 3, 7, 1, 52, 1, 377, DateTimeKind.Local).AddTicks(1933), null },
                    { new Guid("00000007-0000-0000-0000-000000000002"), new DateTime(2026, 3, 14, 20, 0, 0, 0, DateTimeKind.Unspecified), new Guid("44444444-4444-4444-4444-444444444444"), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new Guid("7b5d2c1e-9f8a-3e7b-c1d2-a0e9f8c7b6a5"), null, null, new DateTime(2026, 3, 14, 22, 46, 0, 0, DateTimeKind.Unspecified), true, false, new Guid("d29b0f1c-8e2a-4c5b-bc3d-1a2f3e4d5c6b"), new Guid("66666666-6666-6666-6666-666666666666"), new DateTime(2026, 3, 14, 20, 0, 0, 0, DateTimeKind.Unspecified), new DateTime(2026, 3, 7, 1, 52, 1, 377, DateTimeKind.Local).AddTicks(1935), null },
                    { new Guid("00000007-0000-0000-0000-000000000003"), new DateTime(2026, 3, 14, 22, 30, 0, 0, DateTimeKind.Unspecified), new Guid("55555555-5555-5555-5555-555555555555"), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new Guid("7b5d2c1e-9f8a-3e7b-c1d2-a0e9f8c7b6a5"), null, null, new DateTime(2026, 3, 15, 1, 16, 0, 0, DateTimeKind.Unspecified), true, false, new Guid("7a5e82b1-c4d3-4a92-9e11-3f4b52c1a8d9"), new Guid("66666666-6666-6666-6666-666666666666"), new DateTime(2026, 3, 14, 22, 30, 0, 0, DateTimeKind.Unspecified), new DateTime(2026, 3, 7, 1, 52, 1, 377, DateTimeKind.Local).AddTicks(1937), null },
                    { new Guid("00000007-0000-0000-0000-000000000004"), new DateTime(2026, 3, 14, 14, 0, 0, 0, DateTimeKind.Unspecified), new Guid("55555555-5555-5555-5555-555555555555"), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new Guid("7b5d2c1e-9f8a-3e7b-c1d2-a0e9f8c7b6a5"), null, null, new DateTime(2026, 3, 14, 15, 34, 0, 0, DateTimeKind.Unspecified), true, false, new Guid("7a5e82b1-c4d3-4a92-9e11-3f4b52c1a8d9"), new Guid("77777777-7777-7777-7777-777777777777"), new DateTime(2026, 3, 14, 14, 0, 0, 0, DateTimeKind.Unspecified), new DateTime(2026, 3, 7, 1, 52, 1, 377, DateTimeKind.Local).AddTicks(1938), null },
                    { new Guid("00000008-0000-0000-0000-000000000001"), new DateTime(2026, 3, 15, 22, 0, 0, 0, DateTimeKind.Unspecified), new Guid("33333333-3333-3333-3333-333333333333"), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new Guid("7b5d2c1e-9f8a-3e7b-c1d2-a0e9f8c7b6a5"), null, null, new DateTime(2026, 3, 16, 0, 46, 0, 0, DateTimeKind.Unspecified), true, false, new Guid("3fbc4a32-15f5-47e0-b98a-784f1b8a9612"), new Guid("66666666-6666-6666-6666-666666666666"), new DateTime(2026, 3, 15, 22, 0, 0, 0, DateTimeKind.Unspecified), new DateTime(2026, 3, 7, 1, 52, 1, 377, DateTimeKind.Local).AddTicks(1941), null },
                    { new Guid("00000008-0000-0000-0000-000000000002"), new DateTime(2026, 3, 15, 20, 0, 0, 0, DateTimeKind.Unspecified), new Guid("44444444-4444-4444-4444-444444444444"), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new Guid("7b5d2c1e-9f8a-3e7b-c1d2-a0e9f8c7b6a5"), null, null, new DateTime(2026, 3, 15, 22, 46, 0, 0, DateTimeKind.Unspecified), true, false, new Guid("d29b0f1c-8e2a-4c5b-bc3d-1a2f3e4d5c6b"), new Guid("66666666-6666-6666-6666-666666666666"), new DateTime(2026, 3, 15, 20, 0, 0, 0, DateTimeKind.Unspecified), new DateTime(2026, 3, 7, 1, 52, 1, 377, DateTimeKind.Local).AddTicks(1944), null },
                    { new Guid("00000008-0000-0000-0000-000000000003"), new DateTime(2026, 3, 15, 22, 30, 0, 0, DateTimeKind.Unspecified), new Guid("55555555-5555-5555-5555-555555555555"), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new Guid("7b5d2c1e-9f8a-3e7b-c1d2-a0e9f8c7b6a5"), null, null, new DateTime(2026, 3, 16, 1, 16, 0, 0, DateTimeKind.Unspecified), true, false, new Guid("7a5e82b1-c4d3-4a92-9e11-3f4b52c1a8d9"), new Guid("66666666-6666-6666-6666-666666666666"), new DateTime(2026, 3, 15, 22, 30, 0, 0, DateTimeKind.Unspecified), new DateTime(2026, 3, 7, 1, 52, 1, 377, DateTimeKind.Local).AddTicks(1946), null },
                    { new Guid("00000008-0000-0000-0000-000000000004"), new DateTime(2026, 3, 15, 14, 0, 0, 0, DateTimeKind.Unspecified), new Guid("55555555-5555-5555-5555-555555555555"), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new Guid("7b5d2c1e-9f8a-3e7b-c1d2-a0e9f8c7b6a5"), null, null, new DateTime(2026, 3, 15, 15, 34, 0, 0, DateTimeKind.Unspecified), true, false, new Guid("7a5e82b1-c4d3-4a92-9e11-3f4b52c1a8d9"), new Guid("77777777-7777-7777-7777-777777777777"), new DateTime(2026, 3, 15, 14, 0, 0, 0, DateTimeKind.Unspecified), new DateTime(2026, 3, 7, 1, 52, 1, 377, DateTimeKind.Local).AddTicks(1948), null },
                    { new Guid("00000009-0000-0000-0000-000000000001"), new DateTime(2026, 3, 16, 22, 0, 0, 0, DateTimeKind.Unspecified), new Guid("33333333-3333-3333-3333-333333333333"), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new Guid("7b5d2c1e-9f8a-3e7b-c1d2-a0e9f8c7b6a5"), null, null, new DateTime(2026, 3, 17, 0, 46, 0, 0, DateTimeKind.Unspecified), true, false, new Guid("3fbc4a32-15f5-47e0-b98a-784f1b8a9612"), new Guid("66666666-6666-6666-6666-666666666666"), new DateTime(2026, 3, 16, 22, 0, 0, 0, DateTimeKind.Unspecified), new DateTime(2026, 3, 7, 1, 52, 1, 377, DateTimeKind.Local).AddTicks(1950), null },
                    { new Guid("00000009-0000-0000-0000-000000000002"), new DateTime(2026, 3, 16, 20, 0, 0, 0, DateTimeKind.Unspecified), new Guid("44444444-4444-4444-4444-444444444444"), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new Guid("7b5d2c1e-9f8a-3e7b-c1d2-a0e9f8c7b6a5"), null, null, new DateTime(2026, 3, 16, 22, 46, 0, 0, DateTimeKind.Unspecified), true, false, new Guid("d29b0f1c-8e2a-4c5b-bc3d-1a2f3e4d5c6b"), new Guid("66666666-6666-6666-6666-666666666666"), new DateTime(2026, 3, 16, 20, 0, 0, 0, DateTimeKind.Unspecified), new DateTime(2026, 3, 7, 1, 52, 1, 377, DateTimeKind.Local).AddTicks(1952), null },
                    { new Guid("00000009-0000-0000-0000-000000000003"), new DateTime(2026, 3, 16, 22, 30, 0, 0, DateTimeKind.Unspecified), new Guid("55555555-5555-5555-5555-555555555555"), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new Guid("7b5d2c1e-9f8a-3e7b-c1d2-a0e9f8c7b6a5"), null, null, new DateTime(2026, 3, 17, 1, 16, 0, 0, DateTimeKind.Unspecified), true, false, new Guid("7a5e82b1-c4d3-4a92-9e11-3f4b52c1a8d9"), new Guid("66666666-6666-6666-6666-666666666666"), new DateTime(2026, 3, 16, 22, 30, 0, 0, DateTimeKind.Unspecified), new DateTime(2026, 3, 7, 1, 52, 1, 377, DateTimeKind.Local).AddTicks(1954), null },
                    { new Guid("00000009-0000-0000-0000-000000000004"), new DateTime(2026, 3, 16, 14, 0, 0, 0, DateTimeKind.Unspecified), new Guid("55555555-5555-5555-5555-555555555555"), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new Guid("7b5d2c1e-9f8a-3e7b-c1d2-a0e9f8c7b6a5"), null, null, new DateTime(2026, 3, 16, 15, 34, 0, 0, DateTimeKind.Unspecified), true, false, new Guid("7a5e82b1-c4d3-4a92-9e11-3f4b52c1a8d9"), new Guid("77777777-7777-7777-7777-777777777777"), new DateTime(2026, 3, 16, 14, 0, 0, 0, DateTimeKind.Unspecified), new DateTime(2026, 3, 7, 1, 52, 1, 377, DateTimeKind.Local).AddTicks(1956), null },
                    { new Guid("0000000a-0000-0000-0000-000000000001"), new DateTime(2026, 3, 17, 22, 0, 0, 0, DateTimeKind.Unspecified), new Guid("33333333-3333-3333-3333-333333333333"), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new Guid("7b5d2c1e-9f8a-3e7b-c1d2-a0e9f8c7b6a5"), null, null, new DateTime(2026, 3, 18, 0, 46, 0, 0, DateTimeKind.Unspecified), true, false, new Guid("3fbc4a32-15f5-47e0-b98a-784f1b8a9612"), new Guid("66666666-6666-6666-6666-666666666666"), new DateTime(2026, 3, 17, 22, 0, 0, 0, DateTimeKind.Unspecified), new DateTime(2026, 3, 7, 1, 52, 1, 377, DateTimeKind.Local).AddTicks(1958), null },
                    { new Guid("0000000a-0000-0000-0000-000000000002"), new DateTime(2026, 3, 17, 20, 0, 0, 0, DateTimeKind.Unspecified), new Guid("44444444-4444-4444-4444-444444444444"), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new Guid("7b5d2c1e-9f8a-3e7b-c1d2-a0e9f8c7b6a5"), null, null, new DateTime(2026, 3, 17, 22, 46, 0, 0, DateTimeKind.Unspecified), true, false, new Guid("d29b0f1c-8e2a-4c5b-bc3d-1a2f3e4d5c6b"), new Guid("66666666-6666-6666-6666-666666666666"), new DateTime(2026, 3, 17, 20, 0, 0, 0, DateTimeKind.Unspecified), new DateTime(2026, 3, 7, 1, 52, 1, 377, DateTimeKind.Local).AddTicks(1959), null },
                    { new Guid("0000000a-0000-0000-0000-000000000003"), new DateTime(2026, 3, 17, 22, 30, 0, 0, DateTimeKind.Unspecified), new Guid("55555555-5555-5555-5555-555555555555"), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new Guid("7b5d2c1e-9f8a-3e7b-c1d2-a0e9f8c7b6a5"), null, null, new DateTime(2026, 3, 18, 1, 16, 0, 0, DateTimeKind.Unspecified), true, false, new Guid("7a5e82b1-c4d3-4a92-9e11-3f4b52c1a8d9"), new Guid("66666666-6666-6666-6666-666666666666"), new DateTime(2026, 3, 17, 22, 30, 0, 0, DateTimeKind.Unspecified), new DateTime(2026, 3, 7, 1, 52, 1, 377, DateTimeKind.Local).AddTicks(1961), null },
                    { new Guid("0000000a-0000-0000-0000-000000000004"), new DateTime(2026, 3, 17, 14, 0, 0, 0, DateTimeKind.Unspecified), new Guid("55555555-5555-5555-5555-555555555555"), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new Guid("7b5d2c1e-9f8a-3e7b-c1d2-a0e9f8c7b6a5"), null, null, new DateTime(2026, 3, 17, 15, 34, 0, 0, DateTimeKind.Unspecified), true, false, new Guid("7a5e82b1-c4d3-4a92-9e11-3f4b52c1a8d9"), new Guid("77777777-7777-7777-7777-777777777777"), new DateTime(2026, 3, 17, 14, 0, 0, 0, DateTimeKind.Unspecified), new DateTime(2026, 3, 7, 1, 52, 1, 377, DateTimeKind.Local).AddTicks(1963), null },
                    { new Guid("0000000b-0000-0000-0000-000000000001"), new DateTime(2026, 3, 18, 22, 0, 0, 0, DateTimeKind.Unspecified), new Guid("33333333-3333-3333-3333-333333333333"), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new Guid("7b5d2c1e-9f8a-3e7b-c1d2-a0e9f8c7b6a5"), null, null, new DateTime(2026, 3, 19, 0, 46, 0, 0, DateTimeKind.Unspecified), true, false, new Guid("3fbc4a32-15f5-47e0-b98a-784f1b8a9612"), new Guid("66666666-6666-6666-6666-666666666666"), new DateTime(2026, 3, 18, 22, 0, 0, 0, DateTimeKind.Unspecified), new DateTime(2026, 3, 7, 1, 52, 1, 377, DateTimeKind.Local).AddTicks(1965), null },
                    { new Guid("0000000b-0000-0000-0000-000000000002"), new DateTime(2026, 3, 18, 20, 0, 0, 0, DateTimeKind.Unspecified), new Guid("44444444-4444-4444-4444-444444444444"), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new Guid("7b5d2c1e-9f8a-3e7b-c1d2-a0e9f8c7b6a5"), null, null, new DateTime(2026, 3, 18, 22, 46, 0, 0, DateTimeKind.Unspecified), true, false, new Guid("d29b0f1c-8e2a-4c5b-bc3d-1a2f3e4d5c6b"), new Guid("66666666-6666-6666-6666-666666666666"), new DateTime(2026, 3, 18, 20, 0, 0, 0, DateTimeKind.Unspecified), new DateTime(2026, 3, 7, 1, 52, 1, 377, DateTimeKind.Local).AddTicks(1967), null },
                    { new Guid("0000000b-0000-0000-0000-000000000003"), new DateTime(2026, 3, 18, 22, 30, 0, 0, DateTimeKind.Unspecified), new Guid("55555555-5555-5555-5555-555555555555"), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new Guid("7b5d2c1e-9f8a-3e7b-c1d2-a0e9f8c7b6a5"), null, null, new DateTime(2026, 3, 19, 1, 16, 0, 0, DateTimeKind.Unspecified), true, false, new Guid("7a5e82b1-c4d3-4a92-9e11-3f4b52c1a8d9"), new Guid("66666666-6666-6666-6666-666666666666"), new DateTime(2026, 3, 18, 22, 30, 0, 0, DateTimeKind.Unspecified), new DateTime(2026, 3, 7, 1, 52, 1, 377, DateTimeKind.Local).AddTicks(1968), null },
                    { new Guid("0000000b-0000-0000-0000-000000000004"), new DateTime(2026, 3, 18, 14, 0, 0, 0, DateTimeKind.Unspecified), new Guid("55555555-5555-5555-5555-555555555555"), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new Guid("7b5d2c1e-9f8a-3e7b-c1d2-a0e9f8c7b6a5"), null, null, new DateTime(2026, 3, 18, 15, 34, 0, 0, DateTimeKind.Unspecified), true, false, new Guid("7a5e82b1-c4d3-4a92-9e11-3f4b52c1a8d9"), new Guid("77777777-7777-7777-7777-777777777777"), new DateTime(2026, 3, 18, 14, 0, 0, 0, DateTimeKind.Unspecified), new DateTime(2026, 3, 7, 1, 52, 1, 377, DateTimeKind.Local).AddTicks(1970), null },
                    { new Guid("0000000c-0000-0000-0000-000000000001"), new DateTime(2026, 3, 19, 22, 0, 0, 0, DateTimeKind.Unspecified), new Guid("33333333-3333-3333-3333-333333333333"), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new Guid("7b5d2c1e-9f8a-3e7b-c1d2-a0e9f8c7b6a5"), null, null, new DateTime(2026, 3, 20, 0, 46, 0, 0, DateTimeKind.Unspecified), true, false, new Guid("3fbc4a32-15f5-47e0-b98a-784f1b8a9612"), new Guid("66666666-6666-6666-6666-666666666666"), new DateTime(2026, 3, 19, 22, 0, 0, 0, DateTimeKind.Unspecified), new DateTime(2026, 3, 7, 1, 52, 1, 377, DateTimeKind.Local).AddTicks(1972), null },
                    { new Guid("0000000c-0000-0000-0000-000000000002"), new DateTime(2026, 3, 19, 20, 0, 0, 0, DateTimeKind.Unspecified), new Guid("44444444-4444-4444-4444-444444444444"), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new Guid("7b5d2c1e-9f8a-3e7b-c1d2-a0e9f8c7b6a5"), null, null, new DateTime(2026, 3, 19, 22, 46, 0, 0, DateTimeKind.Unspecified), true, false, new Guid("d29b0f1c-8e2a-4c5b-bc3d-1a2f3e4d5c6b"), new Guid("66666666-6666-6666-6666-666666666666"), new DateTime(2026, 3, 19, 20, 0, 0, 0, DateTimeKind.Unspecified), new DateTime(2026, 3, 7, 1, 52, 1, 377, DateTimeKind.Local).AddTicks(1974), null },
                    { new Guid("0000000c-0000-0000-0000-000000000003"), new DateTime(2026, 3, 19, 22, 30, 0, 0, DateTimeKind.Unspecified), new Guid("55555555-5555-5555-5555-555555555555"), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new Guid("7b5d2c1e-9f8a-3e7b-c1d2-a0e9f8c7b6a5"), null, null, new DateTime(2026, 3, 20, 1, 16, 0, 0, DateTimeKind.Unspecified), true, false, new Guid("7a5e82b1-c4d3-4a92-9e11-3f4b52c1a8d9"), new Guid("66666666-6666-6666-6666-666666666666"), new DateTime(2026, 3, 19, 22, 30, 0, 0, DateTimeKind.Unspecified), new DateTime(2026, 3, 7, 1, 52, 1, 377, DateTimeKind.Local).AddTicks(1976), null },
                    { new Guid("0000000c-0000-0000-0000-000000000004"), new DateTime(2026, 3, 19, 14, 0, 0, 0, DateTimeKind.Unspecified), new Guid("55555555-5555-5555-5555-555555555555"), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new Guid("7b5d2c1e-9f8a-3e7b-c1d2-a0e9f8c7b6a5"), null, null, new DateTime(2026, 3, 19, 15, 34, 0, 0, DateTimeKind.Unspecified), true, false, new Guid("7a5e82b1-c4d3-4a92-9e11-3f4b52c1a8d9"), new Guid("77777777-7777-7777-7777-777777777777"), new DateTime(2026, 3, 19, 14, 0, 0, 0, DateTimeKind.Unspecified), new DateTime(2026, 3, 7, 1, 52, 1, 377, DateTimeKind.Local).AddTicks(1978), null },
                    { new Guid("0000000d-0000-0000-0000-000000000001"), new DateTime(2026, 3, 20, 22, 0, 0, 0, DateTimeKind.Unspecified), new Guid("33333333-3333-3333-3333-333333333333"), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new Guid("7b5d2c1e-9f8a-3e7b-c1d2-a0e9f8c7b6a5"), null, null, new DateTime(2026, 3, 21, 0, 46, 0, 0, DateTimeKind.Unspecified), true, false, new Guid("3fbc4a32-15f5-47e0-b98a-784f1b8a9612"), new Guid("66666666-6666-6666-6666-666666666666"), new DateTime(2026, 3, 20, 22, 0, 0, 0, DateTimeKind.Unspecified), new DateTime(2026, 3, 7, 1, 52, 1, 377, DateTimeKind.Local).AddTicks(1980), null },
                    { new Guid("0000000d-0000-0000-0000-000000000002"), new DateTime(2026, 3, 20, 20, 0, 0, 0, DateTimeKind.Unspecified), new Guid("44444444-4444-4444-4444-444444444444"), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new Guid("7b5d2c1e-9f8a-3e7b-c1d2-a0e9f8c7b6a5"), null, null, new DateTime(2026, 3, 20, 22, 46, 0, 0, DateTimeKind.Unspecified), true, false, new Guid("d29b0f1c-8e2a-4c5b-bc3d-1a2f3e4d5c6b"), new Guid("66666666-6666-6666-6666-666666666666"), new DateTime(2026, 3, 20, 20, 0, 0, 0, DateTimeKind.Unspecified), new DateTime(2026, 3, 7, 1, 52, 1, 377, DateTimeKind.Local).AddTicks(1981), null },
                    { new Guid("0000000d-0000-0000-0000-000000000003"), new DateTime(2026, 3, 20, 22, 30, 0, 0, DateTimeKind.Unspecified), new Guid("55555555-5555-5555-5555-555555555555"), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new Guid("7b5d2c1e-9f8a-3e7b-c1d2-a0e9f8c7b6a5"), null, null, new DateTime(2026, 3, 21, 1, 16, 0, 0, DateTimeKind.Unspecified), true, false, new Guid("7a5e82b1-c4d3-4a92-9e11-3f4b52c1a8d9"), new Guid("66666666-6666-6666-6666-666666666666"), new DateTime(2026, 3, 20, 22, 30, 0, 0, DateTimeKind.Unspecified), new DateTime(2026, 3, 7, 1, 52, 1, 377, DateTimeKind.Local).AddTicks(1983), null },
                    { new Guid("0000000d-0000-0000-0000-000000000004"), new DateTime(2026, 3, 20, 14, 0, 0, 0, DateTimeKind.Unspecified), new Guid("55555555-5555-5555-5555-555555555555"), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new Guid("7b5d2c1e-9f8a-3e7b-c1d2-a0e9f8c7b6a5"), null, null, new DateTime(2026, 3, 20, 15, 34, 0, 0, DateTimeKind.Unspecified), true, false, new Guid("7a5e82b1-c4d3-4a92-9e11-3f4b52c1a8d9"), new Guid("77777777-7777-7777-7777-777777777777"), new DateTime(2026, 3, 20, 14, 0, 0, 0, DateTimeKind.Unspecified), new DateTime(2026, 3, 7, 1, 52, 1, 377, DateTimeKind.Local).AddTicks(1985), null },
                    { new Guid("0000000e-0000-0000-0000-000000000001"), new DateTime(2026, 3, 21, 22, 0, 0, 0, DateTimeKind.Unspecified), new Guid("33333333-3333-3333-3333-333333333333"), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new Guid("7b5d2c1e-9f8a-3e7b-c1d2-a0e9f8c7b6a5"), null, null, new DateTime(2026, 3, 22, 0, 46, 0, 0, DateTimeKind.Unspecified), true, false, new Guid("3fbc4a32-15f5-47e0-b98a-784f1b8a9612"), new Guid("66666666-6666-6666-6666-666666666666"), new DateTime(2026, 3, 21, 22, 0, 0, 0, DateTimeKind.Unspecified), new DateTime(2026, 3, 7, 1, 52, 1, 377, DateTimeKind.Local).AddTicks(2002), null },
                    { new Guid("0000000e-0000-0000-0000-000000000002"), new DateTime(2026, 3, 21, 20, 0, 0, 0, DateTimeKind.Unspecified), new Guid("44444444-4444-4444-4444-444444444444"), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new Guid("7b5d2c1e-9f8a-3e7b-c1d2-a0e9f8c7b6a5"), null, null, new DateTime(2026, 3, 21, 22, 46, 0, 0, DateTimeKind.Unspecified), true, false, new Guid("d29b0f1c-8e2a-4c5b-bc3d-1a2f3e4d5c6b"), new Guid("66666666-6666-6666-6666-666666666666"), new DateTime(2026, 3, 21, 20, 0, 0, 0, DateTimeKind.Unspecified), new DateTime(2026, 3, 7, 1, 52, 1, 377, DateTimeKind.Local).AddTicks(2004), null },
                    { new Guid("0000000e-0000-0000-0000-000000000003"), new DateTime(2026, 3, 21, 22, 30, 0, 0, DateTimeKind.Unspecified), new Guid("55555555-5555-5555-5555-555555555555"), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new Guid("7b5d2c1e-9f8a-3e7b-c1d2-a0e9f8c7b6a5"), null, null, new DateTime(2026, 3, 22, 1, 16, 0, 0, DateTimeKind.Unspecified), true, false, new Guid("7a5e82b1-c4d3-4a92-9e11-3f4b52c1a8d9"), new Guid("66666666-6666-6666-6666-666666666666"), new DateTime(2026, 3, 21, 22, 30, 0, 0, DateTimeKind.Unspecified), new DateTime(2026, 3, 7, 1, 52, 1, 377, DateTimeKind.Local).AddTicks(2006), null },
                    { new Guid("0000000e-0000-0000-0000-000000000004"), new DateTime(2026, 3, 21, 14, 0, 0, 0, DateTimeKind.Unspecified), new Guid("55555555-5555-5555-5555-555555555555"), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new Guid("7b5d2c1e-9f8a-3e7b-c1d2-a0e9f8c7b6a5"), null, null, new DateTime(2026, 3, 21, 15, 34, 0, 0, DateTimeKind.Unspecified), true, false, new Guid("7a5e82b1-c4d3-4a92-9e11-3f4b52c1a8d9"), new Guid("77777777-7777-7777-7777-777777777777"), new DateTime(2026, 3, 21, 14, 0, 0, 0, DateTimeKind.Unspecified), new DateTime(2026, 3, 7, 1, 52, 1, 377, DateTimeKind.Local).AddTicks(2008), null },
                    { new Guid("0000000f-0000-0000-0000-000000000001"), new DateTime(2026, 3, 22, 22, 0, 0, 0, DateTimeKind.Unspecified), new Guid("33333333-3333-3333-3333-333333333333"), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new Guid("7b5d2c1e-9f8a-3e7b-c1d2-a0e9f8c7b6a5"), null, null, new DateTime(2026, 3, 23, 0, 46, 0, 0, DateTimeKind.Unspecified), true, false, new Guid("3fbc4a32-15f5-47e0-b98a-784f1b8a9612"), new Guid("66666666-6666-6666-6666-666666666666"), new DateTime(2026, 3, 22, 22, 0, 0, 0, DateTimeKind.Unspecified), new DateTime(2026, 3, 7, 1, 52, 1, 377, DateTimeKind.Local).AddTicks(2010), null },
                    { new Guid("0000000f-0000-0000-0000-000000000002"), new DateTime(2026, 3, 22, 20, 0, 0, 0, DateTimeKind.Unspecified), new Guid("44444444-4444-4444-4444-444444444444"), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new Guid("7b5d2c1e-9f8a-3e7b-c1d2-a0e9f8c7b6a5"), null, null, new DateTime(2026, 3, 22, 22, 46, 0, 0, DateTimeKind.Unspecified), true, false, new Guid("d29b0f1c-8e2a-4c5b-bc3d-1a2f3e4d5c6b"), new Guid("66666666-6666-6666-6666-666666666666"), new DateTime(2026, 3, 22, 20, 0, 0, 0, DateTimeKind.Unspecified), new DateTime(2026, 3, 7, 1, 52, 1, 377, DateTimeKind.Local).AddTicks(2011), null },
                    { new Guid("0000000f-0000-0000-0000-000000000003"), new DateTime(2026, 3, 22, 22, 30, 0, 0, DateTimeKind.Unspecified), new Guid("55555555-5555-5555-5555-555555555555"), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new Guid("7b5d2c1e-9f8a-3e7b-c1d2-a0e9f8c7b6a5"), null, null, new DateTime(2026, 3, 23, 1, 16, 0, 0, DateTimeKind.Unspecified), true, false, new Guid("7a5e82b1-c4d3-4a92-9e11-3f4b52c1a8d9"), new Guid("66666666-6666-6666-6666-666666666666"), new DateTime(2026, 3, 22, 22, 30, 0, 0, DateTimeKind.Unspecified), new DateTime(2026, 3, 7, 1, 52, 1, 377, DateTimeKind.Local).AddTicks(2013), null },
                    { new Guid("0000000f-0000-0000-0000-000000000004"), new DateTime(2026, 3, 22, 14, 0, 0, 0, DateTimeKind.Unspecified), new Guid("55555555-5555-5555-5555-555555555555"), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new Guid("7b5d2c1e-9f8a-3e7b-c1d2-a0e9f8c7b6a5"), null, null, new DateTime(2026, 3, 22, 15, 34, 0, 0, DateTimeKind.Unspecified), true, false, new Guid("7a5e82b1-c4d3-4a92-9e11-3f4b52c1a8d9"), new Guid("77777777-7777-7777-7777-777777777777"), new DateTime(2026, 3, 22, 14, 0, 0, 0, DateTimeKind.Unspecified), new DateTime(2026, 3, 7, 1, 52, 1, 377, DateTimeKind.Local).AddTicks(2015), null },
                    { new Guid("00000010-0000-0000-0000-000000000001"), new DateTime(2026, 3, 23, 22, 0, 0, 0, DateTimeKind.Unspecified), new Guid("33333333-3333-3333-3333-333333333333"), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new Guid("7b5d2c1e-9f8a-3e7b-c1d2-a0e9f8c7b6a5"), null, null, new DateTime(2026, 3, 24, 0, 46, 0, 0, DateTimeKind.Unspecified), true, false, new Guid("3fbc4a32-15f5-47e0-b98a-784f1b8a9612"), new Guid("66666666-6666-6666-6666-666666666666"), new DateTime(2026, 3, 23, 22, 0, 0, 0, DateTimeKind.Unspecified), new DateTime(2026, 3, 7, 1, 52, 1, 377, DateTimeKind.Local).AddTicks(2017), null },
                    { new Guid("00000010-0000-0000-0000-000000000002"), new DateTime(2026, 3, 23, 20, 0, 0, 0, DateTimeKind.Unspecified), new Guid("44444444-4444-4444-4444-444444444444"), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new Guid("7b5d2c1e-9f8a-3e7b-c1d2-a0e9f8c7b6a5"), null, null, new DateTime(2026, 3, 23, 22, 46, 0, 0, DateTimeKind.Unspecified), true, false, new Guid("d29b0f1c-8e2a-4c5b-bc3d-1a2f3e4d5c6b"), new Guid("66666666-6666-6666-6666-666666666666"), new DateTime(2026, 3, 23, 20, 0, 0, 0, DateTimeKind.Unspecified), new DateTime(2026, 3, 7, 1, 52, 1, 377, DateTimeKind.Local).AddTicks(2020), null },
                    { new Guid("00000010-0000-0000-0000-000000000003"), new DateTime(2026, 3, 23, 22, 30, 0, 0, DateTimeKind.Unspecified), new Guid("55555555-5555-5555-5555-555555555555"), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new Guid("7b5d2c1e-9f8a-3e7b-c1d2-a0e9f8c7b6a5"), null, null, new DateTime(2026, 3, 24, 1, 16, 0, 0, DateTimeKind.Unspecified), true, false, new Guid("7a5e82b1-c4d3-4a92-9e11-3f4b52c1a8d9"), new Guid("66666666-6666-6666-6666-666666666666"), new DateTime(2026, 3, 23, 22, 30, 0, 0, DateTimeKind.Unspecified), new DateTime(2026, 3, 7, 1, 52, 1, 377, DateTimeKind.Local).AddTicks(2022), null },
                    { new Guid("00000010-0000-0000-0000-000000000004"), new DateTime(2026, 3, 23, 14, 0, 0, 0, DateTimeKind.Unspecified), new Guid("55555555-5555-5555-5555-555555555555"), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new Guid("7b5d2c1e-9f8a-3e7b-c1d2-a0e9f8c7b6a5"), null, null, new DateTime(2026, 3, 23, 15, 34, 0, 0, DateTimeKind.Unspecified), true, false, new Guid("7a5e82b1-c4d3-4a92-9e11-3f4b52c1a8d9"), new Guid("77777777-7777-7777-7777-777777777777"), new DateTime(2026, 3, 23, 14, 0, 0, 0, DateTimeKind.Unspecified), new DateTime(2026, 3, 7, 1, 52, 1, 377, DateTimeKind.Local).AddTicks(2024), null },
                    { new Guid("00000011-0000-0000-0000-000000000001"), new DateTime(2026, 3, 24, 22, 0, 0, 0, DateTimeKind.Unspecified), new Guid("33333333-3333-3333-3333-333333333333"), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new Guid("7b5d2c1e-9f8a-3e7b-c1d2-a0e9f8c7b6a5"), null, null, new DateTime(2026, 3, 25, 0, 46, 0, 0, DateTimeKind.Unspecified), true, false, new Guid("3fbc4a32-15f5-47e0-b98a-784f1b8a9612"), new Guid("66666666-6666-6666-6666-666666666666"), new DateTime(2026, 3, 24, 22, 0, 0, 0, DateTimeKind.Unspecified), new DateTime(2026, 3, 7, 1, 52, 1, 377, DateTimeKind.Local).AddTicks(2026), null },
                    { new Guid("00000011-0000-0000-0000-000000000002"), new DateTime(2026, 3, 24, 20, 0, 0, 0, DateTimeKind.Unspecified), new Guid("44444444-4444-4444-4444-444444444444"), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new Guid("7b5d2c1e-9f8a-3e7b-c1d2-a0e9f8c7b6a5"), null, null, new DateTime(2026, 3, 24, 22, 46, 0, 0, DateTimeKind.Unspecified), true, false, new Guid("d29b0f1c-8e2a-4c5b-bc3d-1a2f3e4d5c6b"), new Guid("66666666-6666-6666-6666-666666666666"), new DateTime(2026, 3, 24, 20, 0, 0, 0, DateTimeKind.Unspecified), new DateTime(2026, 3, 7, 1, 52, 1, 377, DateTimeKind.Local).AddTicks(2027), null },
                    { new Guid("00000011-0000-0000-0000-000000000003"), new DateTime(2026, 3, 24, 22, 30, 0, 0, DateTimeKind.Unspecified), new Guid("55555555-5555-5555-5555-555555555555"), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new Guid("7b5d2c1e-9f8a-3e7b-c1d2-a0e9f8c7b6a5"), null, null, new DateTime(2026, 3, 25, 1, 16, 0, 0, DateTimeKind.Unspecified), true, false, new Guid("7a5e82b1-c4d3-4a92-9e11-3f4b52c1a8d9"), new Guid("66666666-6666-6666-6666-666666666666"), new DateTime(2026, 3, 24, 22, 30, 0, 0, DateTimeKind.Unspecified), new DateTime(2026, 3, 7, 1, 52, 1, 377, DateTimeKind.Local).AddTicks(2029), null },
                    { new Guid("00000011-0000-0000-0000-000000000004"), new DateTime(2026, 3, 24, 14, 0, 0, 0, DateTimeKind.Unspecified), new Guid("55555555-5555-5555-5555-555555555555"), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new Guid("7b5d2c1e-9f8a-3e7b-c1d2-a0e9f8c7b6a5"), null, null, new DateTime(2026, 3, 24, 15, 34, 0, 0, DateTimeKind.Unspecified), true, false, new Guid("7a5e82b1-c4d3-4a92-9e11-3f4b52c1a8d9"), new Guid("77777777-7777-7777-7777-777777777777"), new DateTime(2026, 3, 24, 14, 0, 0, 0, DateTimeKind.Unspecified), new DateTime(2026, 3, 7, 1, 52, 1, 377, DateTimeKind.Local).AddTicks(2031), null },
                    { new Guid("00000012-0000-0000-0000-000000000001"), new DateTime(2026, 3, 25, 22, 0, 0, 0, DateTimeKind.Unspecified), new Guid("33333333-3333-3333-3333-333333333333"), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new Guid("7b5d2c1e-9f8a-3e7b-c1d2-a0e9f8c7b6a5"), null, null, new DateTime(2026, 3, 26, 0, 46, 0, 0, DateTimeKind.Unspecified), true, false, new Guid("3fbc4a32-15f5-47e0-b98a-784f1b8a9612"), new Guid("66666666-6666-6666-6666-666666666666"), new DateTime(2026, 3, 25, 22, 0, 0, 0, DateTimeKind.Unspecified), new DateTime(2026, 3, 7, 1, 52, 1, 377, DateTimeKind.Local).AddTicks(2033), null },
                    { new Guid("00000012-0000-0000-0000-000000000002"), new DateTime(2026, 3, 25, 20, 0, 0, 0, DateTimeKind.Unspecified), new Guid("44444444-4444-4444-4444-444444444444"), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new Guid("7b5d2c1e-9f8a-3e7b-c1d2-a0e9f8c7b6a5"), null, null, new DateTime(2026, 3, 25, 22, 46, 0, 0, DateTimeKind.Unspecified), true, false, new Guid("d29b0f1c-8e2a-4c5b-bc3d-1a2f3e4d5c6b"), new Guid("66666666-6666-6666-6666-666666666666"), new DateTime(2026, 3, 25, 20, 0, 0, 0, DateTimeKind.Unspecified), new DateTime(2026, 3, 7, 1, 52, 1, 377, DateTimeKind.Local).AddTicks(2035), null },
                    { new Guid("00000012-0000-0000-0000-000000000003"), new DateTime(2026, 3, 25, 22, 30, 0, 0, DateTimeKind.Unspecified), new Guid("55555555-5555-5555-5555-555555555555"), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new Guid("7b5d2c1e-9f8a-3e7b-c1d2-a0e9f8c7b6a5"), null, null, new DateTime(2026, 3, 26, 1, 16, 0, 0, DateTimeKind.Unspecified), true, false, new Guid("7a5e82b1-c4d3-4a92-9e11-3f4b52c1a8d9"), new Guid("66666666-6666-6666-6666-666666666666"), new DateTime(2026, 3, 25, 22, 30, 0, 0, DateTimeKind.Unspecified), new DateTime(2026, 3, 7, 1, 52, 1, 377, DateTimeKind.Local).AddTicks(2036), null },
                    { new Guid("00000012-0000-0000-0000-000000000004"), new DateTime(2026, 3, 25, 14, 0, 0, 0, DateTimeKind.Unspecified), new Guid("55555555-5555-5555-5555-555555555555"), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new Guid("7b5d2c1e-9f8a-3e7b-c1d2-a0e9f8c7b6a5"), null, null, new DateTime(2026, 3, 25, 15, 34, 0, 0, DateTimeKind.Unspecified), true, false, new Guid("7a5e82b1-c4d3-4a92-9e11-3f4b52c1a8d9"), new Guid("77777777-7777-7777-7777-777777777777"), new DateTime(2026, 3, 25, 14, 0, 0, 0, DateTimeKind.Unspecified), new DateTime(2026, 3, 7, 1, 52, 1, 377, DateTimeKind.Local).AddTicks(2038), null },
                    { new Guid("00000013-0000-0000-0000-000000000001"), new DateTime(2026, 3, 26, 22, 0, 0, 0, DateTimeKind.Unspecified), new Guid("33333333-3333-3333-3333-333333333333"), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new Guid("7b5d2c1e-9f8a-3e7b-c1d2-a0e9f8c7b6a5"), null, null, new DateTime(2026, 3, 27, 0, 46, 0, 0, DateTimeKind.Unspecified), true, false, new Guid("3fbc4a32-15f5-47e0-b98a-784f1b8a9612"), new Guid("66666666-6666-6666-6666-666666666666"), new DateTime(2026, 3, 26, 22, 0, 0, 0, DateTimeKind.Unspecified), new DateTime(2026, 3, 7, 1, 52, 1, 377, DateTimeKind.Local).AddTicks(2041), null },
                    { new Guid("00000013-0000-0000-0000-000000000002"), new DateTime(2026, 3, 26, 20, 0, 0, 0, DateTimeKind.Unspecified), new Guid("44444444-4444-4444-4444-444444444444"), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new Guid("7b5d2c1e-9f8a-3e7b-c1d2-a0e9f8c7b6a5"), null, null, new DateTime(2026, 3, 26, 22, 46, 0, 0, DateTimeKind.Unspecified), true, false, new Guid("d29b0f1c-8e2a-4c5b-bc3d-1a2f3e4d5c6b"), new Guid("66666666-6666-6666-6666-666666666666"), new DateTime(2026, 3, 26, 20, 0, 0, 0, DateTimeKind.Unspecified), new DateTime(2026, 3, 7, 1, 52, 1, 377, DateTimeKind.Local).AddTicks(2042), null },
                    { new Guid("00000013-0000-0000-0000-000000000003"), new DateTime(2026, 3, 26, 22, 30, 0, 0, DateTimeKind.Unspecified), new Guid("55555555-5555-5555-5555-555555555555"), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new Guid("7b5d2c1e-9f8a-3e7b-c1d2-a0e9f8c7b6a5"), null, null, new DateTime(2026, 3, 27, 1, 16, 0, 0, DateTimeKind.Unspecified), true, false, new Guid("7a5e82b1-c4d3-4a92-9e11-3f4b52c1a8d9"), new Guid("66666666-6666-6666-6666-666666666666"), new DateTime(2026, 3, 26, 22, 30, 0, 0, DateTimeKind.Unspecified), new DateTime(2026, 3, 7, 1, 52, 1, 377, DateTimeKind.Local).AddTicks(2044), null },
                    { new Guid("00000013-0000-0000-0000-000000000004"), new DateTime(2026, 3, 26, 14, 0, 0, 0, DateTimeKind.Unspecified), new Guid("55555555-5555-5555-5555-555555555555"), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new Guid("7b5d2c1e-9f8a-3e7b-c1d2-a0e9f8c7b6a5"), null, null, new DateTime(2026, 3, 26, 15, 34, 0, 0, DateTimeKind.Unspecified), true, false, new Guid("7a5e82b1-c4d3-4a92-9e11-3f4b52c1a8d9"), new Guid("77777777-7777-7777-7777-777777777777"), new DateTime(2026, 3, 26, 14, 0, 0, 0, DateTimeKind.Unspecified), new DateTime(2026, 3, 7, 1, 52, 1, 377, DateTimeKind.Local).AddTicks(2046), null },
                    { new Guid("00000014-0000-0000-0000-000000000001"), new DateTime(2026, 3, 27, 22, 0, 0, 0, DateTimeKind.Unspecified), new Guid("33333333-3333-3333-3333-333333333333"), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new Guid("7b5d2c1e-9f8a-3e7b-c1d2-a0e9f8c7b6a5"), null, null, new DateTime(2026, 3, 28, 0, 46, 0, 0, DateTimeKind.Unspecified), true, false, new Guid("3fbc4a32-15f5-47e0-b98a-784f1b8a9612"), new Guid("66666666-6666-6666-6666-666666666666"), new DateTime(2026, 3, 27, 22, 0, 0, 0, DateTimeKind.Unspecified), new DateTime(2026, 3, 7, 1, 52, 1, 377, DateTimeKind.Local).AddTicks(2048), null },
                    { new Guid("00000014-0000-0000-0000-000000000002"), new DateTime(2026, 3, 27, 20, 0, 0, 0, DateTimeKind.Unspecified), new Guid("44444444-4444-4444-4444-444444444444"), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new Guid("7b5d2c1e-9f8a-3e7b-c1d2-a0e9f8c7b6a5"), null, null, new DateTime(2026, 3, 27, 22, 46, 0, 0, DateTimeKind.Unspecified), true, false, new Guid("d29b0f1c-8e2a-4c5b-bc3d-1a2f3e4d5c6b"), new Guid("66666666-6666-6666-6666-666666666666"), new DateTime(2026, 3, 27, 20, 0, 0, 0, DateTimeKind.Unspecified), new DateTime(2026, 3, 7, 1, 52, 1, 377, DateTimeKind.Local).AddTicks(2050), null },
                    { new Guid("00000014-0000-0000-0000-000000000003"), new DateTime(2026, 3, 27, 22, 30, 0, 0, DateTimeKind.Unspecified), new Guid("55555555-5555-5555-5555-555555555555"), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new Guid("7b5d2c1e-9f8a-3e7b-c1d2-a0e9f8c7b6a5"), null, null, new DateTime(2026, 3, 28, 1, 16, 0, 0, DateTimeKind.Unspecified), true, false, new Guid("7a5e82b1-c4d3-4a92-9e11-3f4b52c1a8d9"), new Guid("66666666-6666-6666-6666-666666666666"), new DateTime(2026, 3, 27, 22, 30, 0, 0, DateTimeKind.Unspecified), new DateTime(2026, 3, 7, 1, 52, 1, 377, DateTimeKind.Local).AddTicks(2051), null },
                    { new Guid("00000014-0000-0000-0000-000000000004"), new DateTime(2026, 3, 27, 14, 0, 0, 0, DateTimeKind.Unspecified), new Guid("55555555-5555-5555-5555-555555555555"), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new Guid("7b5d2c1e-9f8a-3e7b-c1d2-a0e9f8c7b6a5"), null, null, new DateTime(2026, 3, 27, 15, 34, 0, 0, DateTimeKind.Unspecified), true, false, new Guid("7a5e82b1-c4d3-4a92-9e11-3f4b52c1a8d9"), new Guid("77777777-7777-7777-7777-777777777777"), new DateTime(2026, 3, 27, 14, 0, 0, 0, DateTimeKind.Unspecified), new DateTime(2026, 3, 7, 1, 52, 1, 377, DateTimeKind.Local).AddTicks(2095), null },
                    { new Guid("00000015-0000-0000-0000-000000000001"), new DateTime(2026, 3, 28, 22, 0, 0, 0, DateTimeKind.Unspecified), new Guid("33333333-3333-3333-3333-333333333333"), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new Guid("7b5d2c1e-9f8a-3e7b-c1d2-a0e9f8c7b6a5"), null, null, new DateTime(2026, 3, 29, 0, 46, 0, 0, DateTimeKind.Unspecified), true, false, new Guid("3fbc4a32-15f5-47e0-b98a-784f1b8a9612"), new Guid("66666666-6666-6666-6666-666666666666"), new DateTime(2026, 3, 28, 22, 0, 0, 0, DateTimeKind.Unspecified), new DateTime(2026, 3, 7, 1, 52, 1, 377, DateTimeKind.Local).AddTicks(2098), null },
                    { new Guid("00000015-0000-0000-0000-000000000002"), new DateTime(2026, 3, 28, 20, 0, 0, 0, DateTimeKind.Unspecified), new Guid("44444444-4444-4444-4444-444444444444"), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new Guid("7b5d2c1e-9f8a-3e7b-c1d2-a0e9f8c7b6a5"), null, null, new DateTime(2026, 3, 28, 22, 46, 0, 0, DateTimeKind.Unspecified), true, false, new Guid("d29b0f1c-8e2a-4c5b-bc3d-1a2f3e4d5c6b"), new Guid("66666666-6666-6666-6666-666666666666"), new DateTime(2026, 3, 28, 20, 0, 0, 0, DateTimeKind.Unspecified), new DateTime(2026, 3, 7, 1, 52, 1, 377, DateTimeKind.Local).AddTicks(2099), null },
                    { new Guid("00000015-0000-0000-0000-000000000003"), new DateTime(2026, 3, 28, 22, 30, 0, 0, DateTimeKind.Unspecified), new Guid("55555555-5555-5555-5555-555555555555"), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new Guid("7b5d2c1e-9f8a-3e7b-c1d2-a0e9f8c7b6a5"), null, null, new DateTime(2026, 3, 29, 1, 16, 0, 0, DateTimeKind.Unspecified), true, false, new Guid("7a5e82b1-c4d3-4a92-9e11-3f4b52c1a8d9"), new Guid("66666666-6666-6666-6666-666666666666"), new DateTime(2026, 3, 28, 22, 30, 0, 0, DateTimeKind.Unspecified), new DateTime(2026, 3, 7, 1, 52, 1, 377, DateTimeKind.Local).AddTicks(2101), null },
                    { new Guid("00000015-0000-0000-0000-000000000004"), new DateTime(2026, 3, 28, 14, 0, 0, 0, DateTimeKind.Unspecified), new Guid("55555555-5555-5555-5555-555555555555"), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new Guid("7b5d2c1e-9f8a-3e7b-c1d2-a0e9f8c7b6a5"), null, null, new DateTime(2026, 3, 28, 15, 34, 0, 0, DateTimeKind.Unspecified), true, false, new Guid("7a5e82b1-c4d3-4a92-9e11-3f4b52c1a8d9"), new Guid("77777777-7777-7777-7777-777777777777"), new DateTime(2026, 3, 28, 14, 0, 0, 0, DateTimeKind.Unspecified), new DateTime(2026, 3, 7, 1, 52, 1, 377, DateTimeKind.Local).AddTicks(2103), null },
                    { new Guid("00000016-0000-0000-0000-000000000001"), new DateTime(2026, 3, 29, 22, 0, 0, 0, DateTimeKind.Unspecified), new Guid("33333333-3333-3333-3333-333333333333"), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new Guid("7b5d2c1e-9f8a-3e7b-c1d2-a0e9f8c7b6a5"), null, null, new DateTime(2026, 3, 30, 0, 46, 0, 0, DateTimeKind.Unspecified), true, false, new Guid("3fbc4a32-15f5-47e0-b98a-784f1b8a9612"), new Guid("66666666-6666-6666-6666-666666666666"), new DateTime(2026, 3, 29, 22, 0, 0, 0, DateTimeKind.Unspecified), new DateTime(2026, 3, 7, 1, 52, 1, 377, DateTimeKind.Local).AddTicks(2105), null },
                    { new Guid("00000016-0000-0000-0000-000000000002"), new DateTime(2026, 3, 29, 20, 0, 0, 0, DateTimeKind.Unspecified), new Guid("44444444-4444-4444-4444-444444444444"), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new Guid("7b5d2c1e-9f8a-3e7b-c1d2-a0e9f8c7b6a5"), null, null, new DateTime(2026, 3, 29, 22, 46, 0, 0, DateTimeKind.Unspecified), true, false, new Guid("d29b0f1c-8e2a-4c5b-bc3d-1a2f3e4d5c6b"), new Guid("66666666-6666-6666-6666-666666666666"), new DateTime(2026, 3, 29, 20, 0, 0, 0, DateTimeKind.Unspecified), new DateTime(2026, 3, 7, 1, 52, 1, 377, DateTimeKind.Local).AddTicks(2107), null },
                    { new Guid("00000016-0000-0000-0000-000000000003"), new DateTime(2026, 3, 29, 22, 30, 0, 0, DateTimeKind.Unspecified), new Guid("55555555-5555-5555-5555-555555555555"), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new Guid("7b5d2c1e-9f8a-3e7b-c1d2-a0e9f8c7b6a5"), null, null, new DateTime(2026, 3, 30, 1, 16, 0, 0, DateTimeKind.Unspecified), true, false, new Guid("7a5e82b1-c4d3-4a92-9e11-3f4b52c1a8d9"), new Guid("66666666-6666-6666-6666-666666666666"), new DateTime(2026, 3, 29, 22, 30, 0, 0, DateTimeKind.Unspecified), new DateTime(2026, 3, 7, 1, 52, 1, 377, DateTimeKind.Local).AddTicks(2108), null },
                    { new Guid("00000016-0000-0000-0000-000000000004"), new DateTime(2026, 3, 29, 14, 0, 0, 0, DateTimeKind.Unspecified), new Guid("55555555-5555-5555-5555-555555555555"), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new Guid("7b5d2c1e-9f8a-3e7b-c1d2-a0e9f8c7b6a5"), null, null, new DateTime(2026, 3, 29, 15, 34, 0, 0, DateTimeKind.Unspecified), true, false, new Guid("7a5e82b1-c4d3-4a92-9e11-3f4b52c1a8d9"), new Guid("77777777-7777-7777-7777-777777777777"), new DateTime(2026, 3, 29, 14, 0, 0, 0, DateTimeKind.Unspecified), new DateTime(2026, 3, 7, 1, 52, 1, 377, DateTimeKind.Local).AddTicks(2110), null },
                    { new Guid("00000017-0000-0000-0000-000000000001"), new DateTime(2026, 3, 30, 22, 0, 0, 0, DateTimeKind.Unspecified), new Guid("33333333-3333-3333-3333-333333333333"), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new Guid("7b5d2c1e-9f8a-3e7b-c1d2-a0e9f8c7b6a5"), null, null, new DateTime(2026, 3, 31, 0, 46, 0, 0, DateTimeKind.Unspecified), true, false, new Guid("3fbc4a32-15f5-47e0-b98a-784f1b8a9612"), new Guid("66666666-6666-6666-6666-666666666666"), new DateTime(2026, 3, 30, 22, 0, 0, 0, DateTimeKind.Unspecified), new DateTime(2026, 3, 7, 1, 52, 1, 377, DateTimeKind.Local).AddTicks(2112), null },
                    { new Guid("00000017-0000-0000-0000-000000000002"), new DateTime(2026, 3, 30, 20, 0, 0, 0, DateTimeKind.Unspecified), new Guid("44444444-4444-4444-4444-444444444444"), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new Guid("7b5d2c1e-9f8a-3e7b-c1d2-a0e9f8c7b6a5"), null, null, new DateTime(2026, 3, 30, 22, 46, 0, 0, DateTimeKind.Unspecified), true, false, new Guid("d29b0f1c-8e2a-4c5b-bc3d-1a2f3e4d5c6b"), new Guid("66666666-6666-6666-6666-666666666666"), new DateTime(2026, 3, 30, 20, 0, 0, 0, DateTimeKind.Unspecified), new DateTime(2026, 3, 7, 1, 52, 1, 377, DateTimeKind.Local).AddTicks(2114), null },
                    { new Guid("00000017-0000-0000-0000-000000000003"), new DateTime(2026, 3, 30, 22, 30, 0, 0, DateTimeKind.Unspecified), new Guid("55555555-5555-5555-5555-555555555555"), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new Guid("7b5d2c1e-9f8a-3e7b-c1d2-a0e9f8c7b6a5"), null, null, new DateTime(2026, 3, 31, 1, 16, 0, 0, DateTimeKind.Unspecified), true, false, new Guid("7a5e82b1-c4d3-4a92-9e11-3f4b52c1a8d9"), new Guid("66666666-6666-6666-6666-666666666666"), new DateTime(2026, 3, 30, 22, 30, 0, 0, DateTimeKind.Unspecified), new DateTime(2026, 3, 7, 1, 52, 1, 377, DateTimeKind.Local).AddTicks(2116), null },
                    { new Guid("00000017-0000-0000-0000-000000000004"), new DateTime(2026, 3, 30, 14, 0, 0, 0, DateTimeKind.Unspecified), new Guid("55555555-5555-5555-5555-555555555555"), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new Guid("7b5d2c1e-9f8a-3e7b-c1d2-a0e9f8c7b6a5"), null, null, new DateTime(2026, 3, 30, 15, 34, 0, 0, DateTimeKind.Unspecified), true, false, new Guid("7a5e82b1-c4d3-4a92-9e11-3f4b52c1a8d9"), new Guid("77777777-7777-7777-7777-777777777777"), new DateTime(2026, 3, 30, 14, 0, 0, 0, DateTimeKind.Unspecified), new DateTime(2026, 3, 7, 1, 52, 1, 377, DateTimeKind.Local).AddTicks(2117), null },
                    { new Guid("00000018-0000-0000-0000-000000000001"), new DateTime(2026, 3, 31, 22, 0, 0, 0, DateTimeKind.Unspecified), new Guid("33333333-3333-3333-3333-333333333333"), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new Guid("7b5d2c1e-9f8a-3e7b-c1d2-a0e9f8c7b6a5"), null, null, new DateTime(2026, 4, 1, 0, 46, 0, 0, DateTimeKind.Unspecified), true, false, new Guid("3fbc4a32-15f5-47e0-b98a-784f1b8a9612"), new Guid("66666666-6666-6666-6666-666666666666"), new DateTime(2026, 3, 31, 22, 0, 0, 0, DateTimeKind.Unspecified), new DateTime(2026, 3, 7, 1, 52, 1, 377, DateTimeKind.Local).AddTicks(2119), null },
                    { new Guid("00000018-0000-0000-0000-000000000002"), new DateTime(2026, 3, 31, 20, 0, 0, 0, DateTimeKind.Unspecified), new Guid("44444444-4444-4444-4444-444444444444"), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new Guid("7b5d2c1e-9f8a-3e7b-c1d2-a0e9f8c7b6a5"), null, null, new DateTime(2026, 3, 31, 22, 46, 0, 0, DateTimeKind.Unspecified), true, false, new Guid("d29b0f1c-8e2a-4c5b-bc3d-1a2f3e4d5c6b"), new Guid("66666666-6666-6666-6666-666666666666"), new DateTime(2026, 3, 31, 20, 0, 0, 0, DateTimeKind.Unspecified), new DateTime(2026, 3, 7, 1, 52, 1, 377, DateTimeKind.Local).AddTicks(2121), null },
                    { new Guid("00000018-0000-0000-0000-000000000003"), new DateTime(2026, 3, 31, 22, 30, 0, 0, DateTimeKind.Unspecified), new Guid("55555555-5555-5555-5555-555555555555"), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new Guid("7b5d2c1e-9f8a-3e7b-c1d2-a0e9f8c7b6a5"), null, null, new DateTime(2026, 4, 1, 1, 16, 0, 0, DateTimeKind.Unspecified), true, false, new Guid("7a5e82b1-c4d3-4a92-9e11-3f4b52c1a8d9"), new Guid("66666666-6666-6666-6666-666666666666"), new DateTime(2026, 3, 31, 22, 30, 0, 0, DateTimeKind.Unspecified), new DateTime(2026, 3, 7, 1, 52, 1, 377, DateTimeKind.Local).AddTicks(2123), null },
                    { new Guid("00000018-0000-0000-0000-000000000004"), new DateTime(2026, 3, 31, 14, 0, 0, 0, DateTimeKind.Unspecified), new Guid("55555555-5555-5555-5555-555555555555"), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new Guid("7b5d2c1e-9f8a-3e7b-c1d2-a0e9f8c7b6a5"), null, null, new DateTime(2026, 3, 31, 15, 34, 0, 0, DateTimeKind.Unspecified), true, false, new Guid("7a5e82b1-c4d3-4a92-9e11-3f4b52c1a8d9"), new Guid("77777777-7777-7777-7777-777777777777"), new DateTime(2026, 3, 31, 14, 0, 0, 0, DateTimeKind.Unspecified), new DateTime(2026, 3, 7, 1, 52, 1, 377, DateTimeKind.Local).AddTicks(2125), null },
                    { new Guid("00000019-0000-0000-0000-000000000001"), new DateTime(2026, 4, 1, 22, 0, 0, 0, DateTimeKind.Unspecified), new Guid("33333333-3333-3333-3333-333333333333"), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new Guid("7b5d2c1e-9f8a-3e7b-c1d2-a0e9f8c7b6a5"), null, null, new DateTime(2026, 4, 2, 0, 46, 0, 0, DateTimeKind.Unspecified), true, false, new Guid("3fbc4a32-15f5-47e0-b98a-784f1b8a9612"), new Guid("66666666-6666-6666-6666-666666666666"), new DateTime(2026, 4, 1, 22, 0, 0, 0, DateTimeKind.Unspecified), new DateTime(2026, 3, 7, 1, 52, 1, 377, DateTimeKind.Local).AddTicks(2127), null },
                    { new Guid("00000019-0000-0000-0000-000000000002"), new DateTime(2026, 4, 1, 20, 0, 0, 0, DateTimeKind.Unspecified), new Guid("44444444-4444-4444-4444-444444444444"), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new Guid("7b5d2c1e-9f8a-3e7b-c1d2-a0e9f8c7b6a5"), null, null, new DateTime(2026, 4, 1, 22, 46, 0, 0, DateTimeKind.Unspecified), true, false, new Guid("d29b0f1c-8e2a-4c5b-bc3d-1a2f3e4d5c6b"), new Guid("66666666-6666-6666-6666-666666666666"), new DateTime(2026, 4, 1, 20, 0, 0, 0, DateTimeKind.Unspecified), new DateTime(2026, 3, 7, 1, 52, 1, 377, DateTimeKind.Local).AddTicks(2128), null },
                    { new Guid("00000019-0000-0000-0000-000000000003"), new DateTime(2026, 4, 1, 22, 30, 0, 0, DateTimeKind.Unspecified), new Guid("55555555-5555-5555-5555-555555555555"), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new Guid("7b5d2c1e-9f8a-3e7b-c1d2-a0e9f8c7b6a5"), null, null, new DateTime(2026, 4, 2, 1, 16, 0, 0, DateTimeKind.Unspecified), true, false, new Guid("7a5e82b1-c4d3-4a92-9e11-3f4b52c1a8d9"), new Guid("66666666-6666-6666-6666-666666666666"), new DateTime(2026, 4, 1, 22, 30, 0, 0, DateTimeKind.Unspecified), new DateTime(2026, 3, 7, 1, 52, 1, 377, DateTimeKind.Local).AddTicks(2130), null },
                    { new Guid("00000019-0000-0000-0000-000000000004"), new DateTime(2026, 4, 1, 14, 0, 0, 0, DateTimeKind.Unspecified), new Guid("55555555-5555-5555-5555-555555555555"), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new Guid("7b5d2c1e-9f8a-3e7b-c1d2-a0e9f8c7b6a5"), null, null, new DateTime(2026, 4, 1, 15, 34, 0, 0, DateTimeKind.Unspecified), true, false, new Guid("7a5e82b1-c4d3-4a92-9e11-3f4b52c1a8d9"), new Guid("77777777-7777-7777-7777-777777777777"), new DateTime(2026, 4, 1, 14, 0, 0, 0, DateTimeKind.Unspecified), new DateTime(2026, 3, 7, 1, 52, 1, 377, DateTimeKind.Local).AddTicks(2132), null }
                });

            migrationBuilder.InsertData(
                table: "SeatsInfoEntity",
                columns: new[] { "SeatId", "AuditoriumId", "ColIndex", "CoordX", "CoordY", "RowIndex", "SeatNumber" },
                values: new object[,]
                {
                    { "0a986063-932c-4e0c-97ce-a2bf4da664e8", new Guid("33333333-3333-3333-3333-333333333333"), 4, 200.0, 0.0, 0, "A5" },
                    { "0b5807cb-8178-4d7f-909d-ae438a4a3711", new Guid("55555555-5555-5555-5555-555555555555"), 3, 150.0, 100.0, 2, "C4" },
                    { "16502009-6c61-4aa3-a3ed-261998411fb5", new Guid("55555555-5555-5555-5555-555555555555"), 4, 200.0, 100.0, 2, "C5" },
                    { "17d9c54b-5fd7-43fe-b787-bfe67e91271d", new Guid("44444444-4444-4444-4444-444444444444"), 2, 100.0, 0.0, 0, "A3" },
                    { "19a1d4ce-10b6-4a21-8506-f4b7af97c1bb", new Guid("55555555-5555-5555-5555-555555555555"), 1, 50.0, 0.0, 0, "A2" },
                    { "19b2a72b-cd0d-4b63-82df-03641891f03b", new Guid("33333333-3333-3333-3333-333333333333"), 3, 150.0, 50.0, 1, "B4" },
                    { "1e650045-0bf5-4391-9561-4cb789d9943d", new Guid("33333333-3333-3333-3333-333333333333"), 1, 50.0, 0.0, 0, "A2" },
                    { "21fc0ae2-89d0-486a-a220-e837ca41b5ae", new Guid("44444444-4444-4444-4444-444444444444"), 4, 200.0, 50.0, 1, "B5" },
                    { "22c66d8f-fc81-48e0-97cb-311d7650d413", new Guid("55555555-5555-5555-5555-555555555555"), 2, 100.0, 100.0, 2, "C3" },
                    { "2d1aa774-5234-45bc-b36c-e465b68229a0", new Guid("44444444-4444-4444-4444-444444444444"), 2, 100.0, 100.0, 2, "C3" },
                    { "3b056c76-0908-4133-b170-7c41c499026b", new Guid("44444444-4444-4444-4444-444444444444"), 0, 0.0, 100.0, 2, "C1" },
                    { "3beaccfa-9bbb-43b4-b7e2-4cde3894c8e6", new Guid("55555555-5555-5555-5555-555555555555"), 4, 200.0, 50.0, 1, "B5" },
                    { "3f52063b-0480-423c-a8fc-c50a3a57d2e5", new Guid("44444444-4444-4444-4444-444444444444"), 0, 0.0, 0.0, 0, "A1" },
                    { "3fc1d76c-7b1a-4d7f-afe8-99eabd9f2130", new Guid("33333333-3333-3333-3333-333333333333"), 4, 200.0, 100.0, 2, "C5" },
                    { "46e361c6-4f15-47bb-8887-6daeab630911", new Guid("55555555-5555-5555-5555-555555555555"), 0, 0.0, 50.0, 1, "B1" },
                    { "49bebaab-0448-47c4-9222-ea67b46aa3ce", new Guid("33333333-3333-3333-3333-333333333333"), 1, 50.0, 100.0, 2, "C2" },
                    { "4ce51737-bdb4-4832-ac24-9412cceab1d9", new Guid("33333333-3333-3333-3333-333333333333"), 0, 0.0, 0.0, 0, "A1" },
                    { "51041ca6-90d1-49e3-8667-3125109e8703", new Guid("55555555-5555-5555-5555-555555555555"), 1, 50.0, 100.0, 2, "C2" },
                    { "5515eb1d-7f1e-4513-a86b-8b42425484c7", new Guid("55555555-5555-5555-5555-555555555555"), 1, 50.0, 50.0, 1, "B2" },
                    { "5b828390-69c9-42c7-a931-a54c17309c7a", new Guid("33333333-3333-3333-3333-333333333333"), 2, 100.0, 50.0, 1, "B3" },
                    { "6045c0b1-473e-4f04-9054-e8533c8ed8da", new Guid("55555555-5555-5555-5555-555555555555"), 3, 150.0, 50.0, 1, "B4" },
                    { "6f6cfc50-5fd7-4847-8ea2-373bd8f3844e", new Guid("44444444-4444-4444-4444-444444444444"), 2, 100.0, 50.0, 1, "B3" },
                    { "75efe13c-ebe6-4f45-8793-827cba3a533e", new Guid("44444444-4444-4444-4444-444444444444"), 1, 50.0, 0.0, 0, "A2" },
                    { "7a2117d5-c111-4fb8-b20e-7826822a327d", new Guid("55555555-5555-5555-5555-555555555555"), 4, 200.0, 0.0, 0, "A5" },
                    { "7d8ef90f-bd54-4985-8b83-b0c6b8d0ab77", new Guid("55555555-5555-5555-5555-555555555555"), 0, 0.0, 100.0, 2, "C1" },
                    { "7e20cfa3-6ed8-4fb9-8614-cbe378560733", new Guid("44444444-4444-4444-4444-444444444444"), 3, 150.0, 0.0, 0, "A4" },
                    { "7faceacb-f6af-451a-9ec9-8692c6175183", new Guid("44444444-4444-4444-4444-444444444444"), 3, 150.0, 50.0, 1, "B4" },
                    { "803c3269-cb62-4c84-abae-f2cc1de8dbc0", new Guid("33333333-3333-3333-3333-333333333333"), 0, 0.0, 100.0, 2, "C1" },
                    { "849e6060-c847-4615-903d-48e1e033e038", new Guid("33333333-3333-3333-3333-333333333333"), 3, 150.0, 100.0, 2, "C4" },
                    { "9055108e-07ac-4d0d-b19d-f3333909b30f", new Guid("33333333-3333-3333-3333-333333333333"), 1, 50.0, 50.0, 1, "B2" },
                    { "a2f5c7f5-6e10-41da-ad4e-11a69287705f", new Guid("55555555-5555-5555-5555-555555555555"), 2, 100.0, 50.0, 1, "B3" },
                    { "a6f405c3-c894-457f-972f-760cf482e9fe", new Guid("44444444-4444-4444-4444-444444444444"), 4, 200.0, 100.0, 2, "C5" },
                    { "af922b63-e1e5-4985-9f50-abd4b0336b5d", new Guid("33333333-3333-3333-3333-333333333333"), 3, 150.0, 0.0, 0, "A4" },
                    { "c4e2b2e7-9157-4ef5-b9a6-bf6d1f4bc23a", new Guid("44444444-4444-4444-4444-444444444444"), 1, 50.0, 100.0, 2, "C2" },
                    { "c9ad02a4-ed0a-437f-a216-a7cde99259e6", new Guid("33333333-3333-3333-3333-333333333333"), 0, 0.0, 50.0, 1, "B1" },
                    { "cf98f34f-1f43-498a-ae3c-ef70024db6b4", new Guid("44444444-4444-4444-4444-444444444444"), 3, 150.0, 100.0, 2, "C4" },
                    { "d2eb62c7-635e-450e-9660-e0a2d9ba760c", new Guid("55555555-5555-5555-5555-555555555555"), 0, 0.0, 0.0, 0, "A1" },
                    { "d6d578f4-3fe8-4c75-aa10-b282d12412c1", new Guid("44444444-4444-4444-4444-444444444444"), 0, 0.0, 50.0, 1, "B1" },
                    { "e6eea0b2-f689-49d3-b674-a771fe221a6d", new Guid("44444444-4444-4444-4444-444444444444"), 1, 50.0, 50.0, 1, "B2" },
                    { "ebce8708-10ee-4fa5-9fc6-01f149befd72", new Guid("33333333-3333-3333-3333-333333333333"), 4, 200.0, 50.0, 1, "B5" },
                    { "ec891806-22dd-4241-825a-8a308004d4e9", new Guid("33333333-3333-3333-3333-333333333333"), 2, 100.0, 0.0, 0, "A3" },
                    { "f06cbcee-2268-4228-953a-2c4706f38dc5", new Guid("55555555-5555-5555-5555-555555555555"), 2, 100.0, 0.0, 0, "A3" },
                    { "f3b19264-4b8f-4efc-9428-298bb0d671f2", new Guid("55555555-5555-5555-5555-555555555555"), 3, 150.0, 0.0, 0, "A4" },
                    { "f84b507d-d635-4e9e-81aa-341da7b05023", new Guid("44444444-4444-4444-4444-444444444444"), 4, 200.0, 0.0, 0, "A5" },
                    { "fafa8d22-3586-45c8-94b7-231a359302a7", new Guid("33333333-3333-3333-3333-333333333333"), 2, 100.0, 100.0, 2, "C3" }
                });

            migrationBuilder.UpdateData(
                table: "UserInfoEntity",
                keyColumn: "UserId",
                keyValue: new Guid("7b5d2c1e-9f8a-3e7b-c1d2-a0e9f8c7b6a5"),
                column: "UserEmail",
                value: "theater@cinema.com");

            migrationBuilder.UpdateData(
                table: "UserInfoEntity",
                keyColumn: "UserId",
                keyValue: new Guid("b2c3d4e5-f6a7-8b9c-d0e1-f2a3b4c5d6e7"),
                column: "UserEmail",
                value: "moviemanager@cinema.com");

            migrationBuilder.UpdateData(
                table: "UserInfoEntity",
                keyColumn: "UserId",
                keyValue: new Guid("f1a0e9b8-d7c6-5e4f-a3b2-1d0c9b8a7f6e"),
                column: "UserEmail",
                value: "facilities@cinema.com");

            migrationBuilder.InsertData(
                table: "UserInfoEntity",
                columns: new[] { "UserId", "AccountStatus", "LockoutReason", "Password", "RefreshToken", "RegisterMethod", "SubId", "UserEmail" },
                values: new object[,]
                {
                    { new Guid("7e272a3a-6288-4589-9d0e-f4203a5f3fe0"), 0, null, "$2a$12$HSYdRT84AjbFawIfnmluJ.AMrBqmqBtKyyn6kNZFTNW7olAMMgXPy", null, 0, null, "testAdminFacilitiesManager@gmail.com" },
                    { new Guid("a1b2c3d4-e5f6-7a8b-c9d0-e1f2a3b4c5d6"), 0, null, "$2a$12$HSYdRT84AjbFawIfnmluJ.AMrBqmqBtKyyn6kNZFTNW7olAMMgXPy", null, 0, null, "cashier@cinema.com" }
                });

            migrationBuilder.UpdateData(
                table: "UserProfileEntity",
                keyColumn: "UserId",
                keyValue: new Guid("7b5d2c1e-9f8a-3e7b-c1d2-a0e9f8c7b6a5"),
                column: "UserName",
                value: "Cinema Operations Manager");

            migrationBuilder.UpdateData(
                table: "UserProfileEntity",
                keyColumn: "UserId",
                keyValue: new Guid("b2c3d4e5-f6a7-8b9c-d0e1-f2a3b4c5d6e7"),
                column: "UserName",
                value: "Movie Content Manager");

            migrationBuilder.UpdateData(
                table: "UserProfileEntity",
                keyColumn: "UserId",
                keyValue: new Guid("e4e1f7d8-c3b2-4a90-8c67-2f5a1b3d9e0c"),
                column: "UserName",
                value: "System Administrator");

            migrationBuilder.UpdateData(
                table: "UserProfileEntity",
                keyColumn: "UserId",
                keyValue: new Guid("f1a0e9b8-d7c6-5e4f-a3b2-1d0c9b8a7f6e"),
                column: "UserName",
                value: "Technical Facilities Manager");

            migrationBuilder.InsertData(
                table: "UserProfileEntity",
                columns: new[] { "UserId", "DateOfBirth", "IdentityCode", "PhoneNumber", "UserName" },
                values: new object[,]
                {
                    { new Guid("7e272a3a-6288-4589-9d0e-f4203a5f3fe0"), new DateTime(1986, 3, 15, 0, 0, 0, 0, DateTimeKind.Unspecified), "fByrPlhQbK2U5YNuCLR5rA==", "0955555555", "Test Multi Role Account" },
                    { new Guid("a1b2c3d4-e5f6-7a8b-c9d0-e1f2a3b4c5d6"), new DateTime(1995, 12, 12, 0, 0, 0, 0, DateTimeKind.Unspecified), "pFoBRlv4RT1kyqKE1Ch3Hw==", "0944444444", "Main Cashier" }
                });

            migrationBuilder.InsertData(
                table: "UserRoleInfoEntity",
                columns: new[] { "RoleId", "UserId" },
                values: new object[,]
                {
                    { new Guid("1a8f7b9c-d4e5-4f6a-b7c8-9d0e1f2a3b4c"), new Guid("a1b2c3d4-e5f6-7a8b-c9d0-e1f2a3b4c5d6") },
                    { new Guid("3c0d9e1f-a6b7-c8d9-e0f1-2a3b4c5d6e7f"), new Guid("7e272a3a-6288-4589-9d0e-f4203a5f3fe0") },
                    { new Guid("5e2f1a3b-c8d9-e0f1-a2b3-4c5d6e7f8a9b"), new Guid("7e272a3a-6288-4589-9d0e-f4203a5f3fe0") }
                });

            migrationBuilder.CreateIndex(
                name: "IX_MovieInfoEntity_ManagerId",
                table: "MovieInfoEntity",
                column: "ManagerId");

            migrationBuilder.CreateIndex(
                name: "IX_CinemaInfoEntity_ManagerId",
                table: "CinemaInfoEntity",
                column: "ManagerId");

            migrationBuilder.AddForeignKey(
                name: "FK_CinemaInfoEntity_UserInfoEntity_ManagerId",
                table: "CinemaInfoEntity",
                column: "ManagerId",
                principalTable: "UserInfoEntity",
                principalColumn: "UserId",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_MovieInfoEntity_UserInfoEntity_ManagerId",
                table: "MovieInfoEntity",
                column: "ManagerId",
                principalTable: "UserInfoEntity",
                principalColumn: "UserId",
                onDelete: ReferentialAction.Restrict);

            // Re-enable constraints sau khi đã seed xong
            migrationBuilder.Sql("EXEC sp_MSforeachtable 'ALTER TABLE ? WITH CHECK CHECK CONSTRAINT ALL'");
        }
    }
}
