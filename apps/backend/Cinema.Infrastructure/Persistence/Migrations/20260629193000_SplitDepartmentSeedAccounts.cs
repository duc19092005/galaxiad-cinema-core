using System;
using Cinema.Infrastructure;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Cinema.Infrastructure.Persistence.Migrations
{
    [DbContext(typeof(CinemaDbContext))]
    [Migration("20260629193000_SplitDepartmentSeedAccounts")]
    public partial class SplitDepartmentSeedAccounts : Migration
    {
        private static readonly Guid CashierRoleId = new("1a8f7b9c-d4e5-4f6a-b7c8-9d0e1f2a3b4c");

        private static readonly Guid GalaxyCinemaId = new("11111111-1111-1111-1111-111111111111");
        private static readonly Guid LotteCinemaId = new("22222222-2222-2222-2222-222222222222");
        private static readonly Guid BhdCinemaId = new("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");

        private static readonly Guid GalaxyTicketDepartmentId = new("d1111111-1111-1111-1111-111111111111");
        private static readonly Guid GalaxyFoodDepartmentId = new("d1111111-1111-1111-1111-222222222222");
        private static readonly Guid LotteTicketDepartmentId = new("d2222222-2222-2222-2222-111111111111");
        private static readonly Guid LotteFoodDepartmentId = new("d2222222-2222-2222-2222-222222222222");
        private static readonly Guid BhdTicketDepartmentId = new("dbbbbbbb-bbbb-bbbb-bbbb-111111111111");
        private static readonly Guid BhdFoodDepartmentId = new("dbbbbbbb-bbbb-bbbb-bbbb-222222222222");

        private static readonly Guid GalaxyTicketUserId = new("f9c3b8a1-8d24-42f5-b28f-e9c8f6153a11");
        private static readonly Guid GalaxyFoodUserId = new("f9c3b8a1-8d24-42f5-b28f-e9c8f6153a12");
        private static readonly Guid LotteTicketUserId = new("f9c3b8a1-8d24-42f5-b28f-e9c8f6153a21");
        private static readonly Guid LotteFoodUserId = new("f9c3b8a1-8d24-42f5-b28f-e9c8f6153a22");
        private static readonly Guid BhdTicketUserId = new("f9c3b8a1-8d24-42f5-b28f-e9c8f6153a31");
        private static readonly Guid BhdFoodUserId = new("f9c3b8a1-8d24-42f5-b28f-e9c8f6153a32");

        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
IF NOT EXISTS (SELECT 1 FROM [UserInfoEntity] WHERE [UserId] = 'f9c3b8a1-8d24-42f5-b28f-e9c8f6153a11')
BEGIN
INSERT INTO [UserInfoEntity] ([UserId], [AccountStatus], [DateOfBirth], [IdentityCode], [LockoutReason], [Password], [PhoneNumber], [PortraitImageUrl], [RefreshToken], [RegisterMethod], [RewardPoints], [SubId], [UserEmail], [UserName])
VALUES 
('f9c3b8a1-8d24-42f5-b28f-e9c8f6153a11', 1, '1990-01-01 00:00:00', 'POS-GALAXY-TICKET', NULL, '$2a$12$yDhsoUoUEcJKNcTFGo3gwugzOT7glSqRHVP2pk7yV6xeWQMUrAWuu', '0999000011', NULL, NULL, 0, 0, NULL, 'quay.ve.galaxy.cinema.nguyen.du@cinema.com', N'Quay ve - Galaxy Cinema Nguyen Du'),
('f9c3b8a1-8d24-42f5-b28f-e9c8f6153a12', 1, '1990-01-01 00:00:00', 'POS-GALAXY-FOOD', NULL, '$2a$12$yDhsoUoUEcJKNcTFGo3gwugzOT7glSqRHVP2pk7yV6xeWQMUrAWuu', '0999000012', NULL, NULL, 0, 0, NULL, 'quay.bap.nuoc.galaxy.cinema.nguyen.du@cinema.com', N'Quay bap nuoc - Galaxy Cinema Nguyen Du'),
('f9c3b8a1-8d24-42f5-b28f-e9c8f6153a21', 1, '1990-01-01 00:00:00', 'POS-LOTTE-TICKET', NULL, '$2a$12$yDhsoUoUEcJKNcTFGo3gwugzOT7glSqRHVP2pk7yV6xeWQMUrAWuu', '0999000021', NULL, NULL, 0, 0, NULL, 'quay.ve.lotte.cinema.west.lake@cinema.com', N'Quay ve - Lotte Cinema West Lake'),
('f9c3b8a1-8d24-42f5-b28f-e9c8f6153a22', 1, '1990-01-01 00:00:00', 'POS-LOTTE-FOOD', NULL, '$2a$12$yDhsoUoUEcJKNcTFGo3gwugzOT7glSqRHVP2pk7yV6xeWQMUrAWuu', '0999000022', NULL, NULL, 0, 0, NULL, 'quay.bap.nuoc.lotte.cinema.west.lake@cinema.com', N'Quay bap nuoc - Lotte Cinema West Lake'),
('f9c3b8a1-8d24-42f5-b28f-e9c8f6153a31', 1, '1990-01-01 00:00:00', 'POS-BHD-TICKET', NULL, '$2a$12$yDhsoUoUEcJKNcTFGo3gwugzOT7glSqRHVP2pk7yV6xeWQMUrAWuu', '0999000031', NULL, NULL, 0, 0, NULL, 'quay.ve.bhd.star.bitexco@cinema.com', N'Quay ve - BHD Star Bitexco'),
('f9c3b8a1-8d24-42f5-b28f-e9c8f6153a32', 1, '1990-01-01 00:00:00', 'POS-BHD-FOOD', NULL, '$2a$12$yDhsoUoUEcJKNcTFGo3gwugzOT7glSqRHVP2pk7yV6xeWQMUrAWuu', '0999000032', NULL, NULL, 0, 0, NULL, 'quay.bap.nuoc.bhd.star.bitexco@cinema.com', N'Quay bap nuoc - BHD Star Bitexco');
END
");

            migrationBuilder.Sql(@"
IF NOT EXISTS (SELECT 1 FROM [UserRoleInfoEntity] WHERE [RoleId] = '1a8f7b9c-d4e5-4f6a-b7c8-9d0e1f2a3b4c' AND [UserId] = 'f9c3b8a1-8d24-42f5-b28f-e9c8f6153a11')
BEGIN
INSERT INTO [UserRoleInfoEntity] ([RoleId], [UserId])
VALUES 
('1a8f7b9c-d4e5-4f6a-b7c8-9d0e1f2a3b4c', 'f9c3b8a1-8d24-42f5-b28f-e9c8f6153a11'),
('1a8f7b9c-d4e5-4f6a-b7c8-9d0e1f2a3b4c', 'f9c3b8a1-8d24-42f5-b28f-e9c8f6153a12'),
('1a8f7b9c-d4e5-4f6a-b7c8-9d0e1f2a3b4c', 'f9c3b8a1-8d24-42f5-b28f-e9c8f6153a21'),
('1a8f7b9c-d4e5-4f6a-b7c8-9d0e1f2a3b4c', 'f9c3b8a1-8d24-42f5-b28f-e9c8f6153a22'),
('1a8f7b9c-d4e5-4f6a-b7c8-9d0e1f2a3b4c', 'f9c3b8a1-8d24-42f5-b28f-e9c8f6153a31'),
('1a8f7b9c-d4e5-4f6a-b7c8-9d0e1f2a3b4c', 'f9c3b8a1-8d24-42f5-b28f-e9c8f6153a32');
END
");

            migrationBuilder.Sql(@"
IF NOT EXISTS (SELECT 1 FROM [StaffProfileEntity] WHERE [UserId] = 'f9c3b8a1-8d24-42f5-b28f-e9c8f6153a11')
BEGIN
INSERT INTO [StaffProfileEntity] ([UserId], [CinemaId], [DepartmentId], [EmployeeType], [FaceVector], [IsCinemaManager], [WorkingStatus])
VALUES 
('f9c3b8a1-8d24-42f5-b28f-e9c8f6153a11', '11111111-1111-1111-1111-111111111111', 'd1111111-1111-1111-1111-111111111111', 1, NULL, 0, 1),
('f9c3b8a1-8d24-42f5-b28f-e9c8f6153a12', '11111111-1111-1111-1111-111111111111', 'd1111111-1111-1111-1111-222222222222', 1, NULL, 0, 1),
('f9c3b8a1-8d24-42f5-b28f-e9c8f6153a21', '22222222-2222-2222-2222-222222222222', 'd2222222-2222-2222-2222-111111111111', 1, NULL, 0, 1),
('f9c3b8a1-8d24-42f5-b28f-e9c8f6153a22', '22222222-2222-2222-2222-222222222222', 'd2222222-2222-2222-2222-222222222222', 1, NULL, 0, 1),
('f9c3b8a1-8d24-42f5-b28f-e9c8f6153a31', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'dbbbbbbb-bbbb-bbbb-bbbb-111111111111', 1, NULL, 0, 1),
('f9c3b8a1-8d24-42f5-b28f-e9c8f6153a32', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'dbbbbbbb-bbbb-bbbb-bbbb-222222222222', 1, NULL, 0, 1);
END
");

            migrationBuilder.Sql(@"
UPDATE [DepartmentEntity] SET [SharedUserId] = 'f9c3b8a1-8d24-42f5-b28f-e9c8f6153a11' WHERE [DepartmentId] = 'd1111111-1111-1111-1111-111111111111';
UPDATE [DepartmentEntity] SET [SharedUserId] = 'f9c3b8a1-8d24-42f5-b28f-e9c8f6153a12' WHERE [DepartmentId] = 'd1111111-1111-1111-1111-222222222222';
UPDATE [DepartmentEntity] SET [SharedUserId] = 'f9c3b8a1-8d24-42f5-b28f-e9c8f6153a21' WHERE [DepartmentId] = 'd2222222-2222-2222-2222-111111111111';
UPDATE [DepartmentEntity] SET [SharedUserId] = 'f9c3b8a1-8d24-42f5-b28f-e9c8f6153a22' WHERE [DepartmentId] = 'd2222222-2222-2222-2222-222222222222';
UPDATE [DepartmentEntity] SET [SharedUserId] = 'f9c3b8a1-8d24-42f5-b28f-e9c8f6153a31' WHERE [DepartmentId] = 'dbbbbbbb-bbbb-bbbb-bbbb-111111111111';
UPDATE [DepartmentEntity] SET [SharedUserId] = 'f9c3b8a1-8d24-42f5-b28f-e9c8f6153a32' WHERE [DepartmentId] = 'dbbbbbbb-bbbb-bbbb-bbbb-222222222222';
");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
UPDATE [DepartmentEntity] SET [SharedUserId] = NULL WHERE [DepartmentId] IN (
    'd1111111-1111-1111-1111-111111111111',
    'd1111111-1111-1111-1111-222222222222',
    'd2222222-2222-2222-2222-111111111111',
    'd2222222-2222-2222-2222-222222222222',
    'dbbbbbbb-bbbb-bbbb-bbbb-111111111111',
    'dbbbbbbb-bbbb-bbbb-bbbb-222222222222'
);
");

            migrationBuilder.Sql(@"
DELETE FROM [StaffProfileEntity] WHERE [UserId] IN (
    'f9c3b8a1-8d24-42f5-b28f-e9c8f6153a11',
    'f9c3b8a1-8d24-42f5-b28f-e9c8f6153a12',
    'f9c3b8a1-8d24-42f5-b28f-e9c8f6153a21',
    'f9c3b8a1-8d24-42f5-b28f-e9c8f6153a22',
    'f9c3b8a1-8d24-42f5-b28f-e9c8f6153a31',
    'f9c3b8a1-8d24-42f5-b28f-e9c8f6153a32'
);
");

            migrationBuilder.Sql(@"
DELETE FROM [UserRoleInfoEntity] WHERE [RoleId] = '1a8f7b9c-d4e5-4f6a-b7c8-9d0e1f2a3b4c' AND [UserId] IN (
    'f9c3b8a1-8d24-42f5-b28f-e9c8f6153a11',
    'f9c3b8a1-8d24-42f5-b28f-e9c8f6153a12',
    'f9c3b8a1-8d24-42f5-b28f-e9c8f6153a21',
    'f9c3b8a1-8d24-42f5-b28f-e9c8f6153a22',
    'f9c3b8a1-8d24-42f5-b28f-e9c8f6153a31',
    'f9c3b8a1-8d24-42f5-b28f-e9c8f6153a32'
);
");

            migrationBuilder.Sql(@"
DELETE FROM [UserInfoEntity] WHERE [UserId] IN (
    'f9c3b8a1-8d24-42f5-b28f-e9c8f6153a11',
    'f9c3b8a1-8d24-42f5-b28f-e9c8f6153a12',
    'f9c3b8a1-8d24-42f5-b28f-e9c8f6153a21',
    'f9c3b8a1-8d24-42f5-b28f-e9c8f6153a22',
    'f9c3b8a1-8d24-42f5-b28f-e9c8f6153a31',
    'f9c3b8a1-8d24-42f5-b28f-e9c8f6153a32'
);
");
        }

        private static void UpdateDepartmentSharedUser(MigrationBuilder migrationBuilder, Guid departmentId, Guid? userId)
        {
            migrationBuilder.UpdateData(
                table: "DepartmentEntity",
                keyColumn: "DepartmentId",
                keyValue: departmentId,
                column: "SharedUserId",
                value: userId);
        }

        private static void DeleteStaffProfile(MigrationBuilder migrationBuilder, Guid userId)
        {
            migrationBuilder.DeleteData(
                table: "StaffProfileEntity",
                keyColumn: "UserId",
                keyValue: userId);
        }

        private static void DeleteCashierRole(MigrationBuilder migrationBuilder, Guid userId)
        {
            migrationBuilder.DeleteData(
                table: "UserRoleInfoEntity",
                keyColumns: new[] { "RoleId", "UserId" },
                keyValues: new object[] { CashierRoleId, userId });
        }

        private static void DeleteUser(MigrationBuilder migrationBuilder, Guid userId)
        {
            migrationBuilder.DeleteData(
                table: "UserInfoEntity",
                keyColumn: "UserId",
                keyValue: userId);
        }
    }
}
