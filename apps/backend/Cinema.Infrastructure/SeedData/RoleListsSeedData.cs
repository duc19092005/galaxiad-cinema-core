using Cinema.Application.Constants;
using Cinema.Domain.Entities.UserInfos;
using Microsoft.EntityFrameworkCore;

namespace Cinema.Infrastructure.SeedData;

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
            new RoleListInfoEntity() { RoleId = userRoles.FacilitiesManager, RoleName = "FacilitiesManager" }
        );
    }
}

