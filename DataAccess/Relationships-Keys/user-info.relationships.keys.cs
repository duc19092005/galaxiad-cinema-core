using DataAccess.Entities.User_Info;
using Microsoft.EntityFrameworkCore;

namespace DataAccess.status_management_relationships_keys;

public class user_info_relationships_keys
{
    public static void add_user_info_relationships(ModelBuilder  modelBuilder)
    {
        modelBuilder.Entity<user_info_entity>()
            .HasOne(u => u.user_profile_entity)
            .WithOne(p => p.user_info_entity)
            .HasForeignKey<user_profile_entity>(p => p.userID);
    }
    
    public static void add_user_info_keys(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<user_info_entity>().HasIndex(x => x.refreshToken).IsUnique();

        modelBuilder.Entity<user_info_entity>().HasIndex(x => x.userEmail).IsUnique();
    }
}