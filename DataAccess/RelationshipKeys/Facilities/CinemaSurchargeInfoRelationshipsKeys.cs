// ReSharper disable All

using BusinessLayer.Entities.CinemaInfos;
using BusinessLayer.Entities.UserInfos;
using BusinessLayer.Entities.MovieInfos;
using Microsoft.EntityFrameworkCore;

namespace DataAccess.RelationshipKeys.Facilities;

public static class CinemaSurchargeInfoRelationshipsKeys
{
    public static void AddCinemaSurchargeInfoRelationships(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<CinemaSurchargeInfosEntity>().HasOne(x => x.CinemaInfoEntity)
            .WithMany(y => y.CinemaSurchargeInfosEntity).HasForeignKey(x => x.CinemaId);
        
        modelBuilder.Entity<CinemaSurchargeInfosEntity>().HasOne(x => x.MovieFormatInfoEntity)
            .WithMany(y => y.cinema_surcharge_infos_entities).HasForeignKey(x => x.MovieFormatId);

        modelBuilder.Entity<CinemaSurchargeInfosEntity>()
            .HasOne(x => x.UserSegmentsInfoEntity).WithMany(x => x.CinemaSurchargeInfosEntity)
            .HasForeignKey(x => x.UserSegmentId);
    }
    
    public static void AddCinemaSurchargeInfoKeys(ModelBuilder modelBuilder)
    {
        // Composite key: Cinema + Format + UserSegment allows different surcharges per user type
        modelBuilder.Entity<CinemaSurchargeInfosEntity>().HasKey(x => new { cinemaId = x.CinemaId, movieFormatId = x.MovieFormatId, userSegmentId = x.UserSegmentId });
    }
}


