using DataAccess.Entities.User_Info;
using Microsoft.EntityFrameworkCore;

namespace DataAccess.status_management_relationships_keys;

public class user_segments_info_relationships_keys
{
    public static void add_user_segments_info_relationships(ModelBuilder modelBuilder)
    {
        
    }

    public static void add_user_segments_info_keys(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<user_segments_info_entity>().HasKey(x => x.userSegmentId);
        modelBuilder.Entity<user_segments_info_entity>().HasIndex(x => x.userSegmentName).IsUnique();
        modelBuilder.Entity<user_segments_info_entity>().HasIndex(x => x.userSegmentDescription).IsUnique();
    }
}