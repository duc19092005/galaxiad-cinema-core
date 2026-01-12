using DataAccess.Entities.User_Info;
using Microsoft.EntityFrameworkCore;

namespace DataAccess.status_management_relationships_keys;

public class user_profile_relationships_keys
{
    public static void add_user_profile_relationships(ModelBuilder modelBuilder)
    {
        
    }

    public static void add_user_info_keys(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<user_profile_entity>().HasIndex(x => x.phoneNumber)
            .IsUnique();

        modelBuilder.Entity<user_profile_entity>().HasIndex(x => x.identityCode)
            .IsUnique();
    }
}