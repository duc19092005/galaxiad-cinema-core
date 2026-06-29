using Cinema.Domain.Constants;
using Cinema.Domain.Entities.UserInfos;
using Cinema.Domain.Enums;
using Cinema.Infrastructure.Identity;
using Microsoft.EntityFrameworkCore;

namespace Cinema.Infrastructure.SeedData;

public static class SeedDataUserInfos
{
    public static void AddUserInfos(ModelBuilder modelBuilder, UserIdentityCodeConstant userIdentityCodeConstant)
    {
        var adminId = Guid.Parse("e4e1f7d8-c3b2-4a90-8c67-2f5a1b3d9e0c");
        var movieManagerId = Guid.Parse("b2c3d4e5-f6a7-8b9c-d0e1-f2a3b4c5d6e7");
        var theaterManagerId = Guid.Parse("7b5d2c1e-9f8a-3e7b-c1d2-a0e9f8c7b6a5");
        var facilitiesManagerId = Guid.Parse("f1a0e9b8-d7c6-5e4f-a3b2-1d0c9b8a7f6e");

        var galaxyTicketPosId = Guid.Parse("f9c3b8a1-8d24-42f5-b28f-e9c8f6153a11");
        var galaxyFoodPosId = Guid.Parse("f9c3b8a1-8d24-42f5-b28f-e9c8f6153a12");
        var lotteTicketPosId = Guid.Parse("f9c3b8a1-8d24-42f5-b28f-e9c8f6153a21");
        var lotteFoodPosId = Guid.Parse("f9c3b8a1-8d24-42f5-b28f-e9c8f6153a22");
        var bhdTicketPosId = Guid.Parse("f9c3b8a1-8d24-42f5-b28f-e9c8f6153a31");
        var bhdFoodPosId = Guid.Parse("f9c3b8a1-8d24-42f5-b28f-e9c8f6153a32");

        const string adminPasswordHash = "$2a$12$ufIKVZZwGlxHfQ0WSZQRmeDDeCuneaflIghQhHC6RupR0LVYLU5bi";
        const string departmentPasswordHash = "$2a$12$yDhsoUoUEcJKNcTFGo3gwugzOT7glSqRHVP2pk7yV6xeWQMUrAWuu";

        var encryptedIdentityCodes = userIdentityCodeConstant.getUserIdentityCode();

        modelBuilder.Entity<UserInfoEntity>().HasData(
            new UserInfoEntity
            {
                UserId = adminId,
                UserEmail = "admin@cinema.com",
                Password = adminPasswordHash,
                RegisterMethod = RegisterMethodEnum.UsernamePassword,
                AccountStatus = AccountStatusEnum.Active,
                UserName = "Tổng Quản Trị Hệ Thống",
                PhoneNumber = "0988123456",
                DateOfBirth = new DateTime(1985, 1, 1),
                IdentityCode = encryptedIdentityCodes[0]
            },
            new UserInfoEntity
            {
                UserId = movieManagerId,
                UserEmail = "movie.manager@cinema.com",
                Password = "$2a$12$FhmQsQjdtTZIHEzJIpAjZumRH0WvleZ2xidk22wSd841kxaQNE7ke",
                RegisterMethod = RegisterMethodEnum.UsernamePassword,
                AccountStatus = AccountStatusEnum.Active,
                UserName = "Quản Lý Nội Dung Phim",
                PhoneNumber = "0911111111",
                DateOfBirth = new DateTime(1990, 5, 10),
                IdentityCode = encryptedIdentityCodes[1]
            },
            new UserInfoEntity
            {
                UserId = theaterManagerId,
                UserEmail = "theater.manager@cinema.com",
                Password = "$2a$12$Lcz0doBD1.jofXcNDWF8x.4TSmUsyJKR/pbdP.fIh4Fc9yDV5X39m",
                RegisterMethod = RegisterMethodEnum.UsernamePassword,
                AccountStatus = AccountStatusEnum.Active,
                UserName = "Quản Lý Vận Hành Rạp",
                PhoneNumber = "0922222222",
                DateOfBirth = new DateTime(1988, 3, 15),
                IdentityCode = encryptedIdentityCodes[2]
            },
            new UserInfoEntity
            {
                UserId = facilitiesManagerId,
                UserEmail = "facilities.manager@cinema.com",
                Password = "$2a$12$v2nSRwPmr62wHUakVl6TCeZLPGLEaVJBqotgF3qXVff0KnlWNWHE2",
                RegisterMethod = RegisterMethodEnum.UsernamePassword,
                AccountStatus = AccountStatusEnum.Active,
                UserName = "Quản Lý Cơ Sở Vật Chất",
                PhoneNumber = "0933333333",
                DateOfBirth = new DateTime(1992, 8, 20),
                IdentityCode = encryptedIdentityCodes[3]
            },
            new UserInfoEntity
            {
                UserId = galaxyTicketPosId,
                UserEmail = "quay.ve.galaxy.cinema.nguyen.du@cinema.com",
                Password = departmentPasswordHash,
                RegisterMethod = RegisterMethodEnum.UsernamePassword,
                AccountStatus = AccountStatusEnum.Active,
                UserName = "Quay ve - Galaxy Cinema Nguyen Du",
                PhoneNumber = "0999000011",
                DateOfBirth = new DateTime(1990, 1, 1),
                IdentityCode = "POS_GALAXY_TICKET"
            },
            new UserInfoEntity
            {
                UserId = galaxyFoodPosId,
                UserEmail = "quay.bap.nuoc.galaxy.cinema.nguyen.du@cinema.com",
                Password = departmentPasswordHash,
                RegisterMethod = RegisterMethodEnum.UsernamePassword,
                AccountStatus = AccountStatusEnum.Active,
                UserName = "Quay bap nuoc - Galaxy Cinema Nguyen Du",
                PhoneNumber = "0999000012",
                DateOfBirth = new DateTime(1990, 1, 1),
                IdentityCode = "POS_GALAXY_FOOD"
            },
            new UserInfoEntity
            {
                UserId = lotteTicketPosId,
                UserEmail = "quay.ve.lotte.cinema.west.lake@cinema.com",
                Password = departmentPasswordHash,
                RegisterMethod = RegisterMethodEnum.UsernamePassword,
                AccountStatus = AccountStatusEnum.Active,
                UserName = "Quay ve - Lotte Cinema West Lake",
                PhoneNumber = "0999000021",
                DateOfBirth = new DateTime(1990, 1, 1),
                IdentityCode = "POS_LOTTE_TICKET"
            },
            new UserInfoEntity
            {
                UserId = lotteFoodPosId,
                UserEmail = "quay.bap.nuoc.lotte.cinema.west.lake@cinema.com",
                Password = departmentPasswordHash,
                RegisterMethod = RegisterMethodEnum.UsernamePassword,
                AccountStatus = AccountStatusEnum.Active,
                UserName = "Quay bap nuoc - Lotte Cinema West Lake",
                PhoneNumber = "0999000022",
                DateOfBirth = new DateTime(1990, 1, 1),
                IdentityCode = "POS_LOTTE_FOOD"
            },
            new UserInfoEntity
            {
                UserId = bhdTicketPosId,
                UserEmail = "quay.ve.bhd.star.bitexco@cinema.com",
                Password = departmentPasswordHash,
                RegisterMethod = RegisterMethodEnum.UsernamePassword,
                AccountStatus = AccountStatusEnum.Active,
                UserName = "Quay ve - BHD Star Bitexco",
                PhoneNumber = "0999000031",
                DateOfBirth = new DateTime(1990, 1, 1),
                IdentityCode = "POS_BHD_TICKET"
            },
            new UserInfoEntity
            {
                UserId = bhdFoodPosId,
                UserEmail = "quay.bap.nuoc.bhd.star.bitexco@cinema.com",
                Password = departmentPasswordHash,
                RegisterMethod = RegisterMethodEnum.UsernamePassword,
                AccountStatus = AccountStatusEnum.Active,
                UserName = "Quay bap nuoc - BHD Star Bitexco",
                PhoneNumber = "0999000032",
                DateOfBirth = new DateTime(1990, 1, 1),
                IdentityCode = "POS_BHD_FOOD"
            }
        );

        modelBuilder.Entity<UserRoleInfoEntity>().HasData(
            new UserRoleInfoEntity { UserId = adminId, RoleId = userRoles.Admin },
            new UserRoleInfoEntity { UserId = adminId, RoleId = userRoles.MovieManager },
            new UserRoleInfoEntity { UserId = adminId, RoleId = userRoles.TheaterManager },
            new UserRoleInfoEntity { UserId = adminId, RoleId = userRoles.FacilitiesManager },
            new UserRoleInfoEntity { UserId = movieManagerId, RoleId = userRoles.MovieManager },
            new UserRoleInfoEntity { UserId = theaterManagerId, RoleId = userRoles.TheaterManager },
            new UserRoleInfoEntity { UserId = facilitiesManagerId, RoleId = userRoles.FacilitiesManager },
            new UserRoleInfoEntity { UserId = galaxyTicketPosId, RoleId = userRoles.Cashier },
            new UserRoleInfoEntity { UserId = galaxyFoodPosId, RoleId = userRoles.Cashier },
            new UserRoleInfoEntity { UserId = lotteTicketPosId, RoleId = userRoles.Cashier },
            new UserRoleInfoEntity { UserId = lotteFoodPosId, RoleId = userRoles.Cashier },
            new UserRoleInfoEntity { UserId = bhdTicketPosId, RoleId = userRoles.Cashier },
            new UserRoleInfoEntity { UserId = bhdFoodPosId, RoleId = userRoles.Cashier }
        );

        modelBuilder.Entity<StaffProfileEntity>().HasData(
            DepartmentProfile(galaxyTicketPosId, "11111111-1111-1111-1111-111111111111", "d1111111-1111-1111-1111-111111111111"),
            DepartmentProfile(galaxyFoodPosId, "11111111-1111-1111-1111-111111111111", "d1111111-1111-1111-1111-222222222222"),
            DepartmentProfile(lotteTicketPosId, "22222222-2222-2222-2222-222222222222", "d2222222-2222-2222-2222-111111111111"),
            DepartmentProfile(lotteFoodPosId, "22222222-2222-2222-2222-222222222222", "d2222222-2222-2222-2222-222222222222"),
            DepartmentProfile(bhdTicketPosId, "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb", "dbbbbbbb-bbbb-bbbb-bbbb-111111111111"),
            DepartmentProfile(bhdFoodPosId, "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb", "dbbbbbbb-bbbb-bbbb-bbbb-222222222222")
        );
    }

    private static StaffProfileEntity DepartmentProfile(Guid userId, string cinemaId, string departmentId)
    {
        return new StaffProfileEntity
        {
            UserId = userId,
            CinemaId = Guid.Parse(cinemaId),
            DepartmentId = Guid.Parse(departmentId),
            WorkingStatus = true,
            IsCinemaManager = false,
            EmployeeType = EmployeeWorkType.FullTime
        };
    }
}
