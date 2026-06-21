using Cinema.Application.Constants;
using Cinema.Domain.Entities.UserInfos;
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
        var posTicketId = Guid.Parse("f9c3b8a1-8d24-42f5-b28f-e9c8f6153a01");
        var posFoodId = Guid.Parse("f9c3b8a1-8d24-42f5-b28f-e9c8f6153a02");

        var defaultDate = new DateTime(2024, 1, 1);

        // 2. Seed Data cho bảng UserInfoEntity (Tài khoản)
        modelBuilder.Entity<UserInfoEntity>().HasData(
            new UserInfoEntity { 
                UserId = adminId, 
                UserEmail = "admin@cinema.com", 
                Password = "$2a$12$ufIKVZZwGlxHfQ0WSZQRmeDDeCuneaflIghQhHC6RupR0LVYLU5bi", 
                AccountStatus = (Cinema.Domain.Enums.AccountStatusEnum)1,
                UserName = "Tổng Quản Trị Hệ Thống", 
                PhoneNumber = "0988123456", 
                DateOfBirth = new DateTime(1985, 1, 1),
                IdentityCode = userIdentityCodeConstant.getUserIdentityCode()[0]
            }, // Password: 123
            new UserInfoEntity { 
                UserId = movieManagerId, 
                UserEmail = "movie.manager@cinema.com", 
                Password = "$2a$12$FhmQsQjdtTZIHEzJIpAjZumRH0WvleZ2xidk22wSd841kxaQNE7ke", 
                AccountStatus = (Cinema.Domain.Enums.AccountStatusEnum)1,
                UserName = "Quản Lý Nội Dung Phim", 
                PhoneNumber = "0911111111", 
                DateOfBirth = new DateTime(1990, 5, 10),
                IdentityCode = userIdentityCodeConstant.getUserIdentityCode()[1]
            },
            new UserInfoEntity { 
                UserId = theaterManagerId, 
                UserEmail = "theater.manager@cinema.com", 
                Password = "$2a$12$Lcz0doBD1.jofXcNDWF8x.4TSmUsyJKR/pbdP.fIh4Fc9yDV5X39m", 
                AccountStatus = (Cinema.Domain.Enums.AccountStatusEnum)1,
                UserName = "Quản Lý Vận Hành Rạp", 
                PhoneNumber = "0922222222", 
                DateOfBirth = new DateTime(1988, 3, 15),
                IdentityCode = userIdentityCodeConstant.getUserIdentityCode()[2]
            },
            new UserInfoEntity { 
                UserId = facilitiesManagerId, 
                UserEmail = "facilities.manager@cinema.com", 
                Password = "$2a$12$v2nSRwPmr62wHUakVl6TCeZLPGLEaVJBqotgF3qXVff0KnlWNWHE2", 
                AccountStatus = (Cinema.Domain.Enums.AccountStatusEnum)1,
                UserName = "Quản Lý Cơ Sở Vật Chất", 
                PhoneNumber = "0933333333", 
                DateOfBirth = new DateTime(1992, 8, 20),
                IdentityCode = userIdentityCodeConstant.getUserIdentityCode()[3]
            },
            new UserInfoEntity { 
                UserId = posTicketId, 
                UserEmail = "quay_ve_01@cinema.com", 
                Password = "$2a$12$ufIKVZZwGlxHfQ0WSZQRmeDDeCuneaflIghQhHC6RupR0LVYLU5bi", 
                AccountStatus = (Cinema.Domain.Enums.AccountStatusEnum)1,
                UserName = "Quầy Vé 01", 
                PhoneNumber = "0999000001", 
                DateOfBirth = new DateTime(1990, 1, 1),
                IdentityCode = userIdentityCodeConstant.getUserIdentityCode()[4]
            },
            new UserInfoEntity { 
                UserId = posFoodId, 
                UserEmail = "quay_bapnuoc_01@cinema.com", 
                Password = "$2a$12$ufIKVZZwGlxHfQ0WSZQRmeDDeCuneaflIghQhHC6RupR0LVYLU5bi", 
                AccountStatus = (Cinema.Domain.Enums.AccountStatusEnum)1,
                UserName = "Quầy Bắp Nước 01", 
                PhoneNumber = "0999000002", 
                DateOfBirth = new DateTime(1990, 1, 1),
                IdentityCode = userIdentityCodeConstant.getUserIdentityCode()[5]
            }
        );

        // 4. Phân quyền (Map User với Role)
        modelBuilder.Entity<UserRoleInfoEntity>().HasData(
            // Admin có tất cả các quyền quản lý
            new UserRoleInfoEntity { UserId = adminId, RoleId = userRoles.Admin },
            new UserRoleInfoEntity { UserId = adminId, RoleId = userRoles.MovieManager },
            new UserRoleInfoEntity { UserId = adminId, RoleId = userRoles.TheaterManager },
            new UserRoleInfoEntity { UserId = adminId, RoleId = userRoles.FacilitiesManager },
            
            // Các manager chuyên biệt
            new UserRoleInfoEntity { UserId = movieManagerId, RoleId = userRoles.MovieManager },
            new UserRoleInfoEntity { UserId = theaterManagerId, RoleId = userRoles.TheaterManager },
            new UserRoleInfoEntity { UserId = facilitiesManagerId, RoleId = userRoles.FacilitiesManager },

            // Cinema.Domain POS accounts có quyền Cashier
            new UserRoleInfoEntity { UserId = posTicketId, RoleId = userRoles.Cashier },
            new UserRoleInfoEntity { UserId = posFoodId, RoleId = userRoles.Cashier }
        );
    }
}

