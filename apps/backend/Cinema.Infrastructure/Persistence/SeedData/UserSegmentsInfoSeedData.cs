using Cinema.Domain.Constants;
using Cinema.Domain.Entities.UserInfos;
using Microsoft.EntityFrameworkCore;

namespace Cinema.Infrastructure.SeedData;

public static class SeedDataUserSegmentsInfos
{
    public static void AddUserSegments(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<UserSegmentsInfoEntity>().HasData(new List<UserSegmentsInfoEntity>()
        {
            new() {
                UserSegmentId = user_segments_constant.Adult,
                UserSegmentName = "Adult",
                UserSegmentDescription = "Standard customers aged 18 to 59."
            },
            new() {
                UserSegmentId = user_segments_constant.Student,
                UserSegmentName = "Student",
                UserSegmentDescription = "Full-time students with a valid student ID card."
            },
            new() {
                UserSegmentId = user_segments_constant.Child,
                UserSegmentName = "Child",
                UserSegmentDescription = "Children under 12 years old or under 1.3m in height."
            },
            new() {
                UserSegmentId = user_segments_constant.SeniorCell,
                UserSegmentName = "Senior",
                UserSegmentDescription = "Senior citizens aged 60 and above with a valid ID."
            },
            new() {
                UserSegmentId = user_segments_constant.MemberStandard,
                UserSegmentName = "Standard Member",
                UserSegmentDescription = "Registered members with basic loyalty benefits."
            },
            new() {
                UserSegmentId = user_segments_constant.MemberVIP,
                UserSegmentName = "VIP Member",
                UserSegmentDescription = "High-tier members with premium discounts and exclusive offers."
            }
        });
    }
}

