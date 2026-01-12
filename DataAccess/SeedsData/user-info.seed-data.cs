using DataAccess.Constants;
using DataAccess.Entities.User_Info;
using Microsoft.EntityFrameworkCore;

namespace DataAccess.SeedsData;

public class user_info_seed_data
{
    public static void add_user_info_seed_data(ModelBuilder modelBuilder , user_identity_code_constant user_identity_code_constant)
    {
        // Seed Data for UserInformation
        
        var Cashier = "a1b2c3d4-e5f6-7a8b-c9d0-e1f2a3b4c5d6";
        var MovieManagerId = "b2c3d4e5-f6a7-8b9c-d0e1-f2a3b4c5d6e7";

        // Đây là ngời có Role là QL rap
        string AdminId = "e4e1f7d8-c3b2-4a90-8c67-2f5a1b3d9e0c";
        string UserTheaterManagerId = "7b5d2c1e-9f8a-3e7b-c1d2-a0e9f8c7b6a5";
        string UserFacilitiesManagerId = "f1a0e9b8-d7c6-5e4f-a3b2-1d0c9b8a7f6e";
        
        modelBuilder.Entity<user_info_entity>().HasData(
            new user_info_entity
            {
                userId = Guid.Parse(MovieManagerId),
                userEmail = "user@example.com",
                password = "$2a$12$ADqBiSquthm1g7bLZvg6UulJ5QJFQQ6olUQzf66AQfJDGbQ2W1wlG",
                refreshToken = null,
                subId = null
            },
            new user_info_entity
            {
                userId = Guid.Parse(AdminId),
                userEmail = "admin@example.com",
                password = "$2a$12$91JfhncA5t3ssFtiaoKjSOrbMj7zON.wtL/n3cjme/wvK2kDCgZ7K",
                refreshToken = null,
                subId = null
            },
            new user_info_entity
            {
                userId = Guid.Parse(UserTheaterManagerId),
                userEmail = "theater@example.com",
                password = "$2a$12$FeLXQjfW3gfNFfELxTJS3.gH8o9Y2CB5WSGcDZxKMrPEJiR2RcxIS",
                refreshToken = null,
                subId = null
            },
            new user_info_entity
            {
                userId = Guid.Parse(UserFacilitiesManagerId),
                userEmail = "facilities@example.com",
                password = "$2a$12$CkugZHMrWhxG0h6hUqOAf.fX9QQFkLnfnLlI.xWCNZ1y/PivtfN2O",
                refreshToken = null,
                subId = null
            },
            // BỔ SUNG DÒNG NÀY ĐỂ HẾT LỖI FK
            new user_info_entity
            {
                userId = Guid.Parse(Cashier),
                userEmail = "cashier@example.com",
                password = "$2a$12$CkugZHMrWhxG0h6hUqOAf.fX9QQFkLnfnLlI.xWCNZ1y/PivtfN2O",
                refreshToken = null,
                subId = null
            }
        );

        modelBuilder.Entity<user_profile_entity>().HasData(new List<user_profile_entity>()
        {
            // 1. Profile cho Người dùng thông thường (MovieManagerId)
            new user_profile_entity
            {
                userID = Guid.Parse(MovieManagerId),
                dateOfBirth = new DateTime(2005, 10, 10),
                identityCode = user_identity_code_constant.getUserIdentityCode()[0],
                phoneNumber = "0123456789",
                userName = "Movie Manager 1"
            },
            new user_profile_entity
            {
                userID = Guid.Parse(AdminId),
                dateOfBirth = new DateTime(1985, 01, 01),
                identityCode = user_identity_code_constant.getUserIdentityCode()[1],
                phoneNumber = "0988123456",
                userName = "Admin"
            },
            new user_profile_entity
            {
                userID = Guid.Parse(UserTheaterManagerId),
                dateOfBirth = new DateTime(1990, 05, 15),
                identityCode = user_identity_code_constant.getUserIdentityCode()[2],
                phoneNumber = "0977234567",
                userName = "Theater Manager"
            },
            new user_profile_entity
            {
                userID = Guid.Parse(UserFacilitiesManagerId),
                dateOfBirth = new DateTime(1992, 08, 20),
                identityCode = user_identity_code_constant.getUserIdentityCode()[3],
                phoneNumber = "0966345678",
                userName = "Facilities Manager"
            },
            // 5. Profile bổ sung cho Cashier
            new user_profile_entity
            {
                userID = Guid.Parse(Cashier),
                dateOfBirth = new DateTime(1995, 12, 12),
                identityCode = user_identity_code_constant.getUserIdentityCode()[4],
                phoneNumber = "0944456789",
                userName = "Cashier"
            }
        });
        
        modelBuilder.Entity<user_role_info_entity>().HasData(
            // 1. Admin - Quyền Admin
            new user_role_info_entity 
            { 
                userId = Guid.Parse(AdminId), 
                roleId = userRoles.Admin 
            },

            // 2. MovieManager - Quyền MovieManager
            new user_role_info_entity 
            { 
                userId = Guid.Parse(MovieManagerId), 
                roleId = userRoles.MovieManager 
            },

            // 3. Theater Manager - Quyền TheaterManager
            new user_role_info_entity 
            { 
                userId = Guid.Parse(UserTheaterManagerId), 
                roleId = userRoles.TheaterManager 
            },

            // 4. Facilities Manager - Quyền FacilitiesManager
            new user_role_info_entity 
            { 
                userId = Guid.Parse(UserFacilitiesManagerId), 
                roleId = userRoles.FacilitiesManager 
            },

            // 5. Cashier - Quyền Cashier
            new user_role_info_entity 
            { 
                userId = Guid.Parse(Cashier), 
                roleId = userRoles.Cashier 
            }
        );
    }
}