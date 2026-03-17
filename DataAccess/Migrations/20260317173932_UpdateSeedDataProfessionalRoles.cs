using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace DataAccess.Migrations
{
    /// <inheritdoc />
    public partial class UpdateSeedDataProfessionalRoles : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Đảm bảo các roles của managers được tái lập (trong trường hợp bị migration trước xóa bỏ bằng Raw SQL)
            migrationBuilder.Sql(@"
                IF NOT EXISTS(SELECT 1 FROM [UserRoleInfoEntity] WHERE UserId = 'e4e1f7d8-c3b2-4a90-8c67-2f5a1b3d9e0c' AND RoleId = '3c0d9e1f-a6b7-c8d9-e0f1-2a3b4c5d6e7f')
                    INSERT INTO [UserRoleInfoEntity] (UserId, RoleId) VALUES ('e4e1f7d8-c3b2-4a90-8c67-2f5a1b3d9e0c', '3c0d9e1f-a6b7-c8d9-e0f1-2a3b4c5d6e7f');
                IF NOT EXISTS(SELECT 1 FROM [UserRoleInfoEntity] WHERE UserId = 'e4e1f7d8-c3b2-4a90-8c67-2f5a1b3d9e0c' AND RoleId = '4d1e0f2a-b7c8-d9e0-f1a2-3b4c5d6e7f8a')
                    INSERT INTO [UserRoleInfoEntity] (UserId, RoleId) VALUES ('e4e1f7d8-c3b2-4a90-8c67-2f5a1b3d9e0c', '4d1e0f2a-b7c8-d9e0-f1a2-3b4c5d6e7f8a');
                IF NOT EXISTS(SELECT 1 FROM [UserRoleInfoEntity] WHERE UserId = 'e4e1f7d8-c3b2-4a90-8c67-2f5a1b3d9e0c' AND RoleId = '5e2f1a3b-c8d9-e0f1-a2b3-4c5d6e7f8a9b')
                    INSERT INTO [UserRoleInfoEntity] (UserId, RoleId) VALUES ('e4e1f7d8-c3b2-4a90-8c67-2f5a1b3d9e0c', '5e2f1a3b-c8d9-e0f1-a2b3-4c5d6e7f8a9b');
                IF NOT EXISTS(SELECT 1 FROM [UserRoleInfoEntity] WHERE UserId = 'e4e1f7d8-c3b2-4a90-8c67-2f5a1b3d9e0c' AND RoleId = '6f3a2b4c-d9e0-f1a2-b3c4-d5e6f7a8b9c0')
                    INSERT INTO [UserRoleInfoEntity] (UserId, RoleId) VALUES ('e4e1f7d8-c3b2-4a90-8c67-2f5a1b3d9e0c', '6f3a2b4c-d9e0-f1a2-b3c4-d5e6f7a8b9c0');

                IF NOT EXISTS(SELECT 1 FROM [UserRoleInfoEntity] WHERE UserId = 'b2c3d4e5-f6a7-8b9c-d0e1-f2a3b4c5d6e7' AND RoleId = '4d1e0f2a-b7c8-d9e0-f1a2-3b4c5d6e7f8a')
                    INSERT INTO [UserRoleInfoEntity] (UserId, RoleId) VALUES ('b2c3d4e5-f6a7-8b9c-d0e1-f2a3b4c5d6e7', '4d1e0f2a-b7c8-d9e0-f1a2-3b4c5d6e7f8a');
                IF NOT EXISTS(SELECT 1 FROM [UserRoleInfoEntity] WHERE UserId = '7b5d2c1e-9f8a-3e7b-c1d2-a0e9f8c7b6a5' AND RoleId = '5e2f1a3b-c8d9-e0f1-a2b3-4c5d6e7f8a9b')
                    INSERT INTO [UserRoleInfoEntity] (UserId, RoleId) VALUES ('7b5d2c1e-9f8a-3e7b-c1d2-a0e9f8c7b6a5', '5e2f1a3b-c8d9-e0f1-a2b3-4c5d6e7f8a9b');
                IF NOT EXISTS(SELECT 1 FROM [UserRoleInfoEntity] WHERE UserId = 'f1a0e9b8-d7c6-5e4f-a3b2-1d0c9b8a7f6e' AND RoleId = '6f3a2b4c-d9e0-f1a2-b3c4-d5e6f7a8b9c0')
                    INSERT INTO [UserRoleInfoEntity] (UserId, RoleId) VALUES ('f1a0e9b8-d7c6-5e4f-a3b2-1d0c9b8a7f6e', '6f3a2b4c-d9e0-f1a2-b3c4-d5e6f7a8b9c0');
            ");

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

            migrationBuilder.UpdateData(
                table: "AuditoriumInfoEntities",
                keyColumn: "AuditoriumId",
                keyValue: new Guid("33333333-3333-3333-3333-333333333333"),
                column: "UpdatedAt",
                value: new DateTime(2026, 3, 18, 0, 39, 31, 93, DateTimeKind.Local).AddTicks(4161));

            migrationBuilder.UpdateData(
                table: "AuditoriumInfoEntities",
                keyColumn: "AuditoriumId",
                keyValue: new Guid("44444444-4444-4444-4444-444444444444"),
                column: "UpdatedAt",
                value: new DateTime(2026, 3, 18, 0, 39, 31, 93, DateTimeKind.Local).AddTicks(4163));

            migrationBuilder.UpdateData(
                table: "AuditoriumInfoEntities",
                keyColumn: "AuditoriumId",
                keyValue: new Guid("55555555-5555-5555-5555-555555555555"),
                column: "UpdatedAt",
                value: new DateTime(2026, 3, 18, 0, 39, 31, 93, DateTimeKind.Local).AddTicks(4166));

            migrationBuilder.UpdateData(
                table: "CinemaInfoEntity",
                keyColumn: "CinemaId",
                keyValue: new Guid("11111111-1111-1111-1111-111111111111"),
                column: "UpdatedAt",
                value: new DateTime(2026, 3, 18, 0, 39, 31, 93, DateTimeKind.Local).AddTicks(4110));

            migrationBuilder.UpdateData(
                table: "CinemaInfoEntity",
                keyColumn: "CinemaId",
                keyValue: new Guid("22222222-2222-2222-2222-222222222222"),
                column: "UpdatedAt",
                value: new DateTime(2026, 3, 18, 0, 39, 31, 93, DateTimeKind.Local).AddTicks(4116));

            migrationBuilder.UpdateData(
                table: "CinemaInfoEntity",
                keyColumn: "CinemaId",
                keyValue: new Guid("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
                column: "UpdatedAt",
                value: new DateTime(2026, 3, 18, 0, 39, 31, 93, DateTimeKind.Local).AddTicks(4120));

            migrationBuilder.UpdateData(
                table: "MovieInfoEntity",
                keyColumn: "MovieId",
                keyValue: new Guid("66666666-6666-6666-6666-666666666666"),
                columns: new[] { "ActiveAt", "EndedDate", "UpdatedAt" },
                values: new object[] { new DateTime(2026, 3, 13, 0, 39, 31, 93, DateTimeKind.Local).AddTicks(4069), new DateTime(2026, 4, 12, 0, 39, 31, 93, DateTimeKind.Local).AddTicks(4069), new DateTime(2026, 3, 18, 0, 39, 31, 93, DateTimeKind.Local).AddTicks(4759) });

            migrationBuilder.UpdateData(
                table: "MovieInfoEntity",
                keyColumn: "MovieId",
                keyValue: new Guid("77777777-7777-7777-7777-777777777777"),
                columns: new[] { "ActiveAt", "EndedDate", "UpdatedAt" },
                values: new object[] { new DateTime(2026, 3, 17, 0, 39, 31, 93, DateTimeKind.Local).AddTicks(4069), new DateTime(2026, 4, 17, 0, 39, 31, 93, DateTimeKind.Local).AddTicks(4069), new DateTime(2026, 3, 18, 0, 39, 31, 93, DateTimeKind.Local).AddTicks(4772) });

            migrationBuilder.UpdateData(
                table: "MovieInfoEntity",
                keyColumn: "MovieId",
                keyValue: new Guid("88888888-8888-8888-8888-888888888888"),
                columns: new[] { "ActiveAt", "EndedDate", "UpdatedAt" },
                values: new object[] { new DateTime(2026, 3, 28, 0, 39, 31, 93, DateTimeKind.Local).AddTicks(4069), new DateTime(2026, 4, 27, 0, 39, 31, 93, DateTimeKind.Local).AddTicks(4069), new DateTime(2026, 3, 18, 0, 39, 31, 93, DateTimeKind.Local).AddTicks(4776) });

            migrationBuilder.InsertData(
                table: "MovieScheduleInfoEntity",
                columns: new[] { "MovieScheduleInfoId", "ActiveAt", "AuditoriumId", "CreatedAt", "CreatedByUserId", "DeletedAt", "DeletedByUserId", "EndedTime", "IsActive", "IsDeleted", "MovieFormatId", "MovieId", "StartTime", "UpdatedAt", "UpdatedByUserId" },
                values: new object[,]
                {
                    { new Guid("336c4be7-4a0d-4ae6-903d-56168a516317"), new DateTime(2026, 3, 19, 19, 0, 0, 0, DateTimeKind.Local), new Guid("33333333-3333-3333-3333-333333333333"), new DateTime(2026, 3, 18, 0, 39, 31, 93, DateTimeKind.Local).AddTicks(4848), new Guid("7b5d2c1e-9f8a-3e7b-c1d2-a0e9f8c7b6a5"), null, null, new DateTime(2026, 3, 19, 21, 56, 0, 0, DateTimeKind.Local), true, false, new Guid("3fbc4a32-15f5-47e0-b98a-784f1b8a9612"), new Guid("66666666-6666-6666-6666-666666666666"), new DateTime(2026, 3, 19, 19, 0, 0, 0, DateTimeKind.Local), new DateTime(2026, 3, 18, 0, 39, 31, 93, DateTimeKind.Local).AddTicks(4849), null },
                    { new Guid("f60d3200-bed6-43b2-800f-653dfc0931da"), new DateTime(2026, 3, 19, 20, 0, 0, 0, DateTimeKind.Local), new Guid("44444444-4444-4444-4444-444444444444"), new DateTime(2026, 3, 18, 0, 39, 31, 93, DateTimeKind.Local).AddTicks(4886), new Guid("e4e1f7d8-c3b2-4a90-8c67-2f5a1b3d9e0c"), null, null, new DateTime(2026, 3, 19, 23, 0, 0, 0, DateTimeKind.Local), true, false, new Guid("d29b0f1c-8e2a-4c5b-bc3d-1a2f3e4d5c6b"), new Guid("77777777-7777-7777-7777-777777777777"), new DateTime(2026, 3, 19, 20, 0, 0, 0, DateTimeKind.Local), new DateTime(2026, 3, 18, 0, 39, 31, 93, DateTimeKind.Local).AddTicks(4887), null }
                });

            migrationBuilder.InsertData(
                table: "SeatsInfoEntity",
                columns: new[] { "SeatId", "AuditoriumId", "ColIndex", "CoordX", "CoordY", "RowIndex", "SeatNumber" },
                values: new object[,]
                {
                    { "000cb7ed-d570-40c4-b8ba-2979d52149ff", new Guid("55555555-5555-5555-5555-555555555555"), 2, 120.0, 0.0, 0, "A3" },
                    { "05e96861-17fa-47a7-8303-c2575c25a52a", new Guid("33333333-3333-3333-3333-333333333333"), 4, 240.0, 0.0, 0, "A5" },
                    { "06f5fb5f-f44a-40de-80b8-ff16e5d34220", new Guid("44444444-4444-4444-4444-444444444444"), 4, 240.0, 60.0, 1, "B5" },
                    { "0753a1cd-9023-4a96-be2a-114b5584a884", new Guid("55555555-5555-5555-5555-555555555555"), 3, 180.0, 120.0, 2, "C4" },
                    { "1009655e-70e6-4b8e-86ca-3a822849d10f", new Guid("33333333-3333-3333-3333-333333333333"), 5, 300.0, 0.0, 0, "A6" },
                    { "104680c4-246f-43ed-b91d-9a6629c8e693", new Guid("33333333-3333-3333-3333-333333333333"), 1, 60.0, 180.0, 3, "D2" },
                    { "148e1898-927b-498c-b2a7-0b1a55de52cb", new Guid("44444444-4444-4444-4444-444444444444"), 3, 180.0, 180.0, 3, "D4" },
                    { "16054fc4-9038-4688-b663-8522a056330f", new Guid("33333333-3333-3333-3333-333333333333"), 3, 180.0, 120.0, 2, "C4" },
                    { "1607cfdf-600e-4487-b333-522e2f1c56fc", new Guid("44444444-4444-4444-4444-444444444444"), 5, 300.0, 180.0, 3, "D6" },
                    { "174d105a-6e27-4cb4-82cb-58c0fbd3b047", new Guid("33333333-3333-3333-3333-333333333333"), 1, 60.0, 0.0, 0, "A2" },
                    { "1ca8b40a-a4f1-40f9-b5eb-f742ba069221", new Guid("55555555-5555-5555-5555-555555555555"), 4, 240.0, 0.0, 0, "A5" },
                    { "1ce0fdec-fa44-4fad-bec4-fa58a780c5e5", new Guid("44444444-4444-4444-4444-444444444444"), 6, 360.0, 0.0, 0, "A7" },
                    { "1dd50d90-1848-4228-9f80-698564d4748c", new Guid("33333333-3333-3333-3333-333333333333"), 7, 420.0, 120.0, 2, "C8" },
                    { "2357e7b1-c34b-4ce4-86e7-38a717f71868", new Guid("55555555-5555-5555-5555-555555555555"), 7, 420.0, 0.0, 0, "A8" },
                    { "243c8a13-dfd3-45e2-b6dd-dd605384a392", new Guid("44444444-4444-4444-4444-444444444444"), 7, 420.0, 60.0, 1, "B8" },
                    { "24cf3114-0322-4e89-bb35-f7b4fda70171", new Guid("44444444-4444-4444-4444-444444444444"), 0, 0.0, 60.0, 1, "B1" },
                    { "28ee4f97-ac51-462a-bf85-efd9a0def3c8", new Guid("44444444-4444-4444-4444-444444444444"), 6, 360.0, 120.0, 2, "C7" },
                    { "29c45cb9-9ff5-4517-a7ef-bc1903d492b1", new Guid("55555555-5555-5555-5555-555555555555"), 4, 240.0, 60.0, 1, "B5" },
                    { "2f6c5f31-d1c3-40f5-be66-0b5d7f6aa91d", new Guid("33333333-3333-3333-3333-333333333333"), 2, 120.0, 60.0, 1, "B3" },
                    { "2fe24aca-ca2b-44d2-b0fa-647ef379948a", new Guid("55555555-5555-5555-5555-555555555555"), 5, 300.0, 120.0, 2, "C6" },
                    { "31dbbaec-f222-4b09-a429-1a5d0f1a2b8e", new Guid("33333333-3333-3333-3333-333333333333"), 6, 360.0, 180.0, 3, "D7" },
                    { "3337c52e-d1e9-49bf-a0d3-c37bda30d986", new Guid("55555555-5555-5555-5555-555555555555"), 6, 360.0, 180.0, 3, "D7" },
                    { "341d4072-8b7a-461a-a58a-a923f827962e", new Guid("44444444-4444-4444-4444-444444444444"), 0, 0.0, 120.0, 2, "C1" },
                    { "38271452-2b4f-42c4-a3c8-a0096a473d93", new Guid("44444444-4444-4444-4444-444444444444"), 1, 60.0, 120.0, 2, "C2" },
                    { "3a9964d7-830d-474f-8f3b-440896394ea3", new Guid("55555555-5555-5555-5555-555555555555"), 0, 0.0, 0.0, 0, "A1" },
                    { "3ebbe0ba-f631-434c-be3a-34c6c36b69d7", new Guid("33333333-3333-3333-3333-333333333333"), 7, 420.0, 60.0, 1, "B8" },
                    { "4112f6ec-906f-49fc-8598-2cfa3bc3fecf", new Guid("33333333-3333-3333-3333-333333333333"), 1, 60.0, 60.0, 1, "B2" },
                    { "42fb7313-c7dd-4bc9-99cc-fd3c9c7ee6c6", new Guid("55555555-5555-5555-5555-555555555555"), 3, 180.0, 0.0, 0, "A4" },
                    { "458fb9e2-729a-40f7-9e8d-1df4d53b6dc9", new Guid("55555555-5555-5555-5555-555555555555"), 5, 300.0, 180.0, 3, "D6" },
                    { "545ea01e-aaa9-4005-a9ca-448cb3f006a4", new Guid("33333333-3333-3333-3333-333333333333"), 4, 240.0, 60.0, 1, "B5" },
                    { "558d2adb-d93b-4498-809f-a62294e7fd32", new Guid("44444444-4444-4444-4444-444444444444"), 3, 180.0, 120.0, 2, "C4" },
                    { "56a9798a-760c-4a80-adfc-2ed2d7451922", new Guid("33333333-3333-3333-3333-333333333333"), 1, 60.0, 120.0, 2, "C2" },
                    { "574c23bd-bd17-4c90-8227-d22fb205a16c", new Guid("33333333-3333-3333-3333-333333333333"), 0, 0.0, 60.0, 1, "B1" },
                    { "57573cd4-ba8e-4802-90ef-6ea7268d2b15", new Guid("33333333-3333-3333-3333-333333333333"), 4, 240.0, 120.0, 2, "C5" },
                    { "5a7b78ee-cf29-4b20-a7aa-e93d49ae12ec", new Guid("44444444-4444-4444-4444-444444444444"), 3, 180.0, 0.0, 0, "A4" },
                    { "5f595ac6-dab1-4a48-90f6-8f66d532c427", new Guid("33333333-3333-3333-3333-333333333333"), 0, 0.0, 0.0, 0, "A1" },
                    { "643cf942-a96d-47c5-94b7-3306f66cddf7", new Guid("55555555-5555-5555-5555-555555555555"), 3, 180.0, 60.0, 1, "B4" },
                    { "676857f6-e3f5-44ac-9077-acfb37a86d8d", new Guid("55555555-5555-5555-5555-555555555555"), 6, 360.0, 60.0, 1, "B7" },
                    { "6be269cd-4e39-4d7f-95b5-0d2a6d431f0c", new Guid("44444444-4444-4444-4444-444444444444"), 1, 60.0, 180.0, 3, "D2" },
                    { "6def5a8e-65e0-441f-90d4-28699754d5a3", new Guid("55555555-5555-5555-5555-555555555555"), 7, 420.0, 120.0, 2, "C8" },
                    { "716e1999-5e8c-458e-a59b-9216264e540e", new Guid("55555555-5555-5555-5555-555555555555"), 4, 240.0, 120.0, 2, "C5" },
                    { "751fc26c-3b78-4fff-9a58-dccea394840c", new Guid("44444444-4444-4444-4444-444444444444"), 4, 240.0, 180.0, 3, "D5" },
                    { "78028626-a910-4c14-a5f3-de0af00c3fa1", new Guid("44444444-4444-4444-4444-444444444444"), 3, 180.0, 60.0, 1, "B4" },
                    { "7abd8089-32c8-4ebf-a4a2-ef273a5201ca", new Guid("44444444-4444-4444-4444-444444444444"), 5, 300.0, 120.0, 2, "C6" },
                    { "7befd192-8c5a-4a74-bc82-3c3b8a2e99be", new Guid("33333333-3333-3333-3333-333333333333"), 6, 360.0, 120.0, 2, "C7" },
                    { "7faa97f0-a3dc-41ba-bc32-8b265514af68", new Guid("55555555-5555-5555-5555-555555555555"), 2, 120.0, 180.0, 3, "D3" },
                    { "811ed5c6-4b54-4bf7-98f5-0370af564de9", new Guid("44444444-4444-4444-4444-444444444444"), 7, 420.0, 120.0, 2, "C8" },
                    { "82be664f-93e1-4c5c-b497-d18d54acf7ff", new Guid("55555555-5555-5555-5555-555555555555"), 1, 60.0, 0.0, 0, "A2" },
                    { "82dd9b13-ace1-49be-9376-ca4882388d3d", new Guid("44444444-4444-4444-4444-444444444444"), 1, 60.0, 0.0, 0, "A2" },
                    { "842d7ea3-0aad-4d4e-8c35-fadfdb97cf5a", new Guid("55555555-5555-5555-5555-555555555555"), 2, 120.0, 120.0, 2, "C3" },
                    { "850961fe-7de1-4a35-bcdc-582cb6169196", new Guid("44444444-4444-4444-4444-444444444444"), 1, 60.0, 60.0, 1, "B2" },
                    { "869178ad-d1fd-4920-a5b4-c0d359fd257c", new Guid("44444444-4444-4444-4444-444444444444"), 2, 120.0, 0.0, 0, "A3" },
                    { "8817b8c9-f92d-4860-8bcd-713451c83914", new Guid("44444444-4444-4444-4444-444444444444"), 0, 0.0, 180.0, 3, "D1" },
                    { "88e50d20-ee12-4d2c-baad-2e418850b46e", new Guid("33333333-3333-3333-3333-333333333333"), 3, 180.0, 180.0, 3, "D4" },
                    { "89db304d-45b8-4744-b5e4-451863a52f79", new Guid("33333333-3333-3333-3333-333333333333"), 7, 420.0, 0.0, 0, "A8" },
                    { "8ba5da52-861d-49c5-bb1e-7ab1efb5c795", new Guid("55555555-5555-5555-5555-555555555555"), 1, 60.0, 60.0, 1, "B2" },
                    { "92d02c21-52ff-4af7-adc2-62b91f361f73", new Guid("33333333-3333-3333-3333-333333333333"), 5, 300.0, 180.0, 3, "D6" },
                    { "994e3a36-3590-4e57-9c43-16e9a97a9c9b", new Guid("33333333-3333-3333-3333-333333333333"), 3, 180.0, 0.0, 0, "A4" },
                    { "99cf66b6-decf-4e5c-bcbb-1ab733a235aa", new Guid("55555555-5555-5555-5555-555555555555"), 6, 360.0, 0.0, 0, "A7" },
                    { "99f332b4-f77e-489c-8818-636c70a84155", new Guid("44444444-4444-4444-4444-444444444444"), 5, 300.0, 60.0, 1, "B6" },
                    { "9a759f46-d01b-4f68-a946-e6a5c54ee2c7", new Guid("55555555-5555-5555-5555-555555555555"), 0, 0.0, 120.0, 2, "C1" },
                    { "9c6d68ef-8602-48b1-bdae-d158882fda83", new Guid("44444444-4444-4444-4444-444444444444"), 7, 420.0, 180.0, 3, "D8" },
                    { "9ca981bf-6794-44da-befb-18b72b9e7569", new Guid("33333333-3333-3333-3333-333333333333"), 6, 360.0, 60.0, 1, "B7" },
                    { "a0fc0189-b59d-403d-bee7-25a9d01b8648", new Guid("44444444-4444-4444-4444-444444444444"), 5, 300.0, 0.0, 0, "A6" },
                    { "a4c25bd7-1bff-462d-a8e1-482c975912f3", new Guid("55555555-5555-5555-5555-555555555555"), 1, 60.0, 180.0, 3, "D2" },
                    { "a5b32f46-ad65-4362-8d54-081b6a955cb4", new Guid("55555555-5555-5555-5555-555555555555"), 0, 0.0, 180.0, 3, "D1" },
                    { "ad9cc802-d258-410c-a6ea-9db2895c10c3", new Guid("55555555-5555-5555-5555-555555555555"), 5, 300.0, 60.0, 1, "B6" },
                    { "b321dd97-b037-4ead-aa5d-793d4a1a3b6b", new Guid("44444444-4444-4444-4444-444444444444"), 2, 120.0, 60.0, 1, "B3" },
                    { "b595bfdc-9faf-4bb0-956b-556338879940", new Guid("44444444-4444-4444-4444-444444444444"), 0, 0.0, 0.0, 0, "A1" },
                    { "b6dd68ef-22f5-4385-9551-431357d4e2f8", new Guid("55555555-5555-5555-5555-555555555555"), 4, 240.0, 180.0, 3, "D5" },
                    { "bfcf2d8d-8fae-431d-b47b-45f646a0e7cf", new Guid("55555555-5555-5555-5555-555555555555"), 3, 180.0, 180.0, 3, "D4" },
                    { "c071cb39-884f-477c-9817-11bdb5c6d801", new Guid("33333333-3333-3333-3333-333333333333"), 6, 360.0, 0.0, 0, "A7" },
                    { "c42b4fdf-3f4b-4292-b2b5-b24b54602133", new Guid("55555555-5555-5555-5555-555555555555"), 0, 0.0, 60.0, 1, "B1" },
                    { "c780298e-bce2-44b3-b3e2-b4c0c48d1b36", new Guid("33333333-3333-3333-3333-333333333333"), 0, 0.0, 180.0, 3, "D1" },
                    { "ccc5270a-a07d-4f84-a5f9-4389da5af6ec", new Guid("33333333-3333-3333-3333-333333333333"), 3, 180.0, 60.0, 1, "B4" },
                    { "cd0e5adb-2410-4eaa-ad27-e0f02757f502", new Guid("44444444-4444-4444-4444-444444444444"), 7, 420.0, 0.0, 0, "A8" },
                    { "cddc8b94-55e3-4d53-a787-aa1f6bd78146", new Guid("44444444-4444-4444-4444-444444444444"), 6, 360.0, 180.0, 3, "D7" },
                    { "cfaeca1a-3885-47b9-859a-b192e2d4d491", new Guid("33333333-3333-3333-3333-333333333333"), 2, 120.0, 180.0, 3, "D3" },
                    { "d268294e-eceb-4297-ab9c-bc6f56488b2c", new Guid("33333333-3333-3333-3333-333333333333"), 5, 300.0, 60.0, 1, "B6" },
                    { "d8e36cba-4118-4c8e-bcc6-6154ddaa56e7", new Guid("33333333-3333-3333-3333-333333333333"), 2, 120.0, 120.0, 2, "C3" },
                    { "db63dd53-9f90-4619-a53a-1c15fdc93443", new Guid("55555555-5555-5555-5555-555555555555"), 7, 420.0, 180.0, 3, "D8" },
                    { "dbdb721a-643c-4929-a51c-b172aceae54c", new Guid("33333333-3333-3333-3333-333333333333"), 4, 240.0, 180.0, 3, "D5" },
                    { "e180a41f-c78c-48fd-b8ff-10c18ae6e52b", new Guid("44444444-4444-4444-4444-444444444444"), 4, 240.0, 0.0, 0, "A5" },
                    { "e31f1093-010b-40a3-a688-a7f54e1cd0b5", new Guid("44444444-4444-4444-4444-444444444444"), 4, 240.0, 120.0, 2, "C5" },
                    { "e8e05d71-85de-443f-9a19-7a41651df802", new Guid("55555555-5555-5555-5555-555555555555"), 6, 360.0, 120.0, 2, "C7" },
                    { "eb7a4029-6aae-4faf-9681-893217ee2ab8", new Guid("33333333-3333-3333-3333-333333333333"), 5, 300.0, 120.0, 2, "C6" },
                    { "ed885e2b-808a-424e-950d-1c5affbbcb0a", new Guid("33333333-3333-3333-3333-333333333333"), 7, 420.0, 180.0, 3, "D8" },
                    { "ede1b2ed-d747-4491-8b50-ce23d515bb8a", new Guid("44444444-4444-4444-4444-444444444444"), 2, 120.0, 120.0, 2, "C3" },
                    { "ef702ef2-6cc3-4f63-a634-6faa0f055708", new Guid("55555555-5555-5555-5555-555555555555"), 7, 420.0, 60.0, 1, "B8" },
                    { "f109ab0c-5613-4b86-9458-be28328b8995", new Guid("33333333-3333-3333-3333-333333333333"), 0, 0.0, 120.0, 2, "C1" },
                    { "f11b312f-f54f-4f43-bb36-1a7cd9141e67", new Guid("44444444-4444-4444-4444-444444444444"), 2, 120.0, 180.0, 3, "D3" },
                    { "f230d943-12d5-4d65-898c-55b9124fa00e", new Guid("33333333-3333-3333-3333-333333333333"), 2, 120.0, 0.0, 0, "A3" },
                    { "f4c6f132-7e32-4a1b-99cd-8e431e83f01d", new Guid("55555555-5555-5555-5555-555555555555"), 2, 120.0, 60.0, 1, "B3" },
                    { "f5842f28-1912-45df-9fa7-e6db7aab32ea", new Guid("55555555-5555-5555-5555-555555555555"), 1, 60.0, 120.0, 2, "C2" },
                    { "f970bc6f-f3c1-4601-ae2d-f2a8b06179bf", new Guid("44444444-4444-4444-4444-444444444444"), 6, 360.0, 60.0, 1, "B7" },
                    { "fa7b1e68-bdd2-405b-93b9-b509d46a9e92", new Guid("55555555-5555-5555-5555-555555555555"), 5, 300.0, 0.0, 0, "A6" }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "MovieScheduleInfoEntity",
                keyColumn: "MovieScheduleInfoId",
                keyValue: new Guid("336c4be7-4a0d-4ae6-903d-56168a516317"));

            migrationBuilder.DeleteData(
                table: "MovieScheduleInfoEntity",
                keyColumn: "MovieScheduleInfoId",
                keyValue: new Guid("f60d3200-bed6-43b2-800f-653dfc0931da"));

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "000cb7ed-d570-40c4-b8ba-2979d52149ff");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "05e96861-17fa-47a7-8303-c2575c25a52a");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "06f5fb5f-f44a-40de-80b8-ff16e5d34220");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "0753a1cd-9023-4a96-be2a-114b5584a884");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "1009655e-70e6-4b8e-86ca-3a822849d10f");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "104680c4-246f-43ed-b91d-9a6629c8e693");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "148e1898-927b-498c-b2a7-0b1a55de52cb");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "16054fc4-9038-4688-b663-8522a056330f");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "1607cfdf-600e-4487-b333-522e2f1c56fc");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "174d105a-6e27-4cb4-82cb-58c0fbd3b047");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "1ca8b40a-a4f1-40f9-b5eb-f742ba069221");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "1ce0fdec-fa44-4fad-bec4-fa58a780c5e5");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "1dd50d90-1848-4228-9f80-698564d4748c");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "2357e7b1-c34b-4ce4-86e7-38a717f71868");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "243c8a13-dfd3-45e2-b6dd-dd605384a392");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "24cf3114-0322-4e89-bb35-f7b4fda70171");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "28ee4f97-ac51-462a-bf85-efd9a0def3c8");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "29c45cb9-9ff5-4517-a7ef-bc1903d492b1");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "2f6c5f31-d1c3-40f5-be66-0b5d7f6aa91d");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "2fe24aca-ca2b-44d2-b0fa-647ef379948a");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "31dbbaec-f222-4b09-a429-1a5d0f1a2b8e");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "3337c52e-d1e9-49bf-a0d3-c37bda30d986");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "341d4072-8b7a-461a-a58a-a923f827962e");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "38271452-2b4f-42c4-a3c8-a0096a473d93");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "3a9964d7-830d-474f-8f3b-440896394ea3");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "3ebbe0ba-f631-434c-be3a-34c6c36b69d7");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "4112f6ec-906f-49fc-8598-2cfa3bc3fecf");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "42fb7313-c7dd-4bc9-99cc-fd3c9c7ee6c6");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "458fb9e2-729a-40f7-9e8d-1df4d53b6dc9");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "545ea01e-aaa9-4005-a9ca-448cb3f006a4");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "558d2adb-d93b-4498-809f-a62294e7fd32");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "56a9798a-760c-4a80-adfc-2ed2d7451922");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "574c23bd-bd17-4c90-8227-d22fb205a16c");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "57573cd4-ba8e-4802-90ef-6ea7268d2b15");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "5a7b78ee-cf29-4b20-a7aa-e93d49ae12ec");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "5f595ac6-dab1-4a48-90f6-8f66d532c427");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "643cf942-a96d-47c5-94b7-3306f66cddf7");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "676857f6-e3f5-44ac-9077-acfb37a86d8d");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "6be269cd-4e39-4d7f-95b5-0d2a6d431f0c");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "6def5a8e-65e0-441f-90d4-28699754d5a3");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "716e1999-5e8c-458e-a59b-9216264e540e");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "751fc26c-3b78-4fff-9a58-dccea394840c");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "78028626-a910-4c14-a5f3-de0af00c3fa1");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "7abd8089-32c8-4ebf-a4a2-ef273a5201ca");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "7befd192-8c5a-4a74-bc82-3c3b8a2e99be");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "7faa97f0-a3dc-41ba-bc32-8b265514af68");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "811ed5c6-4b54-4bf7-98f5-0370af564de9");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "82be664f-93e1-4c5c-b497-d18d54acf7ff");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "82dd9b13-ace1-49be-9376-ca4882388d3d");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "842d7ea3-0aad-4d4e-8c35-fadfdb97cf5a");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "850961fe-7de1-4a35-bcdc-582cb6169196");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "869178ad-d1fd-4920-a5b4-c0d359fd257c");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "8817b8c9-f92d-4860-8bcd-713451c83914");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "88e50d20-ee12-4d2c-baad-2e418850b46e");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "89db304d-45b8-4744-b5e4-451863a52f79");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "8ba5da52-861d-49c5-bb1e-7ab1efb5c795");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "92d02c21-52ff-4af7-adc2-62b91f361f73");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "994e3a36-3590-4e57-9c43-16e9a97a9c9b");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "99cf66b6-decf-4e5c-bcbb-1ab733a235aa");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "99f332b4-f77e-489c-8818-636c70a84155");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "9a759f46-d01b-4f68-a946-e6a5c54ee2c7");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "9c6d68ef-8602-48b1-bdae-d158882fda83");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "9ca981bf-6794-44da-befb-18b72b9e7569");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "a0fc0189-b59d-403d-bee7-25a9d01b8648");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "a4c25bd7-1bff-462d-a8e1-482c975912f3");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "a5b32f46-ad65-4362-8d54-081b6a955cb4");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "ad9cc802-d258-410c-a6ea-9db2895c10c3");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "b321dd97-b037-4ead-aa5d-793d4a1a3b6b");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "b595bfdc-9faf-4bb0-956b-556338879940");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "b6dd68ef-22f5-4385-9551-431357d4e2f8");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "bfcf2d8d-8fae-431d-b47b-45f646a0e7cf");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "c071cb39-884f-477c-9817-11bdb5c6d801");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "c42b4fdf-3f4b-4292-b2b5-b24b54602133");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "c780298e-bce2-44b3-b3e2-b4c0c48d1b36");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "ccc5270a-a07d-4f84-a5f9-4389da5af6ec");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "cd0e5adb-2410-4eaa-ad27-e0f02757f502");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "cddc8b94-55e3-4d53-a787-aa1f6bd78146");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "cfaeca1a-3885-47b9-859a-b192e2d4d491");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "d268294e-eceb-4297-ab9c-bc6f56488b2c");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "d8e36cba-4118-4c8e-bcc6-6154ddaa56e7");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "db63dd53-9f90-4619-a53a-1c15fdc93443");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "dbdb721a-643c-4929-a51c-b172aceae54c");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "e180a41f-c78c-48fd-b8ff-10c18ae6e52b");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "e31f1093-010b-40a3-a688-a7f54e1cd0b5");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "e8e05d71-85de-443f-9a19-7a41651df802");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "eb7a4029-6aae-4faf-9681-893217ee2ab8");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "ed885e2b-808a-424e-950d-1c5affbbcb0a");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "ede1b2ed-d747-4491-8b50-ce23d515bb8a");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "ef702ef2-6cc3-4f63-a634-6faa0f055708");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "f109ab0c-5613-4b86-9458-be28328b8995");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "f11b312f-f54f-4f43-bb36-1a7cd9141e67");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "f230d943-12d5-4d65-898c-55b9124fa00e");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "f4c6f132-7e32-4a1b-99cd-8e431e83f01d");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "f5842f28-1912-45df-9fa7-e6db7aab32ea");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "f970bc6f-f3c1-4601-ae2d-f2a8b06179bf");

            migrationBuilder.DeleteData(
                table: "SeatsInfoEntity",
                keyColumn: "SeatId",
                keyValue: "fa7b1e68-bdd2-405b-93b9-b509d46a9e92");

            migrationBuilder.UpdateData(
                table: "AuditoriumInfoEntities",
                keyColumn: "AuditoriumId",
                keyValue: new Guid("33333333-3333-3333-3333-333333333333"),
                column: "UpdatedAt",
                value: new DateTime(2026, 3, 18, 0, 18, 3, 396, DateTimeKind.Local).AddTicks(6480));

            migrationBuilder.UpdateData(
                table: "AuditoriumInfoEntities",
                keyColumn: "AuditoriumId",
                keyValue: new Guid("44444444-4444-4444-4444-444444444444"),
                column: "UpdatedAt",
                value: new DateTime(2026, 3, 18, 0, 18, 3, 396, DateTimeKind.Local).AddTicks(6483));

            migrationBuilder.UpdateData(
                table: "AuditoriumInfoEntities",
                keyColumn: "AuditoriumId",
                keyValue: new Guid("55555555-5555-5555-5555-555555555555"),
                column: "UpdatedAt",
                value: new DateTime(2026, 3, 18, 0, 18, 3, 396, DateTimeKind.Local).AddTicks(6485));

            migrationBuilder.UpdateData(
                table: "CinemaInfoEntity",
                keyColumn: "CinemaId",
                keyValue: new Guid("11111111-1111-1111-1111-111111111111"),
                column: "UpdatedAt",
                value: new DateTime(2026, 3, 18, 0, 18, 3, 396, DateTimeKind.Local).AddTicks(6431));

            migrationBuilder.UpdateData(
                table: "CinemaInfoEntity",
                keyColumn: "CinemaId",
                keyValue: new Guid("22222222-2222-2222-2222-222222222222"),
                column: "UpdatedAt",
                value: new DateTime(2026, 3, 18, 0, 18, 3, 396, DateTimeKind.Local).AddTicks(6436));

            migrationBuilder.UpdateData(
                table: "CinemaInfoEntity",
                keyColumn: "CinemaId",
                keyValue: new Guid("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
                column: "UpdatedAt",
                value: new DateTime(2026, 3, 18, 0, 18, 3, 396, DateTimeKind.Local).AddTicks(6439));

            migrationBuilder.UpdateData(
                table: "MovieInfoEntity",
                keyColumn: "MovieId",
                keyValue: new Guid("66666666-6666-6666-6666-666666666666"),
                columns: new[] { "ActiveAt", "EndedDate", "UpdatedAt" },
                values: new object[] { new DateTime(2026, 3, 13, 0, 18, 3, 396, DateTimeKind.Local).AddTicks(6390), new DateTime(2026, 4, 12, 0, 18, 3, 396, DateTimeKind.Local).AddTicks(6390), new DateTime(2026, 3, 18, 0, 18, 3, 396, DateTimeKind.Local).AddTicks(7055) });

            migrationBuilder.UpdateData(
                table: "MovieInfoEntity",
                keyColumn: "MovieId",
                keyValue: new Guid("77777777-7777-7777-7777-777777777777"),
                columns: new[] { "ActiveAt", "EndedDate", "UpdatedAt" },
                values: new object[] { new DateTime(2026, 3, 17, 0, 18, 3, 396, DateTimeKind.Local).AddTicks(6390), new DateTime(2026, 4, 17, 0, 18, 3, 396, DateTimeKind.Local).AddTicks(6390), new DateTime(2026, 3, 18, 0, 18, 3, 396, DateTimeKind.Local).AddTicks(7067) });

            migrationBuilder.UpdateData(
                table: "MovieInfoEntity",
                keyColumn: "MovieId",
                keyValue: new Guid("88888888-8888-8888-8888-888888888888"),
                columns: new[] { "ActiveAt", "EndedDate", "UpdatedAt" },
                values: new object[] { new DateTime(2026, 3, 28, 0, 18, 3, 396, DateTimeKind.Local).AddTicks(6390), new DateTime(2026, 4, 27, 0, 18, 3, 396, DateTimeKind.Local).AddTicks(6390), new DateTime(2026, 3, 18, 0, 18, 3, 396, DateTimeKind.Local).AddTicks(7071) });

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
        }
    }
}
