using DataAccess.Constants;
using DataAccess.Entities.CinemaInfos;
using Microsoft.EntityFrameworkCore;

namespace DataAccess.SeedData;

/// <summary>
/// Seeds surcharge percentages per Cinema, MovieFormat, and UserSegment.
/// SurchangePercent is added on top of the base MovieFormatPrice.
/// Example: Adult=0% (base price), Student=-15% (discount), Child=-20%, Senior=-10%, Member=-5%, VIP=-25%
/// </summary>
public static class CinemaSurchargeSeedData
{
    public static void AddCinemaSurchargeSeedData(ModelBuilder modelBuilder)
    {
        var adminId = Guid.Parse("e4e1f7d8-c3b2-4a90-8c67-2f5a1b3d9e0c");
        var defaultDate = new DateTime(2024, 1, 1);

        // Cinema IDs (from CinemaAndMovieSeedData)
        var cinemaHCMId = Guid.Parse("11111111-1111-1111-1111-111111111111");
        var cinemaHNId = Guid.Parse("22222222-2222-2222-2222-222222222222");
        var cinemaBHDId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");

        // Define pricing adjustments per segment
        // Positive = surcharge, Negative = discount
        var segmentAdjustments = new Dictionary<Guid, decimal>
        {
            { user_segments_constant.Adult, 0m },           // Base price - no adjustment
            { user_segments_constant.Student, -15.00m },    // 15% discount
            { user_segments_constant.Child, -20.00m },      // 20% discount
            { user_segments_constant.SeniorCell, -10.00m }, // 10% discount
            { user_segments_constant.MemberStandard, -5.00m },  // 5% discount
            { user_segments_constant.MemberVIP, -25.00m },  // 25% discount (best deal)
        };

        // Movie Formats available at each cinema (from AuditoriumFormat seed)
        // Cinema HCM has 2D auditorium
        // Cinema HN has IMAX auditorium
        // Cinema BHD has 3D auditorium
        // But for surcharge pricing, we seed all common formats for all cinemas
        var formats = new[]
        {
            movie_visual_constant.Format2D,
            movie_visual_constant.Format3D,
            movie_visual_constant.Imax,
        };

        var cinemaIds = new[] { cinemaHCMId, cinemaHNId, cinemaBHDId };

        var surcharges = new List<CinemaSurchargeInfosEntity>();

        foreach (var cinemaId in cinemaIds)
        {
            foreach (var formatId in formats)
            {
                foreach (var (segmentId, adjustmentPercent) in segmentAdjustments)
                {
                    surcharges.Add(new CinemaSurchargeInfosEntity
                    {
                        CinemaId = cinemaId,
                        MovieFormatId = formatId,
                        UserSegmentId = segmentId,
                        SurchangePercent = adjustmentPercent,
                        CreatedAt = defaultDate,
                        UpdatedAt = defaultDate,
                        CreatedByUserId = adminId
                    });
                }
            }
        }

        modelBuilder.Entity<CinemaSurchargeInfosEntity>().HasData(surcharges);
    }
}
