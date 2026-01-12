using DataAccess.Constants;
using DataAccess.Entities.User_Info;
using Microsoft.EntityFrameworkCore;

namespace DataAccess.SeedsData;

public class user_segments_info_seed_data
{
    public static void add_user_segments_seed_data(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<user_segments_info_entity>().HasData(new List<user_segments_info_entity>()
        {
            new() {
                userSegmentId = user_segments_constant.Adult,
                userSegmentName = "Adult",
                userSegmentDescription = "Standard customers aged 18 to 59."
            },
            new() {
                userSegmentId = user_segments_constant.Student,
                userSegmentName = "Student",
                userSegmentDescription = "Full-time students with a valid student ID card."
            },
            new() {
                userSegmentId = user_segments_constant.Child,
                userSegmentName = "Child",
                userSegmentDescription = "Children under 12 years old or under 1.3m in height."
            },
            new() {
                userSegmentId = user_segments_constant.SeniorCell,
                userSegmentName = "Senior",
                userSegmentDescription = "Senior citizens aged 60 and above with a valid ID."
            },
            new() {
                userSegmentId = user_segments_constant.MemberStandard,
                userSegmentName = "Standard Member",
                userSegmentDescription = "Registered members with basic loyalty benefits."
            },
            new() {
                userSegmentId = user_segments_constant.MemberVIP,
                userSegmentName = "VIP Member",
                userSegmentDescription = "High-tier members with premium discounts and exclusive offers."
            }
        });
    }
}