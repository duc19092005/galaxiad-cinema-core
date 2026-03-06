using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace DataAccess.Migrations
{
    /// <inheritdoc />
    public partial class AddBookingSeedData : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropPrimaryKey(
                name: "PK_OrderDetailsInfo",
                table: "OrderDetailsInfo");

            migrationBuilder.AddColumn<string>(
                name: "VnPayTransactionId",
                table: "OrderInfoEntity",
                type: "varchar(100)",
                nullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "SeatId",
                table: "OrderDetailsInfo",
                type: "varchar(100)",
                nullable: false,
                oldClrType: typeof(Guid),
                oldType: "uniqueidentifier");

            migrationBuilder.AddColumn<DateTime>(
                name: "StartTime",
                table: "MovieScheduleInfoEntity",
                type: "datetime2",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<string>(
                name: "Actors",
                table: "MovieInfoEntity",
                type: "nvarchar(500)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Director",
                table: "MovieInfoEntity",
                type: "nvarchar(200)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "TrailerUrl",
                table: "MovieInfoEntity",
                type: "varchar(2048)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "CinemaCity",
                table: "CinemaInfoEntity",
                type: "nvarchar(100)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddPrimaryKey(
                name: "PK_OrderDetailsInfo",
                table: "OrderDetailsInfo",
                columns: new[] { "OrderId", "MovieScheduleId", "SeatId" });

            migrationBuilder.InsertData(
                table: "CinemaInfoEntity",
                columns: new[] { "CinemaId", "ActiveAt", "CinemaCity", "CinemaDescription", "CinemaHotLineNumber", "CinemaLocation", "CinemaName", "CreatedAt", "CreatedByUserId", "DeletedAt", "DeletedByUserId", "IsActive", "IsDeleted", "ManagerId", "UpdatedAt", "UpdatedByUserId" },
                values: new object[,]
                {
                    { new Guid("11111111-1111-1111-1111-111111111111"), new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), "Hồ Chí Minh", "Rạp chiếu phim hiện đại nhất Việt Nam", "1900 6017", "Tầng B1, Vincom Center Landmark 81, 772 Điện Biên Phủ, P.22, Q. Bình Thạnh", "CGV Vincom Center Landmark 81", new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new Guid("e4e1f7d8-c3b2-4a90-8c67-2f5a1b3d9e0c"), null, null, true, false, new Guid("7b5d2c1e-9f8a-3e7b-c1d2-a0e9f8c7b6a5"), new DateTime(2026, 3, 6, 20, 48, 17, 43, DateTimeKind.Local).AddTicks(5598), null },
                    { new Guid("22222222-2222-2222-2222-222222222222"), new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), "Hà Nội", "Trải nghiệm điện ảnh đỉnh cao", "0243837800", "Tầng 5 Keangnam Hanoi Landmark Tower, E6 Phạm Hùng", "Lotte Cinema Landmark", new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new Guid("e4e1f7d8-c3b2-4a90-8c67-2f5a1b3d9e0c"), null, null, true, false, new Guid("7b5d2c1e-9f8a-3e7b-c1d2-a0e9f8c7b6a5"), new DateTime(2026, 3, 6, 20, 48, 17, 43, DateTimeKind.Local).AddTicks(5602), null }
                });

            migrationBuilder.InsertData(
                table: "MovieInfoEntity",
                columns: new[] { "MovieId", "ActiveAt", "Actors", "CreatedAt", "CreatedByUserId", "DeletedAt", "DeletedByUserId", "Director", "EndedDate", "IsActive", "IsDeleted", "ManagerId", "MovieDescription", "MovieDuration", "MovieImageUrl", "MovieName", "MovieRequiredAgeId", "TrailerUrl", "UpdatedAt", "UpdatedByUserId" },
                values: new object[,]
                {
                    { new Guid("66666666-6666-6666-6666-666666666666"), new DateTime(2026, 2, 24, 20, 48, 17, 43, DateTimeKind.Local).AddTicks(5571), "Timothée Chalamet, Zendaya, Rebecca Ferguson", new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new Guid("b2c3d4e5-f6a7-8b9c-d0e1-f2a3b4c5d6e7"), null, null, "Denis Villeneuve", new DateTime(2026, 3, 26, 20, 48, 17, 43, DateTimeKind.Local).AddTicks(5571), true, false, new Guid("b2c3d4e5-f6a7-8b9c-d0e1-f2a3b4c5d6e7"), "Paul Atreides unites with Chani and the Fremen while on a warpath of revenge against the conspirators who destroyed his family.", 166, "https://res.cloudinary.com/dp6utffzy/image/upload/v170000000/dune2_poster", "Dune: Part Two", new Guid("5c1b2d4e-8a9b-4c0d-7f6e-1d2c3b4a5e0f"), "https://www.youtube.com/watch?v=Way9Dexny3w", new DateTime(2026, 3, 6, 20, 48, 17, 43, DateTimeKind.Local).AddTicks(6041), null },
                    { new Guid("77777777-7777-7777-7777-777777777777"), new DateTime(2026, 3, 11, 20, 48, 17, 43, DateTimeKind.Local).AddTicks(5571), "Jack Black, Awkwafina, Viola Davis", new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new Guid("b2c3d4e5-f6a7-8b9c-d0e1-f2a3b4c5d6e7"), null, null, "Mike Mitchell", new DateTime(2026, 4, 10, 20, 48, 17, 43, DateTimeKind.Local).AddTicks(5571), true, false, new Guid("b2c3d4e5-f6a7-8b9c-d0e1-f2a3b4c5d6e7"), "After Po is tapped to become the Spiritual Leader of the Valley of Peace, he needs to find and train a new Dragon Warrior.", 94, "https://res.cloudinary.com/dp6utffzy/image/upload/v170000000/kfp4_poster", "Kung Fu Panda 4", new Guid("7a2f4b1d-9c3e-4d5a-8b2c-6f1e0a9d4b5c"), "https://www.youtube.com/watch?v=_inKs4eeHiI", new DateTime(2026, 3, 6, 20, 48, 17, 43, DateTimeKind.Local).AddTicks(6068), null }
                });

            migrationBuilder.InsertData(
                table: "AuditoriumInfoEntities",
                columns: new[] { "AuditoriumId", "ActiveAt", "AuditoriumNumber", "CinemaId", "CreatedAt", "CreatedByUserId", "DeletedAt", "DeletedByUserId", "IsActive", "IsDeleted", "MovieFormatInfoEntityMovieFormatId", "UpdatedAt", "UpdatedByUserId" },
                values: new object[,]
                {
                    { new Guid("33333333-3333-3333-3333-333333333333"), new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), "Phòng 1 (2D)", new Guid("11111111-1111-1111-1111-111111111111"), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new Guid("7b5d2c1e-9f8a-3e7b-c1d2-a0e9f8c7b6a5"), null, null, true, false, null, new DateTime(2026, 3, 6, 20, 48, 17, 43, DateTimeKind.Local).AddTicks(5635), null },
                    { new Guid("44444444-4444-4444-4444-444444444444"), new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), "Phòng 2 (IMAX)", new Guid("11111111-1111-1111-1111-111111111111"), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new Guid("7b5d2c1e-9f8a-3e7b-c1d2-a0e9f8c7b6a5"), null, null, true, false, null, new DateTime(2026, 3, 6, 20, 48, 17, 43, DateTimeKind.Local).AddTicks(5638), null },
                    { new Guid("55555555-5555-5555-5555-555555555555"), new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), "Phòng 1 (3D)", new Guid("22222222-2222-2222-2222-222222222222"), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new Guid("7b5d2c1e-9f8a-3e7b-c1d2-a0e9f8c7b6a5"), null, null, true, false, null, new DateTime(2026, 3, 6, 20, 48, 17, 43, DateTimeKind.Local).AddTicks(5640), null }
                });

            migrationBuilder.InsertData(
                table: "MovieFormatMovieInfoEntity",
                columns: new[] { "FormatId", "MovieId" },
                values: new object[,]
                {
                    { new Guid("3fbc4a32-15f5-47e0-b98a-784f1b8a9612"), new Guid("66666666-6666-6666-6666-666666666666") },
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
                    { new Guid("f2a1b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c"), new Guid("66666666-6666-6666-6666-666666666666") },
                    { new Guid("f6a7b8c9-d0e1-4f2a-3b4c-5d6e7f8a9b0c"), new Guid("77777777-7777-7777-7777-777777777777") }
                });

            migrationBuilder.InsertData(
                table: "AuditoriumFormatInfosEntity",
                columns: new[] { "AuditoriumId", "FormatId" },
                values: new object[,]
                {
                    { new Guid("33333333-3333-3333-3333-333333333333"), new Guid("3fbc4a32-15f5-47e0-b98a-784f1b8a9612") },
                    { new Guid("44444444-4444-4444-4444-444444444444"), new Guid("d29b0f1c-8e2a-4c5b-bc3d-1a2f3e4d5c6b") },
                    { new Guid("55555555-5555-5555-5555-555555555555"), new Guid("7a5e82b1-c4d3-4a92-9e11-3f4b52c1a8d9") }
                });

            migrationBuilder.InsertData(
                table: "MovieScheduleInfoEntity",
                columns: new[] { "MovieScheduleInfoId", "ActiveAt", "AuditoriumId", "CreatedAt", "CreatedByUserId", "DeletedAt", "DeletedByUserId", "EndedTime", "IsActive", "IsDeleted", "MovieFormatId", "MovieId", "StartTime", "UpdatedAt", "UpdatedByUserId" },
                values: new object[,]
                {
                    { new Guid("88888888-8888-8888-8888-888888888888"), new DateTime(2026, 3, 6, 14, 0, 0, 0, DateTimeKind.Local), new Guid("33333333-3333-3333-3333-333333333333"), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new Guid("7b5d2c1e-9f8a-3e7b-c1d2-a0e9f8c7b6a5"), null, null, new DateTime(2026, 3, 6, 16, 46, 0, 0, DateTimeKind.Local), true, false, new Guid("3fbc4a32-15f5-47e0-b98a-784f1b8a9612"), new Guid("66666666-6666-6666-6666-666666666666"), new DateTime(2026, 3, 6, 14, 0, 0, 0, DateTimeKind.Local), new DateTime(2026, 3, 6, 20, 48, 17, 43, DateTimeKind.Local).AddTicks(6169), null },
                    { new Guid("99999999-9999-9999-9999-999999999999"), new DateTime(2026, 3, 6, 19, 0, 0, 0, DateTimeKind.Local), new Guid("44444444-4444-4444-4444-444444444444"), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new Guid("7b5d2c1e-9f8a-3e7b-c1d2-a0e9f8c7b6a5"), null, null, new DateTime(2026, 3, 6, 21, 46, 0, 0, DateTimeKind.Local), true, false, new Guid("d29b0f1c-8e2a-4c5b-bc3d-1a2f3e4d5c6b"), new Guid("66666666-6666-6666-6666-666666666666"), new DateTime(2026, 3, 6, 19, 0, 0, 0, DateTimeKind.Local), new DateTime(2026, 3, 6, 20, 48, 17, 43, DateTimeKind.Local).AddTicks(6174), null },
                    { new Guid("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"), new DateTime(2026, 3, 11, 10, 0, 0, 0, DateTimeKind.Local), new Guid("55555555-5555-5555-5555-555555555555"), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new Guid("7b5d2c1e-9f8a-3e7b-c1d2-a0e9f8c7b6a5"), null, null, new DateTime(2026, 3, 11, 11, 34, 0, 0, DateTimeKind.Local), true, false, new Guid("7a5e82b1-c4d3-4a92-9e11-3f4b52c1a8d9"), new Guid("77777777-7777-7777-7777-777777777777"), new DateTime(2026, 3, 11, 10, 0, 0, 0, DateTimeKind.Local), new DateTime(2026, 3, 6, 20, 48, 17, 43, DateTimeKind.Local).AddTicks(6177), null }
                });

            migrationBuilder.InsertData(
                table: "SeatsInfoEntity",
                columns: new[] { "SeatId", "AuditoriumId", "ColIndex", "CoordX", "CoordY", "RowIndex", "SeatNumber" },
                values: new object[,]
                {
                    { "0083f312-505d-40af-bd76-1a7890f046f8", new Guid("44444444-4444-4444-4444-444444444444"), 0, 0.0, 50.0, 1, "B1" },
                    { "041e2b5c-412f-41f0-8a11-975d33a234d7", new Guid("55555555-5555-5555-5555-555555555555"), 4, 200.0, 0.0, 0, "A5" },
                    { "060b49e6-dc12-4731-be65-dc030b47210d", new Guid("33333333-3333-3333-3333-333333333333"), 4, 200.0, 100.0, 2, "C5" },
                    { "14c3d8e6-8f0c-4eab-a422-4b4fad6fd864", new Guid("55555555-5555-5555-5555-555555555555"), 0, 0.0, 50.0, 1, "B1" },
                    { "18f54627-6960-4ab1-83b8-6007a6b70131", new Guid("33333333-3333-3333-3333-333333333333"), 2, 100.0, 0.0, 0, "A3" },
                    { "1d2632bf-7a45-41e4-a62a-20a03175a032", new Guid("55555555-5555-5555-5555-555555555555"), 0, 0.0, 0.0, 0, "A1" },
                    { "1dc8c2c3-2f62-4b6a-8326-c52c81248023", new Guid("55555555-5555-5555-5555-555555555555"), 1, 50.0, 100.0, 2, "C2" },
                    { "21a098ca-9e0c-48fc-8b90-f6aa517ab367", new Guid("44444444-4444-4444-4444-444444444444"), 4, 200.0, 100.0, 2, "C5" },
                    { "28734db7-3ce0-4efb-ae07-cdc9fa0304a1", new Guid("44444444-4444-4444-4444-444444444444"), 1, 50.0, 0.0, 0, "A2" },
                    { "2aceccfa-4c7b-428f-bb3e-8dc8cc3f69b1", new Guid("33333333-3333-3333-3333-333333333333"), 3, 150.0, 50.0, 1, "B4" },
                    { "2bc74a97-bd0c-4fe3-9f7f-5a516eb3749d", new Guid("33333333-3333-3333-3333-333333333333"), 2, 100.0, 100.0, 2, "C3" },
                    { "30c1a063-8d83-4d55-a9b2-9bad38321f46", new Guid("33333333-3333-3333-3333-333333333333"), 3, 150.0, 0.0, 0, "A4" },
                    { "310753cb-6399-4e85-96e3-ee665447585a", new Guid("55555555-5555-5555-5555-555555555555"), 3, 150.0, 0.0, 0, "A4" },
                    { "315e9fb3-51bc-4de5-86f0-c18b297ac39f", new Guid("44444444-4444-4444-4444-444444444444"), 4, 200.0, 50.0, 1, "B5" },
                    { "3162177e-26ac-48fc-8a72-8a17a855c8a8", new Guid("44444444-4444-4444-4444-444444444444"), 2, 100.0, 50.0, 1, "B3" },
                    { "32752236-be46-4104-8a90-be77bacb10ed", new Guid("55555555-5555-5555-5555-555555555555"), 3, 150.0, 100.0, 2, "C4" },
                    { "32c5f841-36a8-48b8-80ad-f9312b157933", new Guid("55555555-5555-5555-5555-555555555555"), 2, 100.0, 100.0, 2, "C3" },
                    { "378ee90a-3378-4e1e-8dcb-4bc3539a5de8", new Guid("33333333-3333-3333-3333-333333333333"), 2, 100.0, 50.0, 1, "B3" },
                    { "3bd25a3b-c7e5-4742-9446-49ee61a66d97", new Guid("33333333-3333-3333-3333-333333333333"), 4, 200.0, 50.0, 1, "B5" },
                    { "3e3dbf7a-c8bd-4890-b87f-3bf36cd32ee0", new Guid("44444444-4444-4444-4444-444444444444"), 2, 100.0, 100.0, 2, "C3" },
                    { "59564595-67dd-4c3d-8e56-65a3d419ba29", new Guid("55555555-5555-5555-5555-555555555555"), 4, 200.0, 50.0, 1, "B5" },
                    { "63f9c681-76fc-4036-a9ac-90309d105329", new Guid("33333333-3333-3333-3333-333333333333"), 4, 200.0, 0.0, 0, "A5" },
                    { "6a1720b9-0d3a-4f86-ac80-b9aad4177c4b", new Guid("55555555-5555-5555-5555-555555555555"), 0, 0.0, 100.0, 2, "C1" },
                    { "6e0f0f93-6696-4ee6-9594-5cada5a7e377", new Guid("44444444-4444-4444-4444-444444444444"), 1, 50.0, 50.0, 1, "B2" },
                    { "82a34820-b424-4084-9ef0-b5f5d57358bd", new Guid("44444444-4444-4444-4444-444444444444"), 1, 50.0, 100.0, 2, "C2" },
                    { "8aa895c9-5291-4c57-99da-cdf284c50cbe", new Guid("33333333-3333-3333-3333-333333333333"), 1, 50.0, 100.0, 2, "C2" },
                    { "8f071aee-e5cd-4fa1-a8e1-446f2159b7f1", new Guid("33333333-3333-3333-3333-333333333333"), 0, 0.0, 50.0, 1, "B1" },
                    { "a7aec762-a4c8-48ab-a264-e3e3b0bfbaaa", new Guid("44444444-4444-4444-4444-444444444444"), 3, 150.0, 0.0, 0, "A4" },
                    { "a846da96-cec6-4195-8b27-26b190293390", new Guid("55555555-5555-5555-5555-555555555555"), 4, 200.0, 100.0, 2, "C5" },
                    { "aac1f238-728b-4601-9a1d-b5e0d49c4826", new Guid("55555555-5555-5555-5555-555555555555"), 1, 50.0, 0.0, 0, "A2" },
                    { "c25dcb46-98ab-4ee7-9144-953e3be193d6", new Guid("44444444-4444-4444-4444-444444444444"), 3, 150.0, 100.0, 2, "C4" },
                    { "cd591858-ae1a-45f0-9257-79f8001dd7ee", new Guid("55555555-5555-5555-5555-555555555555"), 2, 100.0, 0.0, 0, "A3" },
                    { "cf58c50f-ac9a-4993-83bd-6c29e6ee8b82", new Guid("44444444-4444-4444-4444-444444444444"), 4, 200.0, 0.0, 0, "A5" },
                    { "d3e1a47a-58d0-4635-a063-aac4c2375c6d", new Guid("33333333-3333-3333-3333-333333333333"), 0, 0.0, 0.0, 0, "A1" },
                    { "e0f9e6d8-75ab-41b7-8bfd-b7236b6af644", new Guid("33333333-3333-3333-3333-333333333333"), 3, 150.0, 100.0, 2, "C4" },
                    { "ecd86c72-ea45-4a19-a510-d299fccadb89", new Guid("44444444-4444-4444-4444-444444444444"), 2, 100.0, 0.0, 0, "A3" },
                    { "f0158f50-3b2d-49e8-bfc4-f51392d32df3", new Guid("33333333-3333-3333-3333-333333333333"), 0, 0.0, 100.0, 2, "C1" },
                    { "f0d0034a-5046-48bd-b913-ee79e5824eed", new Guid("44444444-4444-4444-4444-444444444444"), 0, 0.0, 0.0, 0, "A1" },
                    { "f1e58087-4698-4e4e-a84a-b3349500b50c", new Guid("55555555-5555-5555-5555-555555555555"), 2, 100.0, 50.0, 1, "B3" },
                    { "f3c07c60-01b1-4a05-acd8-33dffc9a1c9f", new Guid("44444444-4444-4444-4444-444444444444"), 0, 0.0, 100.0, 2, "C1" },
                    { "f7563757-778a-4909-ada9-3034a27397e3", new Guid("33333333-3333-3333-3333-333333333333"), 1, 50.0, 0.0, 0, "A2" },
                    { "f75f91d0-57bb-4d05-ac3b-edef75838c5f", new Guid("55555555-5555-5555-5555-555555555555"), 1, 50.0, 50.0, 1, "B2" },
                    { "f8d0df4c-bec3-46e9-913f-8b235898f719", new Guid("44444444-4444-4444-4444-444444444444"), 3, 150.0, 50.0, 1, "B4" },
                    { "fe387fc7-363b-42bb-894c-727ee9c2e817", new Guid("33333333-3333-3333-3333-333333333333"), 1, 50.0, 50.0, 1, "B2" },
                    { "ff67ede9-47e0-4999-bf34-328cab51dfc3", new Guid("55555555-5555-5555-5555-555555555555"), 3, 150.0, 50.0, 1, "B4" }
                });

            migrationBuilder.CreateIndex(
                name: "IX_OrderDetailsInfo_SeatId",
                table: "OrderDetailsInfo",
                column: "SeatId");

            migrationBuilder.AddForeignKey(
                name: "FK_OrderDetailsInfo_SeatsInfoEntity_SeatId",
                table: "OrderDetailsInfo",
                column: "SeatId",
                principalTable: "SeatsInfoEntity",
                principalColumn: "SeatId",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_OrderDetailsInfo_SeatsInfoEntity_SeatId",
                table: "OrderDetailsInfo");

            migrationBuilder.DropPrimaryKey(
                name: "PK_OrderDetailsInfo",
                table: "OrderDetailsInfo");

            migrationBuilder.DropIndex(
                name: "IX_OrderDetailsInfo_SeatId",
                table: "OrderDetailsInfo");

            migrationBuilder.DeleteData(
                table: "AuditoriumFormatInfosEntity",
                keyColumns: new[] { "AuditoriumId", "FormatId" },
                keyValues: new object[] { new Guid("33333333-3333-3333-3333-333333333333"), new Guid("3fbc4a32-15f5-47e0-b98a-784f1b8a9612") });

            migrationBuilder.DeleteData(
                table: "AuditoriumFormatInfosEntity",
                keyColumns: new[] { "AuditoriumId", "FormatId" },
                keyValues: new object[] { new Guid("44444444-4444-4444-4444-444444444444"), new Guid("d29b0f1c-8e2a-4c5b-bc3d-1a2f3e4d5c6b") });

            migrationBuilder.DeleteData(
                table: "AuditoriumFormatInfosEntity",
                keyColumns: new[] { "AuditoriumId", "FormatId" },
                keyValues: new object[] { new Guid("55555555-5555-5555-5555-555555555555"), new Guid("7a5e82b1-c4d3-4a92-9e11-3f4b52c1a8d9") });

            migrationBuilder.DeleteData(
                table: "MovieFormatMovieInfoEntity",
                keyColumns: new[] { "FormatId", "MovieId" },
                keyValues: new object[] { new Guid("3fbc4a32-15f5-47e0-b98a-784f1b8a9612"), new Guid("66666666-6666-6666-6666-666666666666") });

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
                keyValues: new object[] { new Guid("f2a1b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c"), new Guid("66666666-6666-6666-6666-666666666666") });

            migrationBuilder.DeleteData(
                table: "MovieGenreMovieInfoEntity",
                keyColumns: new[] { "MovieGenreId", "MovieId" },
                keyValues: new object[] { new Guid("f6a7b8c9-d0e1-4f2a-3b4c-5d6e7f8a9b0c"), new Guid("77777777-7777-7777-7777-777777777777") });

            migrationBuilder.DeleteData(
                table: "MovieScheduleInfoEntity",
                keyColumn: "MovieScheduleInfoId",
                keyValue: new Guid("88888888-8888-8888-8888-888888888888"));

            migrationBuilder.DeleteData(
                table: "MovieScheduleInfoEntity",
                keyColumn: "MovieScheduleInfoId",
                keyValue: new Guid("99999999-9999-9999-9999-999999999999"));

            migrationBuilder.DeleteData(
                table: "MovieScheduleInfoEntity",
                keyColumn: "MovieScheduleInfoId",
                keyValue: new Guid("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"));

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "0083f312-505d-40af-bd76-1a7890f046f8");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "041e2b5c-412f-41f0-8a11-975d33a234d7");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "060b49e6-dc12-4731-be65-dc030b47210d");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "14c3d8e6-8f0c-4eab-a422-4b4fad6fd864");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "18f54627-6960-4ab1-83b8-6007a6b70131");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "1d2632bf-7a45-41e4-a62a-20a03175a032");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "1dc8c2c3-2f62-4b6a-8326-c52c81248023");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "21a098ca-9e0c-48fc-8b90-f6aa517ab367");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "28734db7-3ce0-4efb-ae07-cdc9fa0304a1");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "2aceccfa-4c7b-428f-bb3e-8dc8cc3f69b1");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "2bc74a97-bd0c-4fe3-9f7f-5a516eb3749d");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "30c1a063-8d83-4d55-a9b2-9bad38321f46");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "310753cb-6399-4e85-96e3-ee665447585a");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "315e9fb3-51bc-4de5-86f0-c18b297ac39f");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "3162177e-26ac-48fc-8a72-8a17a855c8a8");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "32752236-be46-4104-8a90-be77bacb10ed");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "32c5f841-36a8-48b8-80ad-f9312b157933");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "378ee90a-3378-4e1e-8dcb-4bc3539a5de8");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "3bd25a3b-c7e5-4742-9446-49ee61a66d97");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "3e3dbf7a-c8bd-4890-b87f-3bf36cd32ee0");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "59564595-67dd-4c3d-8e56-65a3d419ba29");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "63f9c681-76fc-4036-a9ac-90309d105329");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "6a1720b9-0d3a-4f86-ac80-b9aad4177c4b");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "6e0f0f93-6696-4ee6-9594-5cada5a7e377");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "82a34820-b424-4084-9ef0-b5f5d57358bd");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "8aa895c9-5291-4c57-99da-cdf284c50cbe");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "8f071aee-e5cd-4fa1-a8e1-446f2159b7f1");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "a7aec762-a4c8-48ab-a264-e3e3b0bfbaaa");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "a846da96-cec6-4195-8b27-26b190293390");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "aac1f238-728b-4601-9a1d-b5e0d49c4826");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "c25dcb46-98ab-4ee7-9144-953e3be193d6");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "cd591858-ae1a-45f0-9257-79f8001dd7ee");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "cf58c50f-ac9a-4993-83bd-6c29e6ee8b82");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "d3e1a47a-58d0-4635-a063-aac4c2375c6d");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "e0f9e6d8-75ab-41b7-8bfd-b7236b6af644");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "ecd86c72-ea45-4a19-a510-d299fccadb89");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "f0158f50-3b2d-49e8-bfc4-f51392d32df3");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "f0d0034a-5046-48bd-b913-ee79e5824eed");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "f1e58087-4698-4e4e-a84a-b3349500b50c");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "f3c07c60-01b1-4a05-acd8-33dffc9a1c9f");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "f7563757-778a-4909-ada9-3034a27397e3");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "f75f91d0-57bb-4d05-ac3b-edef75838c5f");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "f8d0df4c-bec3-46e9-913f-8b235898f719");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "fe387fc7-363b-42bb-894c-727ee9c2e817");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "ff67ede9-47e0-4999-bf34-328cab51dfc3");

            migrationBuilder.DeleteData(
                table: "AuditoriumInfoEntities",
                keyColumn: "AuditoriumId",
                keyValue: new Guid("33333333-3333-3333-3333-333333333333"));

            migrationBuilder.DeleteData(
                table: "AuditoriumInfoEntities",
                keyColumn: "AuditoriumId",
                keyValue: new Guid("44444444-4444-4444-4444-444444444444"));

            migrationBuilder.DeleteData(
                table: "AuditoriumInfoEntities",
                keyColumn: "AuditoriumId",
                keyValue: new Guid("55555555-5555-5555-5555-555555555555"));

            migrationBuilder.DeleteData(
                table: "MovieInfoEntity",
                keyColumn: "MovieId",
                keyValue: new Guid("66666666-6666-6666-6666-666666666666"));

            migrationBuilder.DeleteData(
                table: "MovieInfoEntity",
                keyColumn: "MovieId",
                keyValue: new Guid("77777777-7777-7777-7777-777777777777"));

            migrationBuilder.DeleteData(
                table: "CinemaInfoEntity",
                keyColumn: "CinemaId",
                keyValue: new Guid("11111111-1111-1111-1111-111111111111"));

            migrationBuilder.DeleteData(
                table: "CinemaInfoEntity",
                keyColumn: "CinemaId",
                keyValue: new Guid("22222222-2222-2222-2222-222222222222"));

            migrationBuilder.DropColumn(
                name: "VnPayTransactionId",
                table: "OrderInfoEntity");

            migrationBuilder.DropColumn(
                name: "StartTime",
                table: "MovieScheduleInfoEntity");

            migrationBuilder.DropColumn(
                name: "Actors",
                table: "MovieInfoEntity");

            migrationBuilder.DropColumn(
                name: "Director",
                table: "MovieInfoEntity");

            migrationBuilder.DropColumn(
                name: "TrailerUrl",
                table: "MovieInfoEntity");

            migrationBuilder.DropColumn(
                name: "CinemaCity",
                table: "CinemaInfoEntity");

            migrationBuilder.AlterColumn<Guid>(
                name: "SeatId",
                table: "OrderDetailsInfo",
                type: "uniqueidentifier",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "varchar(100)");

            migrationBuilder.AddPrimaryKey(
                name: "PK_OrderDetailsInfo",
                table: "OrderDetailsInfo",
                columns: new[] { "OrderId", "MovieScheduleId" });
        }
    }
}
