using DataAccess.Constants;
using DataAccess.Entities.User_Info;
using Microsoft.EntityFrameworkCore;

namespace DataAccess.SeedsData;

public static class seedDataRoleLists
{
    public static void AddRoleListsSeedData(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<role_list_info_entity>().HasData(
            new role_list_info_entity() { roleId = userRoles.Customer, roleName = "Customer" },
            new role_list_info_entity() { roleId = userRoles.Cashier, roleName = "Cashier" },
            new role_list_info_entity() { roleId = userRoles.Admin, roleName = "Admin" },
            new role_list_info_entity() { roleId = userRoles.MovieManager, roleName = "MovieManager" },
            new role_list_info_entity() { roleId = userRoles.TheaterManager, roleName = "TheaterManager" },
            new role_list_info_entity() { roleId = userRoles.FacilitiesManager, roleName = "FacilitiesManager" }
        );
    }
}