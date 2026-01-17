using DataAccess.Constants;
using DataAccess.Entities.User_Info;
using Microsoft.EntityFrameworkCore;

namespace DataAccess.SeedsData;

public static class seedDataUserInfos
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

        // 2. Seed Data cho bảng user_info_entity (Tài khoản)
        modelBuilder.Entity<user_info_entity>().HasData(
            new user_info_entity { userId = adminId, userEmail = "admin@cinema.com", password = "$2a$12$ufIKVZZwGlxHfQ0WSZQRmeDDeCuneaflIghQhHC6RupR0LVYLU5bi" },
            new user_info_entity { userId = movieManagerId, userEmail = "moviemanager@cinema.com", password = "$2a$12$FhmQsQjdtTZIHEzJIpAjZumRH0WvleZ2xidk22wSd841kxaQNE7ke" },
            new user_info_entity { userId = theaterManagerId, userEmail = "theater@cinema.com", password = "$2a$12$Lcz0doBD1.jofXcNDWF8x.4TSmUsyJKR/pbdP.fIh4Fc9yDV5X39m" },
            new user_info_entity { userId = facilitiesManagerId, userEmail = "facilities@cinema.com", password = "$2a$12$v2nSRwPmr62wHUakVl6TCeZLPGLEaVJBqotgF3qXVff0KnlWNWHE2" },
            new user_info_entity { userId = cashierId, userEmail = "cashier@cinema.com", password = "$2a$12$HSYdRT84AjbFawIfnmluJ.AMrBqmqBtKyyn6kNZFTNW7olAMMgXPy" }
        );

        // 3. Seed Data cho bảng user_profile_entity (Thông tin cá nhân)
        // Lưu ý: Cột userID phải khớp với ID ở trên
        modelBuilder.Entity<user_profile_entity>().HasData(
            new user_profile_entity {
                userID = adminId, 
                userName = "System Administrator", 
                phoneNumber = "0988123456", 
                dateOfBirth = new DateTime(1985, 1, 1),
                identityCode = user_identity_code_constant.getUserIdentityCode()[0]
            },
            new user_profile_entity {
                userID = movieManagerId, 
                userName = "Movie Content Manager", 
                phoneNumber = "0911111111", 
                dateOfBirth = new DateTime(1990, 5, 10),
                identityCode = user_identity_code_constant.getUserIdentityCode()[1]
            },
            new user_profile_entity {
                userID = theaterManagerId, 
                userName = "Cinema Operations Manager", 
                phoneNumber = "0922222222", 
                dateOfBirth = new DateTime(1988, 3, 15),
                identityCode = user_identity_code_constant.getUserIdentityCode()[2]
            },
            new user_profile_entity {
                userID = facilitiesManagerId, 
                userName = "Technical Facilities Manager", 
                phoneNumber = "0933333333", 
                dateOfBirth = new DateTime(1992, 8, 20),
                identityCode = user_identity_code_constant.getUserIdentityCode()[3]
            },
            new user_profile_entity {
                userID = cashierId, 
                userName = "Main Cashier", 
                phoneNumber = "0944444444", 
                dateOfBirth = new DateTime(1995, 12, 12),
                identityCode = user_identity_code_constant.getUserIdentityCode()[4]
            }
        );

        // 4. Phân quyền (Map User với Role)
        modelBuilder.Entity<user_role_info_entity>().HasData(
            new user_role_info_entity { userId = adminId, roleId = userRoles.Admin },
            new user_role_info_entity { userId = movieManagerId, roleId = userRoles.MovieManager },
            new user_role_info_entity { userId = theaterManagerId, roleId = userRoles.TheaterManager },
            new user_role_info_entity { userId = facilitiesManagerId, roleId = userRoles.FacilitiesManager },
            new user_role_info_entity { userId = cashierId, roleId = userRoles.Cashier }
        );
    }
}