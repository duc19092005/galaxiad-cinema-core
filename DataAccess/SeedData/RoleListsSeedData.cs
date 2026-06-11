using DataAccess.Constants;
using DataAccess.Entities.UserInfos;
using Microsoft.EntityFrameworkCore;

namespace DataAccess.SeedData;

public static class SeedDataRoleLists
{
    public static void AddRoleListsSeedData(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<RoleListInfoEntity>().HasData(
            new RoleListInfoEntity() { RoleId = userRoles.Customer, RoleName = "Customer" },
            new RoleListInfoEntity() { RoleId = userRoles.Cashier, RoleName = "Cashier" },
            new RoleListInfoEntity() { RoleId = userRoles.Admin, RoleName = "Admin" },
            new RoleListInfoEntity() { RoleId = userRoles.MovieManager, RoleName = "MovieManager" },
            new RoleListInfoEntity() { RoleId = userRoles.TheaterManager, RoleName = "TheaterManager" },
            new RoleListInfoEntity() { RoleId = userRoles.FacilitiesManager, RoleName = "FacilitiesManager" },
            new RoleListInfoEntity() { RoleId = userRoles.Student, RoleName = "Student" },
            new RoleListInfoEntity() { RoleId = userRoles.VIP, RoleName = "VIP" }
        );
    }
}

