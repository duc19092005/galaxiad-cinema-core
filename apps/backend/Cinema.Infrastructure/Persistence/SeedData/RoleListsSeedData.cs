using Cinema.Application.Constants;
using Cinema.Domain.Entities.UserInfos;
using Cinema.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace Cinema.Infrastructure.SeedData;

public static class SeedDataRoleLists
{
    public static void AddRoleListsSeedData(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<RoleListInfoEntity>().HasData(
            new RoleListInfoEntity() { RoleId = userRoles.Customer, RoleName = "Customer", RoleType = RoleCategory.Customer },
            new RoleListInfoEntity() { RoleId = userRoles.Cashier, RoleName = "Cashier", RoleType = RoleCategory.Staff },
            new RoleListInfoEntity() { RoleId = userRoles.Admin, RoleName = "Admin", RoleType = RoleCategory.Admin },
            new RoleListInfoEntity() { RoleId = userRoles.MovieManager, RoleName = "MovieManager", RoleType = RoleCategory.Manager },
            new RoleListInfoEntity() { RoleId = userRoles.TheaterManager, RoleName = "TheaterManager", RoleType = RoleCategory.Manager },
            new RoleListInfoEntity() { RoleId = userRoles.FacilitiesManager, RoleName = "FacilitiesManager", RoleType = RoleCategory.Manager }
        );
    }
}

