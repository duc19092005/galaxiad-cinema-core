using DataAccess.Entities.User_Info;
using Microsoft.EntityFrameworkCore;

namespace DataAccess.status_management_relationships_keys;

public class role_lists_relationships_keys
{
    public static void add_role_lists_relationships(ModelBuilder modelBuilder)
    {
        
    }

    public static void add_role_lists_keys(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<role_list_info_entity>().HasIndex(x => x.roleName).IsUnique();
    }
}