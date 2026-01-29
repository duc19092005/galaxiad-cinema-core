using DataAccess.Constants;
using DataAccess.Entities.UserInfos;
using Microsoft.EntityFrameworkCore;

namespace DataAccess.SeedData;

public static class SeedDataUserInfos
{
    public static void AddUserInfos(ModelBuilder modelBuilder, user_identity_code_constant user_identity_code_constant)
    {
        // 1. Cố định GUID để tránh lỗi Foreign Key
        var adminId = Guid.Parse("e4e1f7d8-c3b2-4a90-8c67-2f5a1b3d9e0c");
        var movieManagerId = Guid.Parse("b2c3d4e5-f6a7-8b9c-d0e1-f2a3b4c5d6e7");
        var theaterManagerId = Guid.Parse("7b5d2c1e-9f8a-3e7b-c1d2-a0e9f8c7b6a5");
        var facilitiesManagerId = Guid.Parse("f1a0e9b8-d7c6-5e4f-a3b2-1d0c9b8a7f6e");
        var cashierId = Guid.Parse("a1b2c3d4-e5f6-7a8b-c9d0-e1f2a3b4c5d6");

        var defaultDate = new DateTime(2024, 1, 1);

        // 2. Seed Data cho bảng UserInfoEntity (Tài khoản)
        modelBuilder.Entity<UserInfoEntity>().HasData(
            new UserInfoEntity { UserId = adminId, UserEmail = "admin@cinema.com", Password = "$2a$12$ufIKVZZwGlxHfQ0WSZQRmeDDeCuneaflIghQhHC6RupR0LVYLU5bi" },
            new UserInfoEntity { UserId = movieManagerId, UserEmail = "moviemanager@cinema.com", Password = "$2a$12$FhmQsQjdtTZIHEzJIpAjZumRH0WvleZ2xidk22wSd841kxaQNE7ke" },
            new UserInfoEntity { UserId = theaterManagerId, UserEmail = "theater@cinema.com", Password = "$2a$12$Lcz0doBD1.jofXcNDWF8x.4TSmUsyJKR/pbdP.fIh4Fc9yDV5X39m" },
            new UserInfoEntity { UserId = facilitiesManagerId, UserEmail = "facilities@cinema.com", Password = "$2a$12$v2nSRwPmr62wHUakVl6TCeZLPGLEaVJBqotgF3qXVff0KnlWNWHE2" },
            new UserInfoEntity { UserId = cashierId, UserEmail = "cashier@cinema.com", Password = "$2a$12$HSYdRT84AjbFawIfnmluJ.AMrBqmqBtKyyn6kNZFTNW7olAMMgXPy" }
        );

        // 3. Seed Data cho bảng UserProfileEntity (Thông tin cá nhân)
        // Lưu ý: Cột userID phải khớp với ID ở trên
        modelBuilder.Entity<UserProfileEntity>().HasData(
            new UserProfileEntity {
                UserId = adminId, 
                UserName = "System Administrator", 
                PhoneNumber = "0988123456", 
                DateOfBirth = new DateTime(1985, 1, 1),
                IdentityCode = user_identity_code_constant.getUserIdentityCode()[0]
            },
            new UserProfileEntity {
                UserId = movieManagerId, 
                UserName = "Movie Content Manager", 
                PhoneNumber = "0911111111", 
                DateOfBirth = new DateTime(1990, 5, 10),
                IdentityCode = user_identity_code_constant.getUserIdentityCode()[1]
            },
            new UserProfileEntity {
                UserId = theaterManagerId, 
                UserName = "Cinema Operations Manager", 
                PhoneNumber = "0922222222", 
                DateOfBirth = new DateTime(1988, 3, 15),
                IdentityCode = user_identity_code_constant.getUserIdentityCode()[2]
            },
            new UserProfileEntity {
                UserId = facilitiesManagerId, 
                UserName = "Technical Facilities Manager", 
                PhoneNumber = "0933333333", 
                DateOfBirth = new DateTime(1992, 8, 20),
                IdentityCode = user_identity_code_constant.getUserIdentityCode()[3]
            },
            new UserProfileEntity {
                UserId = cashierId, 
                UserName = "Main Cashier", 
                PhoneNumber = "0944444444", 
                DateOfBirth = new DateTime(1995, 12, 12),
                IdentityCode = user_identity_code_constant.getUserIdentityCode()[4]
            }
        );

        // 4. Phân quyền (Map User với Role)
        modelBuilder.Entity<UserRoleInfoEntity>().HasData(
            new UserRoleInfoEntity { UserId = adminId, RoleId = userRoles.Admin },
            new UserRoleInfoEntity { UserId = movieManagerId, RoleId = userRoles.MovieManager },
            new UserRoleInfoEntity { UserId = theaterManagerId, RoleId = userRoles.TheaterManager },
            new UserRoleInfoEntity { UserId = facilitiesManagerId, RoleId = userRoles.FacilitiesManager },
            new UserRoleInfoEntity { UserId = cashierId, RoleId = userRoles.Cashier }
        );
    }
}

