using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace DataAccess.Migrations
{
    /// <inheritdoc />
    public partial class FixMovieFormatsAndDeterministicSeats : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Clear existing transactional and master data that might conflict with new seeds
            migrationBuilder.Sql("DELETE FROM [OrderDetailsInfoEntity]");
            migrationBuilder.Sql("DELETE FROM [OrderInfoEntity]");
            migrationBuilder.Sql("DELETE FROM [MovieScheduleInfoEntity]");
            migrationBuilder.Sql("DELETE FROM [SeatsInfoEntity]");

            migrationBuilder.Sql(@"
                IF NOT EXISTS (SELECT 1 FROM [MovieFormatInfoEntity] WHERE MovieFormatId = '3fbc4a32-15f5-47e0-b98a-784f1b8a9612')
                INSERT INTO [MovieFormatInfoEntity] (MovieFormatId, MovieFormatName, MovieFormatDescription, MovieFormatPrice, CreatedAt, UpdatedAt, ActiveAt, CreatedByUserId, IsActive, IsDeleted)
                VALUES ('3fbc4a32-15f5-47e0-b98a-784f1b8a9612', '2D', 'Standard digital 2D format with crystal clear image quality.', 80000, '2024-01-01', '2024-01-01', '2024-01-01', 'e4e1f7d8-c3b2-4a90-8c67-2f5a1b3d9e0c', 1, 0);

                IF NOT EXISTS (SELECT 1 FROM [MovieFormatInfoEntity] WHERE MovieFormatId = '7a5e82b1-c4d3-4a92-9e11-3f4b52c1a8d9')
                INSERT INTO [MovieFormatInfoEntity] (MovieFormatId, MovieFormatName, MovieFormatDescription, MovieFormatPrice, CreatedAt, UpdatedAt, ActiveAt, CreatedByUserId, IsActive, IsDeleted)
                VALUES ('7a5e82b1-c4d3-4a92-9e11-3f4b52c1a8d9', '3D', 'Immersive three-dimensional visual experience with specialized glasses.', 110000, '2024-01-01', '2024-01-01', '2024-01-01', 'e4e1f7d8-c3b2-4a90-8c67-2f5a1b3d9e0c', 1, 0);

                IF NOT EXISTS (SELECT 1 FROM [MovieFormatInfoEntity] WHERE MovieFormatId = 'd29b0f1c-8e2a-4c5b-bc3d-1a2f3e4d5c6b')
                INSERT INTO [MovieFormatInfoEntity] (MovieFormatId, MovieFormatName, MovieFormatDescription, MovieFormatPrice, CreatedAt, UpdatedAt, ActiveAt, CreatedByUserId, IsActive, IsDeleted)
                VALUES ('d29b0f1c-8e2a-4c5b-bc3d-1a2f3e4d5c6b', 'IMAX', 'Giant screen format with unparalleled brightness and ultra-high resolution.', 250000, '2024-01-01', '2024-01-01', '2024-01-01', 'e4e1f7d8-c3b2-4a90-8c67-2f5a1b3d9e0c', 1, 0);

                IF NOT EXISTS (SELECT 1 FROM [MovieFormatInfoEntity] WHERE MovieFormatId = 'f9e1d2c3-b4a5-4e6f-8d7c-9b0a1f2e3d4c')
                INSERT INTO [MovieFormatInfoEntity] (MovieFormatId, MovieFormatName, MovieFormatDescription, MovieFormatPrice, CreatedAt, UpdatedAt, ActiveAt, CreatedByUserId, IsActive, IsDeleted)
                VALUES ('f9e1d2c3-b4a5-4e6f-8d7c-9b0a1f2e3d4c', 'Dolby Atmos', 'State-of-the-art surround sound technology for a lifelike audio experience.', 130000, '2024-01-01', '2024-01-01', '2024-01-01', 'e4e1f7d8-c3b2-4a90-8c67-2f5a1b3d9e0c', 1, 0);

                IF NOT EXISTS (SELECT 1 FROM [MovieFormatInfoEntity] WHERE MovieFormatId = 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d')
                INSERT INTO [MovieFormatInfoEntity] (MovieFormatId, MovieFormatName, MovieFormatDescription, MovieFormatPrice, CreatedAt, UpdatedAt, ActiveAt, CreatedByUserId, IsActive, IsDeleted)
                VALUES ('a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d', 'ScreenX', 'A revolutionary 270-degree panoramic cinematic experience.', 160000, '2024-01-01', '2024-01-01', '2024-01-01', 'e4e1f7d8-c3b2-4a90-8c67-2f5a1b3d9e0c', 1, 0);

                IF NOT EXISTS (SELECT 1 FROM [MovieFormatInfoEntity] WHERE MovieFormatId = '5d4c3b2a-1f0e-4d9c-8b7a-6e5d4c3b2a1f')
                INSERT INTO [MovieFormatInfoEntity] (MovieFormatId, MovieFormatName, MovieFormatDescription, MovieFormatPrice, CreatedAt, UpdatedAt, ActiveAt, CreatedByUserId, IsActive, IsDeleted)
                VALUES ('5d4c3b2a-1f0e-4d9c-8b7a-6e5d4c3b2a1f', '4DX', 'Multi-sensory experience featuring motion seats, wind, water, and scents.', 180000, '2024-01-01', '2024-01-01', '2024-01-01', 'e4e1f7d8-c3b2-4a90-8c67-2f5a1b3d9e0c', 1, 0);

                IF NOT EXISTS (SELECT 1 FROM [MovieFormatInfoEntity] WHERE MovieFormatId = '9f8e7d6c-5b4a-4e3d-2c1b-0a9f8e7d6c5b')
                INSERT INTO [MovieFormatInfoEntity] (MovieFormatId, MovieFormatName, MovieFormatDescription, MovieFormatPrice, CreatedAt, UpdatedAt, ActiveAt, CreatedByUserId, IsActive, IsDeleted)
                VALUES ('9f8e7d6c-5b4a-4e3d-2c1b-0a9f8e7d6c5b', 'Gold Class', 'Premium luxury seating with in-theater dining and personalized service.', 300000, '2024-01-01', '2024-01-01', '2024-01-01', 'e4e1f7d8-c3b2-4a90-8c67-2f5a1b3d9e0c', 1, 0);

                IF NOT EXISTS (SELECT 1 FROM [MovieFormatInfoEntity] WHERE MovieFormatId = '1c2d3e4f-5a6b-4c7d-8e9f-0a1b2c3d4e5f')
                INSERT INTO [MovieFormatInfoEntity] (MovieFormatId, MovieFormatName, MovieFormatDescription, MovieFormatPrice, CreatedAt, UpdatedAt, ActiveAt, CreatedByUserId, IsActive, IsDeleted)
                VALUES ('1c2d3e4f-5a6b-4c7d-8e9f-0a1b2c3d4e5f', 'L''Amour', 'Luxury bed-seating auditorium designed for ultimate comfort and couples.', 600000, '2024-01-01', '2024-01-01', '2024-01-01', 'e4e1f7d8-c3b2-4a90-8c67-2f5a1b3d9e0c', 1, 0);
            ");

            migrationBuilder.DeleteData(
                table: "MovieScheduleInfoEntity",
                keyColumn: "MovieScheduleInfoId",
                keyValue: new Guid("24451f1a-e807-4317-93d5-0ed02532ec6d"));

            migrationBuilder.DeleteData(
                table: "MovieScheduleInfoEntity",
                keyColumn: "MovieScheduleInfoId",
                keyValue: new Guid("9ab6a86c-246c-43e6-bde4-214e30205f96"));

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "01fa0a85-a9bf-43c1-8870-41ce702d6c3f");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "05527976-186b-4784-afb2-d2c412d86e0b");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "074602e9-e76c-4c45-a5ff-ff1f743e2f95");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "077a4bef-210c-4d97-ae67-baa00975f1a1");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "0c0c9392-a58a-42bc-bad2-993a03e44a21");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "0c2949d6-1c1a-48a2-91d5-d578cda88ea5");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "0d532393-3485-4515-89c5-102eee8c6c8a");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "11c7f67c-a204-48b9-ab63-8625271ca102");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "14b05914-4ac5-400b-8c11-346033238016");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "173db5de-cbef-40aa-a46f-1d7d3e5344e1");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "18ab32bf-7412-40bb-8146-ad4c1526ac56");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "18deb7b4-8a0d-4336-b4e0-d4b60d3ec5dd");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "19713b74-64ca-406f-beff-8f7bb29e48bd");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "1c5572a6-4295-42bb-93b0-0c0d3e90c100");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "1f501102-4c1c-43f9-a0db-64683f2500f8");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "207524e2-ac1a-45a6-99c5-ce62491c7a63");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "208494da-c6a0-4d70-87f3-5ff8f11189cb");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "22079b78-ee83-45d4-93f2-556b2d6346ca");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "23b941cb-d882-4c19-9d71-a16af5f997e1");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "244168d6-b87c-4c57-913a-649fde3754ea");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "264ed062-62fb-43cc-86f4-8ada5534f852");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "26d253d5-7369-449c-94ff-582ba3e1662a");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "28a5ab82-bbe6-4dde-91d3-9c7f25d7acc4");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "2af27e13-4cc4-4214-b19c-e6b952874641");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "30923d27-2f7a-4478-93ef-be5f40a4647a");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "3785e887-fd2a-4207-af51-23461bcafacf");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "38cdafc5-089b-4aa4-a7e5-a74f496e50ee");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "3c0347e9-0be5-4fcc-adea-8d44fd8567ac");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "3cdc33dd-c989-474b-9cfa-301cbe7d21bc");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "467efeab-70f5-49a6-a8ed-728a36e3915d");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "49d77488-adcd-4f63-a1d1-1e6381db9545");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "4cddaa84-1f3d-48ee-b0f5-175828d05088");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "55f7444d-8f15-481b-8943-3e7bd0b83b5c");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "564d592b-a500-4c2b-a4b9-5cdd18a9cf94");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "575ab31a-1570-4fa0-90a8-bb116bc3f084");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "57e36b1b-6d47-445f-b879-c17b32f39310");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "5c20796f-67a5-4c4a-8ee5-3ff33011d001");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "5cc4a51a-09d7-4fd4-8ed5-ea7c6091ad66");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "5f075e7d-06a5-43c2-9673-81c71ed4667d");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "646c2c16-4a26-4e6c-b442-a6141b00a0b0");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "64a9ede3-944d-49f2-b15a-9921f168b228");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "6583c2ef-2480-496a-b142-833e2ef45036");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "67417068-26a7-480d-b6df-49603db14b55");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "678336a0-041b-4534-b315-b053348864e7");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "6aec3b6a-1297-4b4a-9357-68cc2253371e");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "6c175e3c-4a13-47f3-9b55-62c973774df8");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "6f2402d2-542d-4908-930d-2073f452a00a");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "727b3583-965a-4238-be51-9f5f5f757f18");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "751670d7-46d0-46e4-ac95-17f479c102fe");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "7712a8fb-f6dd-41ed-b6e5-74d6d45ba30f");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "7719c56e-a68f-4a8a-b102-4192e8d5a8a4");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "7e16f6c2-1ebd-4910-8bde-66f941d96423");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "7e6f7ce0-2b11-4ade-8d47-2798384d79c5");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "80bd10f8-f8d4-4f87-8dc9-f48cb54eb5e2");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "82b6b235-c9a0-4904-86f0-2f887a07f729");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "833a2856-24ab-4582-b4da-85c2eeb3418a");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "8561f473-00b9-4fba-98fd-6565a4aca112");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "869bc8ad-7518-47ae-bfc3-13d4eeac2277");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "8a09fc94-2b91-42fc-a478-9af9a911f137");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "92c9a654-17cb-4d6b-ab77-3a359aa2b144");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "973bcde6-849c-4043-88b5-9a471eae1906");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "a386837f-846e-41a5-8f5f-ec598102bd5a");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "a755bbfe-2167-42ad-ac4a-070e4176932f");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "ab671234-12a5-4925-82c5-cb6088e7962a");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "aecbabf4-6d36-4b6c-b4de-9f6f1756f38b");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "af45556e-b6ea-44ba-a58a-8bdd2ae1834a");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "afc43066-44da-4305-bd52-d813a759079f");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "b2e7ec8b-b69b-4d38-8dc7-22acb1cf7c6c");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "b4c01315-6d25-4ad5-8d06-e958e3582b98");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "b72d696f-5aa2-4815-aa8d-3ef1545f014e");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "b8095595-2cec-41b2-99a2-8f1ee9e6a6f8");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "b9f7e9b0-5bef-46f4-a7a0-212bb942f6c9");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "ba77788b-8a5d-4922-8160-eae20b9806a6");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "bfaa0d66-3a0a-4155-bcf1-0f9d4d917bb4");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "c1d6dfd4-51cd-4012-ac01-c9ba8b5508e4");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "c2bfe787-c1b6-475e-8fd1-b06567a43015");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "c50c5e1b-07c0-460a-b813-33910fc4c4b6");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "c719ef7e-85c0-4d6e-bd39-ba696a2be2d1");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "cc14a14b-4827-4d09-ae93-ac61b1897a53");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "cd781ad1-8606-40a9-8147-e574117695a8");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "d2cd885f-9181-4fa8-9901-c194237a59ca");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "d4940178-7c4c-46cb-9e93-fdabc7112539");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "d9d138f7-0f5b-4fcf-926a-6ceb0f62b4a8");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "da16ca3d-01fc-4aeb-858a-8aedebf360b9");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "db150e78-a375-4d0a-ac2c-71baeab7b4a6");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "dcacbe81-cb2e-42b0-9002-930afa1b6734");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "e0e8d2b4-7d7e-40b4-94ae-c91d46e33a19");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "e8a02fb5-966f-470e-9b5c-3e07b3f6be66");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "e8b27282-eeb6-444f-b510-884df6c965f2");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "ed4c1112-b9b0-4a67-8be0-b309a6888fdf");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "f138941a-9a0e-4cbe-84b2-a23a818af851");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "f67f1b3b-23ae-48c6-9b97-f9bb82d6dfc9");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "fcc3d087-c0e5-4e61-ab1f-8a8c5c7e03fe");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "fcf21d8f-c4fa-41bc-92f1-788a5ceda60b");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "fd5bebef-0a58-4487-9779-8be3b8d59696");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "fd673d52-7984-4046-b0de-bb89c46c353c");

            migrationBuilder.UpdateData(
                table: "AuditoriumInfoEntities",
                keyColumn: "AuditoriumId",
                keyValue: new Guid("33333333-3333-3333-3333-333333333333"),
                column: "UpdatedAt",
                value: new DateTime(2026, 3, 18, 1, 8, 16, 945, DateTimeKind.Local).AddTicks(7669));

            migrationBuilder.UpdateData(
                table: "AuditoriumInfoEntities",
                keyColumn: "AuditoriumId",
                keyValue: new Guid("44444444-4444-4444-4444-444444444444"),
                column: "UpdatedAt",
                value: new DateTime(2026, 3, 18, 1, 8, 16, 945, DateTimeKind.Local).AddTicks(7673));

            migrationBuilder.UpdateData(
                table: "AuditoriumInfoEntities",
                keyColumn: "AuditoriumId",
                keyValue: new Guid("55555555-5555-5555-5555-555555555555"),
                column: "UpdatedAt",
                value: new DateTime(2026, 3, 18, 1, 8, 16, 945, DateTimeKind.Local).AddTicks(7675));

            migrationBuilder.UpdateData(
                table: "CinemaInfoEntity",
                keyColumn: "CinemaId",
                keyValue: new Guid("11111111-1111-1111-1111-111111111111"),
                column: "UpdatedAt",
                value: new DateTime(2026, 3, 18, 1, 8, 16, 945, DateTimeKind.Local).AddTicks(7616));

            migrationBuilder.UpdateData(
                table: "CinemaInfoEntity",
                keyColumn: "CinemaId",
                keyValue: new Guid("22222222-2222-2222-2222-222222222222"),
                column: "UpdatedAt",
                value: new DateTime(2026, 3, 18, 1, 8, 16, 945, DateTimeKind.Local).AddTicks(7622));

            migrationBuilder.UpdateData(
                table: "CinemaInfoEntity",
                keyColumn: "CinemaId",
                keyValue: new Guid("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
                column: "UpdatedAt",
                value: new DateTime(2026, 3, 18, 1, 8, 16, 945, DateTimeKind.Local).AddTicks(7625));

            migrationBuilder.UpdateData(
                table: "MovieInfoEntity",
                keyColumn: "MovieId",
                keyValue: new Guid("66666666-6666-6666-6666-666666666666"),
                columns: new[] { "ActiveAt", "EndedDate", "UpdatedAt" },
                values: new object[] { new DateTime(2026, 3, 13, 0, 0, 0, 0, DateTimeKind.Unspecified), new DateTime(2026, 4, 12, 0, 0, 0, 0, DateTimeKind.Unspecified), new DateTime(2026, 3, 18, 1, 8, 16, 945, DateTimeKind.Local).AddTicks(8834) });

            migrationBuilder.UpdateData(
                table: "MovieInfoEntity",
                keyColumn: "MovieId",
                keyValue: new Guid("77777777-7777-7777-7777-777777777777"),
                columns: new[] { "ActiveAt", "EndedDate", "UpdatedAt" },
                values: new object[] { new DateTime(2026, 3, 17, 0, 0, 0, 0, DateTimeKind.Unspecified), new DateTime(2026, 4, 17, 0, 0, 0, 0, DateTimeKind.Unspecified), new DateTime(2026, 3, 18, 1, 8, 16, 945, DateTimeKind.Local).AddTicks(8865) });

            migrationBuilder.UpdateData(
                table: "MovieInfoEntity",
                keyColumn: "MovieId",
                keyValue: new Guid("88888888-8888-8888-8888-888888888888"),
                columns: new[] { "ActiveAt", "EndedDate", "UpdatedAt" },
                values: new object[] { new DateTime(2026, 3, 28, 0, 0, 0, 0, DateTimeKind.Unspecified), new DateTime(2026, 4, 27, 0, 0, 0, 0, DateTimeKind.Unspecified), new DateTime(2026, 3, 18, 1, 8, 16, 945, DateTimeKind.Local).AddTicks(8870) });

            migrationBuilder.InsertData(
                table: "MovieScheduleInfoEntity",
                columns: new[] { "MovieScheduleInfoId", "ActiveAt", "AuditoriumId", "CreatedAt", "CreatedByUserId", "DeletedAt", "DeletedByUserId", "EndedTime", "IsActive", "IsDeleted", "MovieFormatId", "MovieId", "StartTime", "UpdatedAt", "UpdatedByUserId" },
                values: new object[,]
                {
                    { new Guid("449df7b2-9a4e-42a6-a441-3cf9ee213856"), new DateTime(2026, 3, 19, 19, 0, 0, 0, DateTimeKind.Unspecified), new Guid("33333333-3333-3333-3333-333333333333"), new DateTime(2026, 3, 18, 1, 8, 16, 945, DateTimeKind.Local).AddTicks(9011), new Guid("7b5d2c1e-9f8a-3e7b-c1d2-a0e9f8c7b6a5"), null, null, new DateTime(2026, 3, 19, 21, 56, 0, 0, DateTimeKind.Unspecified), true, false, new Guid("3fbc4a32-15f5-47e0-b98a-784f1b8a9612"), new Guid("66666666-6666-6666-6666-666666666666"), new DateTime(2026, 3, 19, 19, 0, 0, 0, DateTimeKind.Unspecified), new DateTime(2026, 3, 18, 1, 8, 16, 945, DateTimeKind.Local).AddTicks(9012), null },
                    { new Guid("7c37b7f2-77f3-4033-ad80-77adcb6713d3"), new DateTime(2026, 3, 19, 20, 0, 0, 0, DateTimeKind.Unspecified), new Guid("44444444-4444-4444-4444-444444444444"), new DateTime(2026, 3, 18, 1, 8, 16, 945, DateTimeKind.Local).AddTicks(9104), new Guid("e4e1f7d8-c3b2-4a90-8c67-2f5a1b3d9e0c"), null, null, new DateTime(2026, 3, 19, 23, 0, 0, 0, DateTimeKind.Unspecified), true, false, new Guid("d29b0f1c-8e2a-4c5b-bc3d-1a2f3e4d5c6b"), new Guid("77777777-7777-7777-7777-777777777777"), new DateTime(2026, 3, 19, 20, 0, 0, 0, DateTimeKind.Unspecified), new DateTime(2026, 3, 18, 1, 8, 16, 945, DateTimeKind.Local).AddTicks(9104), null }
                });

            migrationBuilder.InsertData(
                table: "SeatsInfoEntity",
                columns: new[] { "SeatId", "AuditoriumId", "ColIndex", "CoordX", "CoordY", "RowIndex", "SeatNumber" },
                values: new object[,]
                {
                    { "33333333-3333-3333-3333-000000000001", new Guid("33333333-3333-3333-3333-333333333333"), 0, 0.0, 0.0, 0, "A1" },
                    { "33333333-3333-3333-3333-000000000002", new Guid("33333333-3333-3333-3333-333333333333"), 1, 60.0, 0.0, 0, "A2" },
                    { "33333333-3333-3333-3333-000000000003", new Guid("33333333-3333-3333-3333-333333333333"), 2, 120.0, 0.0, 0, "A3" },
                    { "33333333-3333-3333-3333-000000000004", new Guid("33333333-3333-3333-3333-333333333333"), 3, 180.0, 0.0, 0, "A4" },
                    { "33333333-3333-3333-3333-000000000005", new Guid("33333333-3333-3333-3333-333333333333"), 4, 240.0, 0.0, 0, "A5" },
                    { "33333333-3333-3333-3333-000000000006", new Guid("33333333-3333-3333-3333-333333333333"), 5, 300.0, 0.0, 0, "A6" },
                    { "33333333-3333-3333-3333-000000000007", new Guid("33333333-3333-3333-3333-333333333333"), 6, 360.0, 0.0, 0, "A7" },
                    { "33333333-3333-3333-3333-000000000008", new Guid("33333333-3333-3333-3333-333333333333"), 7, 420.0, 0.0, 0, "A8" },
                    { "33333333-3333-3333-3333-000100000001", new Guid("33333333-3333-3333-3333-333333333333"), 0, 0.0, 60.0, 1, "B1" },
                    { "33333333-3333-3333-3333-000100000002", new Guid("33333333-3333-3333-3333-333333333333"), 1, 60.0, 60.0, 1, "B2" },
                    { "33333333-3333-3333-3333-000100000003", new Guid("33333333-3333-3333-3333-333333333333"), 2, 120.0, 60.0, 1, "B3" },
                    { "33333333-3333-3333-3333-000100000004", new Guid("33333333-3333-3333-3333-333333333333"), 3, 180.0, 60.0, 1, "B4" },
                    { "33333333-3333-3333-3333-000100000005", new Guid("33333333-3333-3333-3333-333333333333"), 4, 240.0, 60.0, 1, "B5" },
                    { "33333333-3333-3333-3333-000100000006", new Guid("33333333-3333-3333-3333-333333333333"), 5, 300.0, 60.0, 1, "B6" },
                    { "33333333-3333-3333-3333-000100000007", new Guid("33333333-3333-3333-3333-333333333333"), 6, 360.0, 60.0, 1, "B7" },
                    { "33333333-3333-3333-3333-000100000008", new Guid("33333333-3333-3333-3333-333333333333"), 7, 420.0, 60.0, 1, "B8" },
                    { "33333333-3333-3333-3333-000200000001", new Guid("33333333-3333-3333-3333-333333333333"), 0, 0.0, 120.0, 2, "C1" },
                    { "33333333-3333-3333-3333-000200000002", new Guid("33333333-3333-3333-3333-333333333333"), 1, 60.0, 120.0, 2, "C2" },
                    { "33333333-3333-3333-3333-000200000003", new Guid("33333333-3333-3333-3333-333333333333"), 2, 120.0, 120.0, 2, "C3" },
                    { "33333333-3333-3333-3333-000200000004", new Guid("33333333-3333-3333-3333-333333333333"), 3, 180.0, 120.0, 2, "C4" },
                    { "33333333-3333-3333-3333-000200000005", new Guid("33333333-3333-3333-3333-333333333333"), 4, 240.0, 120.0, 2, "C5" },
                    { "33333333-3333-3333-3333-000200000006", new Guid("33333333-3333-3333-3333-333333333333"), 5, 300.0, 120.0, 2, "C6" },
                    { "33333333-3333-3333-3333-000200000007", new Guid("33333333-3333-3333-3333-333333333333"), 6, 360.0, 120.0, 2, "C7" },
                    { "33333333-3333-3333-3333-000200000008", new Guid("33333333-3333-3333-3333-333333333333"), 7, 420.0, 120.0, 2, "C8" },
                    { "33333333-3333-3333-3333-000300000001", new Guid("33333333-3333-3333-3333-333333333333"), 0, 0.0, 180.0, 3, "D1" },
                    { "33333333-3333-3333-3333-000300000002", new Guid("33333333-3333-3333-3333-333333333333"), 1, 60.0, 180.0, 3, "D2" },
                    { "33333333-3333-3333-3333-000300000003", new Guid("33333333-3333-3333-3333-333333333333"), 2, 120.0, 180.0, 3, "D3" },
                    { "33333333-3333-3333-3333-000300000004", new Guid("33333333-3333-3333-3333-333333333333"), 3, 180.0, 180.0, 3, "D4" },
                    { "33333333-3333-3333-3333-000300000005", new Guid("33333333-3333-3333-3333-333333333333"), 4, 240.0, 180.0, 3, "D5" },
                    { "33333333-3333-3333-3333-000300000006", new Guid("33333333-3333-3333-3333-333333333333"), 5, 300.0, 180.0, 3, "D6" },
                    { "33333333-3333-3333-3333-000300000007", new Guid("33333333-3333-3333-3333-333333333333"), 6, 360.0, 180.0, 3, "D7" },
                    { "33333333-3333-3333-3333-000300000008", new Guid("33333333-3333-3333-3333-333333333333"), 7, 420.0, 180.0, 3, "D8" },
                    { "44444444-4444-4444-4444-000000000001", new Guid("44444444-4444-4444-4444-444444444444"), 0, 0.0, 0.0, 0, "A1" },
                    { "44444444-4444-4444-4444-000000000002", new Guid("44444444-4444-4444-4444-444444444444"), 1, 60.0, 0.0, 0, "A2" },
                    { "44444444-4444-4444-4444-000000000003", new Guid("44444444-4444-4444-4444-444444444444"), 2, 120.0, 0.0, 0, "A3" },
                    { "44444444-4444-4444-4444-000000000004", new Guid("44444444-4444-4444-4444-444444444444"), 3, 180.0, 0.0, 0, "A4" },
                    { "44444444-4444-4444-4444-000000000005", new Guid("44444444-4444-4444-4444-444444444444"), 4, 240.0, 0.0, 0, "A5" },
                    { "44444444-4444-4444-4444-000000000006", new Guid("44444444-4444-4444-4444-444444444444"), 5, 300.0, 0.0, 0, "A6" },
                    { "44444444-4444-4444-4444-000000000007", new Guid("44444444-4444-4444-4444-444444444444"), 6, 360.0, 0.0, 0, "A7" },
                    { "44444444-4444-4444-4444-000000000008", new Guid("44444444-4444-4444-4444-444444444444"), 7, 420.0, 0.0, 0, "A8" },
                    { "44444444-4444-4444-4444-000100000001", new Guid("44444444-4444-4444-4444-444444444444"), 0, 0.0, 60.0, 1, "B1" },
                    { "44444444-4444-4444-4444-000100000002", new Guid("44444444-4444-4444-4444-444444444444"), 1, 60.0, 60.0, 1, "B2" },
                    { "44444444-4444-4444-4444-000100000003", new Guid("44444444-4444-4444-4444-444444444444"), 2, 120.0, 60.0, 1, "B3" },
                    { "44444444-4444-4444-4444-000100000004", new Guid("44444444-4444-4444-4444-444444444444"), 3, 180.0, 60.0, 1, "B4" },
                    { "44444444-4444-4444-4444-000100000005", new Guid("44444444-4444-4444-4444-444444444444"), 4, 240.0, 60.0, 1, "B5" },
                    { "44444444-4444-4444-4444-000100000006", new Guid("44444444-4444-4444-4444-444444444444"), 5, 300.0, 60.0, 1, "B6" },
                    { "44444444-4444-4444-4444-000100000007", new Guid("44444444-4444-4444-4444-444444444444"), 6, 360.0, 60.0, 1, "B7" },
                    { "44444444-4444-4444-4444-000100000008", new Guid("44444444-4444-4444-4444-444444444444"), 7, 420.0, 60.0, 1, "B8" },
                    { "44444444-4444-4444-4444-000200000001", new Guid("44444444-4444-4444-4444-444444444444"), 0, 0.0, 120.0, 2, "C1" },
                    { "44444444-4444-4444-4444-000200000002", new Guid("44444444-4444-4444-4444-444444444444"), 1, 60.0, 120.0, 2, "C2" },
                    { "44444444-4444-4444-4444-000200000003", new Guid("44444444-4444-4444-4444-444444444444"), 2, 120.0, 120.0, 2, "C3" },
                    { "44444444-4444-4444-4444-000200000004", new Guid("44444444-4444-4444-4444-444444444444"), 3, 180.0, 120.0, 2, "C4" },
                    { "44444444-4444-4444-4444-000200000005", new Guid("44444444-4444-4444-4444-444444444444"), 4, 240.0, 120.0, 2, "C5" },
                    { "44444444-4444-4444-4444-000200000006", new Guid("44444444-4444-4444-4444-444444444444"), 5, 300.0, 120.0, 2, "C6" },
                    { "44444444-4444-4444-4444-000200000007", new Guid("44444444-4444-4444-4444-444444444444"), 6, 360.0, 120.0, 2, "C7" },
                    { "44444444-4444-4444-4444-000200000008", new Guid("44444444-4444-4444-4444-444444444444"), 7, 420.0, 120.0, 2, "C8" },
                    { "44444444-4444-4444-4444-000300000001", new Guid("44444444-4444-4444-4444-444444444444"), 0, 0.0, 180.0, 3, "D1" },
                    { "44444444-4444-4444-4444-000300000002", new Guid("44444444-4444-4444-4444-444444444444"), 1, 60.0, 180.0, 3, "D2" },
                    { "44444444-4444-4444-4444-000300000003", new Guid("44444444-4444-4444-4444-444444444444"), 2, 120.0, 180.0, 3, "D3" },
                    { "44444444-4444-4444-4444-000300000004", new Guid("44444444-4444-4444-4444-444444444444"), 3, 180.0, 180.0, 3, "D4" },
                    { "44444444-4444-4444-4444-000300000005", new Guid("44444444-4444-4444-4444-444444444444"), 4, 240.0, 180.0, 3, "D5" },
                    { "44444444-4444-4444-4444-000300000006", new Guid("44444444-4444-4444-4444-444444444444"), 5, 300.0, 180.0, 3, "D6" },
                    { "44444444-4444-4444-4444-000300000007", new Guid("44444444-4444-4444-4444-444444444444"), 6, 360.0, 180.0, 3, "D7" },
                    { "44444444-4444-4444-4444-000300000008", new Guid("44444444-4444-4444-4444-444444444444"), 7, 420.0, 180.0, 3, "D8" },
                    { "55555555-5555-5555-5555-000000000001", new Guid("55555555-5555-5555-5555-555555555555"), 0, 0.0, 0.0, 0, "A1" },
                    { "55555555-5555-5555-5555-000000000002", new Guid("55555555-5555-5555-5555-555555555555"), 1, 60.0, 0.0, 0, "A2" },
                    { "55555555-5555-5555-5555-000000000003", new Guid("55555555-5555-5555-5555-555555555555"), 2, 120.0, 0.0, 0, "A3" },
                    { "55555555-5555-5555-5555-000000000004", new Guid("55555555-5555-5555-5555-555555555555"), 3, 180.0, 0.0, 0, "A4" },
                    { "55555555-5555-5555-5555-000000000005", new Guid("55555555-5555-5555-5555-555555555555"), 4, 240.0, 0.0, 0, "A5" },
                    { "55555555-5555-5555-5555-000000000006", new Guid("55555555-5555-5555-5555-555555555555"), 5, 300.0, 0.0, 0, "A6" },
                    { "55555555-5555-5555-5555-000000000007", new Guid("55555555-5555-5555-5555-555555555555"), 6, 360.0, 0.0, 0, "A7" },
                    { "55555555-5555-5555-5555-000000000008", new Guid("55555555-5555-5555-5555-555555555555"), 7, 420.0, 0.0, 0, "A8" },
                    { "55555555-5555-5555-5555-000100000001", new Guid("55555555-5555-5555-5555-555555555555"), 0, 0.0, 60.0, 1, "B1" },
                    { "55555555-5555-5555-5555-000100000002", new Guid("55555555-5555-5555-5555-555555555555"), 1, 60.0, 60.0, 1, "B2" },
                    { "55555555-5555-5555-5555-000100000003", new Guid("55555555-5555-5555-5555-555555555555"), 2, 120.0, 60.0, 1, "B3" },
                    { "55555555-5555-5555-5555-000100000004", new Guid("55555555-5555-5555-5555-555555555555"), 3, 180.0, 60.0, 1, "B4" },
                    { "55555555-5555-5555-5555-000100000005", new Guid("55555555-5555-5555-5555-555555555555"), 4, 240.0, 60.0, 1, "B5" },
                    { "55555555-5555-5555-5555-000100000006", new Guid("55555555-5555-5555-5555-555555555555"), 5, 300.0, 60.0, 1, "B6" },
                    { "55555555-5555-5555-5555-000100000007", new Guid("55555555-5555-5555-5555-555555555555"), 6, 360.0, 60.0, 1, "B7" },
                    { "55555555-5555-5555-5555-000100000008", new Guid("55555555-5555-5555-5555-555555555555"), 7, 420.0, 60.0, 1, "B8" },
                    { "55555555-5555-5555-5555-000200000001", new Guid("55555555-5555-5555-5555-555555555555"), 0, 0.0, 120.0, 2, "C1" },
                    { "55555555-5555-5555-5555-000200000002", new Guid("55555555-5555-5555-5555-555555555555"), 1, 60.0, 120.0, 2, "C2" },
                    { "55555555-5555-5555-5555-000200000003", new Guid("55555555-5555-5555-5555-555555555555"), 2, 120.0, 120.0, 2, "C3" },
                    { "55555555-5555-5555-5555-000200000004", new Guid("55555555-5555-5555-5555-555555555555"), 3, 180.0, 120.0, 2, "C4" },
                    { "55555555-5555-5555-5555-000200000005", new Guid("55555555-5555-5555-5555-555555555555"), 4, 240.0, 120.0, 2, "C5" },
                    { "55555555-5555-5555-5555-000200000006", new Guid("55555555-5555-5555-5555-555555555555"), 5, 300.0, 120.0, 2, "C6" },
                    { "55555555-5555-5555-5555-000200000007", new Guid("55555555-5555-5555-5555-555555555555"), 6, 360.0, 120.0, 2, "C7" },
                    { "55555555-5555-5555-5555-000200000008", new Guid("55555555-5555-5555-5555-555555555555"), 7, 420.0, 120.0, 2, "C8" },
                    { "55555555-5555-5555-5555-000300000001", new Guid("55555555-5555-5555-5555-555555555555"), 0, 0.0, 180.0, 3, "D1" },
                    { "55555555-5555-5555-5555-000300000002", new Guid("55555555-5555-5555-5555-555555555555"), 1, 60.0, 180.0, 3, "D2" },
                    { "55555555-5555-5555-5555-000300000003", new Guid("55555555-5555-5555-5555-555555555555"), 2, 120.0, 180.0, 3, "D3" },
                    { "55555555-5555-5555-5555-000300000004", new Guid("55555555-5555-5555-5555-555555555555"), 3, 180.0, 180.0, 3, "D4" },
                    { "55555555-5555-5555-5555-000300000005", new Guid("55555555-5555-5555-5555-555555555555"), 4, 240.0, 180.0, 3, "D5" },
                    { "55555555-5555-5555-5555-000300000006", new Guid("55555555-5555-5555-5555-555555555555"), 5, 300.0, 180.0, 3, "D6" },
                    { "55555555-5555-5555-5555-000300000007", new Guid("55555555-5555-5555-5555-555555555555"), 6, 360.0, 180.0, 3, "D7" },
                    { "55555555-5555-5555-5555-000300000008", new Guid("55555555-5555-5555-5555-555555555555"), 7, 420.0, 180.0, 3, "D8" }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "MovieScheduleInfoEntity",
                keyColumn: "MovieScheduleInfoId",
                keyValue: new Guid("449df7b2-9a4e-42a6-a441-3cf9ee213856"));

            migrationBuilder.DeleteData(
                table: "MovieScheduleInfoEntity",
                keyColumn: "MovieScheduleInfoId",
                keyValue: new Guid("7c37b7f2-77f3-4033-ad80-77adcb6713d3"));

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "33333333-3333-3333-3333-000000000001");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "33333333-3333-3333-3333-000000000002");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "33333333-3333-3333-3333-000000000003");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "33333333-3333-3333-3333-000000000004");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "33333333-3333-3333-3333-000000000005");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "33333333-3333-3333-3333-000000000006");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "33333333-3333-3333-3333-000000000007");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "33333333-3333-3333-3333-000000000008");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "33333333-3333-3333-3333-000100000001");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "33333333-3333-3333-3333-000100000002");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "33333333-3333-3333-3333-000100000003");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "33333333-3333-3333-3333-000100000004");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "33333333-3333-3333-3333-000100000005");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "33333333-3333-3333-3333-000100000006");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "33333333-3333-3333-3333-000100000007");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "33333333-3333-3333-3333-000100000008");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "33333333-3333-3333-3333-000200000001");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "33333333-3333-3333-3333-000200000002");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "33333333-3333-3333-3333-000200000003");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "33333333-3333-3333-3333-000200000004");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "33333333-3333-3333-3333-000200000005");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "33333333-3333-3333-3333-000200000006");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "33333333-3333-3333-3333-000200000007");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "33333333-3333-3333-3333-000200000008");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "33333333-3333-3333-3333-000300000001");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "33333333-3333-3333-3333-000300000002");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "33333333-3333-3333-3333-000300000003");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "33333333-3333-3333-3333-000300000004");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "33333333-3333-3333-3333-000300000005");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "33333333-3333-3333-3333-000300000006");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "33333333-3333-3333-3333-000300000007");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "33333333-3333-3333-3333-000300000008");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "44444444-4444-4444-4444-000000000001");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "44444444-4444-4444-4444-000000000002");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "44444444-4444-4444-4444-000000000003");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "44444444-4444-4444-4444-000000000004");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "44444444-4444-4444-4444-000000000005");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "44444444-4444-4444-4444-000000000006");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "44444444-4444-4444-4444-000000000007");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "44444444-4444-4444-4444-000000000008");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "44444444-4444-4444-4444-000100000001");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "44444444-4444-4444-4444-000100000002");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "44444444-4444-4444-4444-000100000003");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "44444444-4444-4444-4444-000100000004");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "44444444-4444-4444-4444-000100000005");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "44444444-4444-4444-4444-000100000006");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "44444444-4444-4444-4444-000100000007");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "44444444-4444-4444-4444-000100000008");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "44444444-4444-4444-4444-000200000001");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "44444444-4444-4444-4444-000200000002");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "44444444-4444-4444-4444-000200000003");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "44444444-4444-4444-4444-000200000004");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "44444444-4444-4444-4444-000200000005");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "44444444-4444-4444-4444-000200000006");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "44444444-4444-4444-4444-000200000007");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "44444444-4444-4444-4444-000200000008");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "44444444-4444-4444-4444-000300000001");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "44444444-4444-4444-4444-000300000002");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "44444444-4444-4444-4444-000300000003");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "44444444-4444-4444-4444-000300000004");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "44444444-4444-4444-4444-000300000005");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "44444444-4444-4444-4444-000300000006");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "44444444-4444-4444-4444-000300000007");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "44444444-4444-4444-4444-000300000008");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "55555555-5555-5555-5555-000000000001");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "55555555-5555-5555-5555-000000000002");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "55555555-5555-5555-5555-000000000003");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "55555555-5555-5555-5555-000000000004");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "55555555-5555-5555-5555-000000000005");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "55555555-5555-5555-5555-000000000006");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "55555555-5555-5555-5555-000000000007");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "55555555-5555-5555-5555-000000000008");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "55555555-5555-5555-5555-000100000001");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "55555555-5555-5555-5555-000100000002");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "55555555-5555-5555-5555-000100000003");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "55555555-5555-5555-5555-000100000004");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "55555555-5555-5555-5555-000100000005");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "55555555-5555-5555-5555-000100000006");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "55555555-5555-5555-5555-000100000007");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "55555555-5555-5555-5555-000100000008");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "55555555-5555-5555-5555-000200000001");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "55555555-5555-5555-5555-000200000002");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "55555555-5555-5555-5555-000200000003");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "55555555-5555-5555-5555-000200000004");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "55555555-5555-5555-5555-000200000005");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "55555555-5555-5555-5555-000200000006");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "55555555-5555-5555-5555-000200000007");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "55555555-5555-5555-5555-000200000008");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "55555555-5555-5555-5555-000300000001");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "55555555-5555-5555-5555-000300000002");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "55555555-5555-5555-5555-000300000003");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "55555555-5555-5555-5555-000300000004");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "55555555-5555-5555-5555-000300000005");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "55555555-5555-5555-5555-000300000006");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "55555555-5555-5555-5555-000300000007");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "55555555-5555-5555-5555-000300000008");

            migrationBuilder.UpdateData(
                table: "AuditoriumInfoEntities",
                keyColumn: "AuditoriumId",
                keyValue: new Guid("33333333-3333-3333-3333-333333333333"),
                column: "UpdatedAt",
                value: new DateTime(2026, 3, 18, 0, 55, 19, 482, DateTimeKind.Local).AddTicks(1677));

            migrationBuilder.UpdateData(
                table: "AuditoriumInfoEntities",
                keyColumn: "AuditoriumId",
                keyValue: new Guid("44444444-4444-4444-4444-444444444444"),
                column: "UpdatedAt",
                value: new DateTime(2026, 3, 18, 0, 55, 19, 482, DateTimeKind.Local).AddTicks(1681));

            migrationBuilder.UpdateData(
                table: "AuditoriumInfoEntities",
                keyColumn: "AuditoriumId",
                keyValue: new Guid("55555555-5555-5555-5555-555555555555"),
                column: "UpdatedAt",
                value: new DateTime(2026, 3, 18, 0, 55, 19, 482, DateTimeKind.Local).AddTicks(1683));

            migrationBuilder.UpdateData(
                table: "CinemaInfoEntity",
                keyColumn: "CinemaId",
                keyValue: new Guid("11111111-1111-1111-1111-111111111111"),
                column: "UpdatedAt",
                value: new DateTime(2026, 3, 18, 0, 55, 19, 482, DateTimeKind.Local).AddTicks(1626));

            migrationBuilder.UpdateData(
                table: "CinemaInfoEntity",
                keyColumn: "CinemaId",
                keyValue: new Guid("22222222-2222-2222-2222-222222222222"),
                column: "UpdatedAt",
                value: new DateTime(2026, 3, 18, 0, 55, 19, 482, DateTimeKind.Local).AddTicks(1633));

            migrationBuilder.UpdateData(
                table: "CinemaInfoEntity",
                keyColumn: "CinemaId",
                keyValue: new Guid("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
                column: "UpdatedAt",
                value: new DateTime(2026, 3, 18, 0, 55, 19, 482, DateTimeKind.Local).AddTicks(1636));

            migrationBuilder.UpdateData(
                table: "MovieInfoEntity",
                keyColumn: "MovieId",
                keyValue: new Guid("66666666-6666-6666-6666-666666666666"),
                columns: new[] { "ActiveAt", "EndedDate", "UpdatedAt" },
                values: new object[] { new DateTime(2026, 3, 13, 0, 55, 19, 482, DateTimeKind.Local).AddTicks(1570), new DateTime(2026, 4, 12, 0, 55, 19, 482, DateTimeKind.Local).AddTicks(1570), new DateTime(2026, 3, 18, 0, 55, 19, 482, DateTimeKind.Local).AddTicks(2403) });

            migrationBuilder.UpdateData(
                table: "MovieInfoEntity",
                keyColumn: "MovieId",
                keyValue: new Guid("77777777-7777-7777-7777-777777777777"),
                columns: new[] { "ActiveAt", "EndedDate", "UpdatedAt" },
                values: new object[] { new DateTime(2026, 3, 17, 0, 55, 19, 482, DateTimeKind.Local).AddTicks(1570), new DateTime(2026, 4, 17, 0, 55, 19, 482, DateTimeKind.Local).AddTicks(1570), new DateTime(2026, 3, 18, 0, 55, 19, 482, DateTimeKind.Local).AddTicks(2416) });

            migrationBuilder.UpdateData(
                table: "MovieInfoEntity",
                keyColumn: "MovieId",
                keyValue: new Guid("88888888-8888-8888-8888-888888888888"),
                columns: new[] { "ActiveAt", "EndedDate", "UpdatedAt" },
                values: new object[] { new DateTime(2026, 3, 28, 0, 55, 19, 482, DateTimeKind.Local).AddTicks(1570), new DateTime(2026, 4, 27, 0, 55, 19, 482, DateTimeKind.Local).AddTicks(1570), new DateTime(2026, 3, 18, 0, 55, 19, 482, DateTimeKind.Local).AddTicks(2421) });

            migrationBuilder.InsertData(
                table: "MovieScheduleInfoEntity",
                columns: new[] { "MovieScheduleInfoId", "ActiveAt", "AuditoriumId", "CreatedAt", "CreatedByUserId", "DeletedAt", "DeletedByUserId", "EndedTime", "IsActive", "IsDeleted", "MovieFormatId", "MovieId", "StartTime", "UpdatedAt", "UpdatedByUserId" },
                values: new object[,]
                {
                    { new Guid("24451f1a-e807-4317-93d5-0ed02532ec6d"), new DateTime(2026, 3, 19, 19, 0, 0, 0, DateTimeKind.Local), new Guid("33333333-3333-3333-3333-333333333333"), new DateTime(2026, 3, 18, 0, 55, 19, 482, DateTimeKind.Local).AddTicks(2498), new Guid("7b5d2c1e-9f8a-3e7b-c1d2-a0e9f8c7b6a5"), null, null, new DateTime(2026, 3, 19, 21, 56, 0, 0, DateTimeKind.Local), true, false, new Guid("3fbc4a32-15f5-47e0-b98a-784f1b8a9612"), new Guid("66666666-6666-6666-6666-666666666666"), new DateTime(2026, 3, 19, 19, 0, 0, 0, DateTimeKind.Local), new DateTime(2026, 3, 18, 0, 55, 19, 482, DateTimeKind.Local).AddTicks(2499), null },
                    { new Guid("9ab6a86c-246c-43e6-bde4-214e30205f96"), new DateTime(2026, 3, 19, 20, 0, 0, 0, DateTimeKind.Local), new Guid("44444444-4444-4444-4444-444444444444"), new DateTime(2026, 3, 18, 0, 55, 19, 482, DateTimeKind.Local).AddTicks(2507), new Guid("e4e1f7d8-c3b2-4a90-8c67-2f5a1b3d9e0c"), null, null, new DateTime(2026, 3, 19, 23, 0, 0, 0, DateTimeKind.Local), true, false, new Guid("d29b0f1c-8e2a-4c5b-bc3d-1a2f3e4d5c6b"), new Guid("77777777-7777-7777-7777-777777777777"), new DateTime(2026, 3, 19, 20, 0, 0, 0, DateTimeKind.Local), new DateTime(2026, 3, 18, 0, 55, 19, 482, DateTimeKind.Local).AddTicks(2508), null }
                });

            migrationBuilder.InsertData(
                table: "SeatsInfoEntity",
                columns: new[] { "SeatId", "AuditoriumId", "ColIndex", "CoordX", "CoordY", "RowIndex", "SeatNumber" },
                values: new object[,]
                {
                    { "01fa0a85-a9bf-43c1-8870-41ce702d6c3f", new Guid("55555555-5555-5555-5555-555555555555"), 6, 360.0, 0.0, 0, "A7" },
                    { "05527976-186b-4784-afb2-d2c412d86e0b", new Guid("44444444-4444-4444-4444-444444444444"), 7, 420.0, 180.0, 3, "D8" },
                    { "074602e9-e76c-4c45-a5ff-ff1f743e2f95", new Guid("33333333-3333-3333-3333-333333333333"), 7, 420.0, 0.0, 0, "A8" },
                    { "077a4bef-210c-4d97-ae67-baa00975f1a1", new Guid("55555555-5555-5555-5555-555555555555"), 4, 240.0, 0.0, 0, "A5" },
                    { "0c0c9392-a58a-42bc-bad2-993a03e44a21", new Guid("55555555-5555-5555-5555-555555555555"), 2, 120.0, 0.0, 0, "A3" },
                    { "0c2949d6-1c1a-48a2-91d5-d578cda88ea5", new Guid("44444444-4444-4444-4444-444444444444"), 6, 360.0, 120.0, 2, "C7" },
                    { "0d532393-3485-4515-89c5-102eee8c6c8a", new Guid("44444444-4444-4444-4444-444444444444"), 4, 240.0, 0.0, 0, "A5" },
                    { "11c7f67c-a204-48b9-ab63-8625271ca102", new Guid("55555555-5555-5555-5555-555555555555"), 6, 360.0, 60.0, 1, "B7" },
                    { "14b05914-4ac5-400b-8c11-346033238016", new Guid("33333333-3333-3333-3333-333333333333"), 0, 0.0, 180.0, 3, "D1" },
                    { "173db5de-cbef-40aa-a46f-1d7d3e5344e1", new Guid("33333333-3333-3333-3333-333333333333"), 0, 0.0, 0.0, 0, "A1" },
                    { "18ab32bf-7412-40bb-8146-ad4c1526ac56", new Guid("44444444-4444-4444-4444-444444444444"), 5, 300.0, 0.0, 0, "A6" },
                    { "18deb7b4-8a0d-4336-b4e0-d4b60d3ec5dd", new Guid("33333333-3333-3333-3333-333333333333"), 3, 180.0, 0.0, 0, "A4" },
                    { "19713b74-64ca-406f-beff-8f7bb29e48bd", new Guid("55555555-5555-5555-5555-555555555555"), 3, 180.0, 60.0, 1, "B4" },
                    { "1c5572a6-4295-42bb-93b0-0c0d3e90c100", new Guid("55555555-5555-5555-5555-555555555555"), 5, 300.0, 120.0, 2, "C6" },
                    { "1f501102-4c1c-43f9-a0db-64683f2500f8", new Guid("55555555-5555-5555-5555-555555555555"), 1, 60.0, 60.0, 1, "B2" },
                    { "207524e2-ac1a-45a6-99c5-ce62491c7a63", new Guid("44444444-4444-4444-4444-444444444444"), 5, 300.0, 60.0, 1, "B6" },
                    { "208494da-c6a0-4d70-87f3-5ff8f11189cb", new Guid("44444444-4444-4444-4444-444444444444"), 1, 60.0, 60.0, 1, "B2" },
                    { "22079b78-ee83-45d4-93f2-556b2d6346ca", new Guid("33333333-3333-3333-3333-333333333333"), 5, 300.0, 120.0, 2, "C6" },
                    { "23b941cb-d882-4c19-9d71-a16af5f997e1", new Guid("33333333-3333-3333-3333-333333333333"), 1, 60.0, 180.0, 3, "D2" },
                    { "244168d6-b87c-4c57-913a-649fde3754ea", new Guid("55555555-5555-5555-5555-555555555555"), 7, 420.0, 180.0, 3, "D8" },
                    { "264ed062-62fb-43cc-86f4-8ada5534f852", new Guid("55555555-5555-5555-5555-555555555555"), 2, 120.0, 120.0, 2, "C3" },
                    { "26d253d5-7369-449c-94ff-582ba3e1662a", new Guid("55555555-5555-5555-5555-555555555555"), 6, 360.0, 120.0, 2, "C7" },
                    { "28a5ab82-bbe6-4dde-91d3-9c7f25d7acc4", new Guid("33333333-3333-3333-3333-333333333333"), 0, 0.0, 60.0, 1, "B1" },
                    { "2af27e13-4cc4-4214-b19c-e6b952874641", new Guid("33333333-3333-3333-3333-333333333333"), 0, 0.0, 120.0, 2, "C1" },
                    { "30923d27-2f7a-4478-93ef-be5f40a4647a", new Guid("44444444-4444-4444-4444-444444444444"), 3, 180.0, 120.0, 2, "C4" },
                    { "3785e887-fd2a-4207-af51-23461bcafacf", new Guid("44444444-4444-4444-4444-444444444444"), 1, 60.0, 180.0, 3, "D2" },
                    { "38cdafc5-089b-4aa4-a7e5-a74f496e50ee", new Guid("33333333-3333-3333-3333-333333333333"), 5, 300.0, 0.0, 0, "A6" },
                    { "3c0347e9-0be5-4fcc-adea-8d44fd8567ac", new Guid("55555555-5555-5555-5555-555555555555"), 0, 0.0, 180.0, 3, "D1" },
                    { "3cdc33dd-c989-474b-9cfa-301cbe7d21bc", new Guid("55555555-5555-5555-5555-555555555555"), 3, 180.0, 0.0, 0, "A4" },
                    { "467efeab-70f5-49a6-a8ed-728a36e3915d", new Guid("55555555-5555-5555-5555-555555555555"), 0, 0.0, 0.0, 0, "A1" },
                    { "49d77488-adcd-4f63-a1d1-1e6381db9545", new Guid("44444444-4444-4444-4444-444444444444"), 5, 300.0, 180.0, 3, "D6" },
                    { "4cddaa84-1f3d-48ee-b0f5-175828d05088", new Guid("33333333-3333-3333-3333-333333333333"), 6, 360.0, 120.0, 2, "C7" },
                    { "55f7444d-8f15-481b-8943-3e7bd0b83b5c", new Guid("33333333-3333-3333-3333-333333333333"), 3, 180.0, 60.0, 1, "B4" },
                    { "564d592b-a500-4c2b-a4b9-5cdd18a9cf94", new Guid("55555555-5555-5555-5555-555555555555"), 7, 420.0, 0.0, 0, "A8" },
                    { "575ab31a-1570-4fa0-90a8-bb116bc3f084", new Guid("33333333-3333-3333-3333-333333333333"), 7, 420.0, 180.0, 3, "D8" },
                    { "57e36b1b-6d47-445f-b879-c17b32f39310", new Guid("55555555-5555-5555-5555-555555555555"), 4, 240.0, 120.0, 2, "C5" },
                    { "5c20796f-67a5-4c4a-8ee5-3ff33011d001", new Guid("33333333-3333-3333-3333-333333333333"), 4, 240.0, 180.0, 3, "D5" },
                    { "5cc4a51a-09d7-4fd4-8ed5-ea7c6091ad66", new Guid("44444444-4444-4444-4444-444444444444"), 0, 0.0, 60.0, 1, "B1" },
                    { "5f075e7d-06a5-43c2-9673-81c71ed4667d", new Guid("44444444-4444-4444-4444-444444444444"), 4, 240.0, 120.0, 2, "C5" },
                    { "646c2c16-4a26-4e6c-b442-a6141b00a0b0", new Guid("44444444-4444-4444-4444-444444444444"), 4, 240.0, 180.0, 3, "D5" },
                    { "64a9ede3-944d-49f2-b15a-9921f168b228", new Guid("33333333-3333-3333-3333-333333333333"), 1, 60.0, 0.0, 0, "A2" },
                    { "6583c2ef-2480-496a-b142-833e2ef45036", new Guid("44444444-4444-4444-4444-444444444444"), 1, 60.0, 0.0, 0, "A2" },
                    { "67417068-26a7-480d-b6df-49603db14b55", new Guid("44444444-4444-4444-4444-444444444444"), 0, 0.0, 120.0, 2, "C1" },
                    { "678336a0-041b-4534-b315-b053348864e7", new Guid("44444444-4444-4444-4444-444444444444"), 2, 120.0, 60.0, 1, "B3" },
                    { "6aec3b6a-1297-4b4a-9357-68cc2253371e", new Guid("44444444-4444-4444-4444-444444444444"), 7, 420.0, 60.0, 1, "B8" },
                    { "6c175e3c-4a13-47f3-9b55-62c973774df8", new Guid("44444444-4444-4444-4444-444444444444"), 2, 120.0, 120.0, 2, "C3" },
                    { "6f2402d2-542d-4908-930d-2073f452a00a", new Guid("33333333-3333-3333-3333-333333333333"), 1, 60.0, 60.0, 1, "B2" },
                    { "727b3583-965a-4238-be51-9f5f5f757f18", new Guid("55555555-5555-5555-5555-555555555555"), 1, 60.0, 180.0, 3, "D2" },
                    { "751670d7-46d0-46e4-ac95-17f479c102fe", new Guid("33333333-3333-3333-3333-333333333333"), 4, 240.0, 60.0, 1, "B5" },
                    { "7712a8fb-f6dd-41ed-b6e5-74d6d45ba30f", new Guid("33333333-3333-3333-3333-333333333333"), 6, 360.0, 0.0, 0, "A7" },
                    { "7719c56e-a68f-4a8a-b102-4192e8d5a8a4", new Guid("44444444-4444-4444-4444-444444444444"), 3, 180.0, 0.0, 0, "A4" },
                    { "7e16f6c2-1ebd-4910-8bde-66f941d96423", new Guid("44444444-4444-4444-4444-444444444444"), 2, 120.0, 180.0, 3, "D3" },
                    { "7e6f7ce0-2b11-4ade-8d47-2798384d79c5", new Guid("44444444-4444-4444-4444-444444444444"), 1, 60.0, 120.0, 2, "C2" },
                    { "80bd10f8-f8d4-4f87-8dc9-f48cb54eb5e2", new Guid("44444444-4444-4444-4444-444444444444"), 3, 180.0, 180.0, 3, "D4" },
                    { "82b6b235-c9a0-4904-86f0-2f887a07f729", new Guid("33333333-3333-3333-3333-333333333333"), 7, 420.0, 120.0, 2, "C8" },
                    { "833a2856-24ab-4582-b4da-85c2eeb3418a", new Guid("55555555-5555-5555-5555-555555555555"), 2, 120.0, 180.0, 3, "D3" },
                    { "8561f473-00b9-4fba-98fd-6565a4aca112", new Guid("33333333-3333-3333-3333-333333333333"), 2, 120.0, 120.0, 2, "C3" },
                    { "869bc8ad-7518-47ae-bfc3-13d4eeac2277", new Guid("33333333-3333-3333-3333-333333333333"), 3, 180.0, 180.0, 3, "D4" },
                    { "8a09fc94-2b91-42fc-a478-9af9a911f137", new Guid("33333333-3333-3333-3333-333333333333"), 2, 120.0, 60.0, 1, "B3" },
                    { "92c9a654-17cb-4d6b-ab77-3a359aa2b144", new Guid("33333333-3333-3333-3333-333333333333"), 4, 240.0, 120.0, 2, "C5" },
                    { "973bcde6-849c-4043-88b5-9a471eae1906", new Guid("55555555-5555-5555-5555-555555555555"), 3, 180.0, 180.0, 3, "D4" },
                    { "a386837f-846e-41a5-8f5f-ec598102bd5a", new Guid("55555555-5555-5555-5555-555555555555"), 1, 60.0, 120.0, 2, "C2" },
                    { "a755bbfe-2167-42ad-ac4a-070e4176932f", new Guid("55555555-5555-5555-5555-555555555555"), 2, 120.0, 60.0, 1, "B3" },
                    { "ab671234-12a5-4925-82c5-cb6088e7962a", new Guid("44444444-4444-4444-4444-444444444444"), 4, 240.0, 60.0, 1, "B5" },
                    { "aecbabf4-6d36-4b6c-b4de-9f6f1756f38b", new Guid("33333333-3333-3333-3333-333333333333"), 2, 120.0, 0.0, 0, "A3" },
                    { "af45556e-b6ea-44ba-a58a-8bdd2ae1834a", new Guid("33333333-3333-3333-3333-333333333333"), 6, 360.0, 60.0, 1, "B7" },
                    { "afc43066-44da-4305-bd52-d813a759079f", new Guid("44444444-4444-4444-4444-444444444444"), 5, 300.0, 120.0, 2, "C6" },
                    { "b2e7ec8b-b69b-4d38-8dc7-22acb1cf7c6c", new Guid("33333333-3333-3333-3333-333333333333"), 2, 120.0, 180.0, 3, "D3" },
                    { "b4c01315-6d25-4ad5-8d06-e958e3582b98", new Guid("55555555-5555-5555-5555-555555555555"), 0, 0.0, 60.0, 1, "B1" },
                    { "b72d696f-5aa2-4815-aa8d-3ef1545f014e", new Guid("44444444-4444-4444-4444-444444444444"), 6, 360.0, 180.0, 3, "D7" },
                    { "b8095595-2cec-41b2-99a2-8f1ee9e6a6f8", new Guid("55555555-5555-5555-5555-555555555555"), 6, 360.0, 180.0, 3, "D7" },
                    { "b9f7e9b0-5bef-46f4-a7a0-212bb942f6c9", new Guid("44444444-4444-4444-4444-444444444444"), 6, 360.0, 60.0, 1, "B7" },
                    { "ba77788b-8a5d-4922-8160-eae20b9806a6", new Guid("55555555-5555-5555-5555-555555555555"), 5, 300.0, 180.0, 3, "D6" },
                    { "bfaa0d66-3a0a-4155-bcf1-0f9d4d917bb4", new Guid("33333333-3333-3333-3333-333333333333"), 5, 300.0, 60.0, 1, "B6" },
                    { "c1d6dfd4-51cd-4012-ac01-c9ba8b5508e4", new Guid("33333333-3333-3333-3333-333333333333"), 3, 180.0, 120.0, 2, "C4" },
                    { "c2bfe787-c1b6-475e-8fd1-b06567a43015", new Guid("44444444-4444-4444-4444-444444444444"), 2, 120.0, 0.0, 0, "A3" },
                    { "c50c5e1b-07c0-460a-b813-33910fc4c4b6", new Guid("55555555-5555-5555-5555-555555555555"), 1, 60.0, 0.0, 0, "A2" },
                    { "c719ef7e-85c0-4d6e-bd39-ba696a2be2d1", new Guid("44444444-4444-4444-4444-444444444444"), 3, 180.0, 60.0, 1, "B4" },
                    { "cc14a14b-4827-4d09-ae93-ac61b1897a53", new Guid("55555555-5555-5555-5555-555555555555"), 3, 180.0, 120.0, 2, "C4" },
                    { "cd781ad1-8606-40a9-8147-e574117695a8", new Guid("44444444-4444-4444-4444-444444444444"), 7, 420.0, 0.0, 0, "A8" },
                    { "d2cd885f-9181-4fa8-9901-c194237a59ca", new Guid("55555555-5555-5555-5555-555555555555"), 4, 240.0, 60.0, 1, "B5" },
                    { "d4940178-7c4c-46cb-9e93-fdabc7112539", new Guid("44444444-4444-4444-4444-444444444444"), 0, 0.0, 180.0, 3, "D1" },
                    { "d9d138f7-0f5b-4fcf-926a-6ceb0f62b4a8", new Guid("55555555-5555-5555-5555-555555555555"), 5, 300.0, 0.0, 0, "A6" },
                    { "da16ca3d-01fc-4aeb-858a-8aedebf360b9", new Guid("33333333-3333-3333-3333-333333333333"), 5, 300.0, 180.0, 3, "D6" },
                    { "db150e78-a375-4d0a-ac2c-71baeab7b4a6", new Guid("33333333-3333-3333-3333-333333333333"), 7, 420.0, 60.0, 1, "B8" },
                    { "dcacbe81-cb2e-42b0-9002-930afa1b6734", new Guid("33333333-3333-3333-3333-333333333333"), 4, 240.0, 0.0, 0, "A5" },
                    { "e0e8d2b4-7d7e-40b4-94ae-c91d46e33a19", new Guid("33333333-3333-3333-3333-333333333333"), 6, 360.0, 180.0, 3, "D7" },
                    { "e8a02fb5-966f-470e-9b5c-3e07b3f6be66", new Guid("55555555-5555-5555-5555-555555555555"), 4, 240.0, 180.0, 3, "D5" },
                    { "e8b27282-eeb6-444f-b510-884df6c965f2", new Guid("44444444-4444-4444-4444-444444444444"), 0, 0.0, 0.0, 0, "A1" },
                    { "ed4c1112-b9b0-4a67-8be0-b309a6888fdf", new Guid("55555555-5555-5555-5555-555555555555"), 5, 300.0, 60.0, 1, "B6" },
                    { "f138941a-9a0e-4cbe-84b2-a23a818af851", new Guid("55555555-5555-5555-5555-555555555555"), 7, 420.0, 60.0, 1, "B8" },
                    { "f67f1b3b-23ae-48c6-9b97-f9bb82d6dfc9", new Guid("44444444-4444-4444-4444-444444444444"), 6, 360.0, 0.0, 0, "A7" },
                    { "fcc3d087-c0e5-4e61-ab1f-8a8c5c7e03fe", new Guid("33333333-3333-3333-3333-333333333333"), 1, 60.0, 120.0, 2, "C2" },
                    { "fcf21d8f-c4fa-41bc-92f1-788a5ceda60b", new Guid("55555555-5555-5555-5555-555555555555"), 7, 420.0, 120.0, 2, "C8" },
                    { "fd5bebef-0a58-4487-9779-8be3b8d59696", new Guid("44444444-4444-4444-4444-444444444444"), 7, 420.0, 120.0, 2, "C8" },
                    { "fd673d52-7984-4046-b0de-bb89c46c353c", new Guid("55555555-5555-5555-5555-555555555555"), 0, 0.0, 120.0, 2, "C1" }
                });
        }
    }
}
