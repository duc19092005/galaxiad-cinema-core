using BusinessLayer.Entities.CinemaInfos;
using Microsoft.EntityFrameworkCore;

namespace DataAccess.RelationshipKeys.Facilities;

public static class AuditoriumInfoRelationshipsKeys
{
    public static void AddAuditoriumInfoRelationships(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<AuditoriumInfoEntities>()
            .HasIndex(a => new { a.AuditoriumNumber, a.CinemaId })
            .HasFilter("[isDeleted] = CAST(0 AS BIT)")
            .IsUnique();
        
        modelBuilder.Entity<AuditoriumInfoEntities>().HasOne(x => x.CinemaInfoEntity)
            .WithMany(x => x.AuditoriumInfoEntities)
            .HasForeignKey(x => x.CinemaId).OnDelete(DeleteBehavior.Restrict);
        
        modelBuilder.Entity<AuditoriumFormatInfos>(entity =>
        {
            entity.HasKey(af => new { af.AuditoriumId, af.FormatId });
            
            entity.HasOne(af => af.AuditoriumInfoEntities)
                .WithMany(a => a.AuditoriumFormatInfosList)
                .HasForeignKey(af => af.AuditoriumId);

            entity.HasOne(af => af.MovieFormatInfoEntity)
                .WithMany(f => f.AuditoriumFormatInfosList)
                .HasForeignKey(af => af.FormatId);
        });
    }

    public static void AddAuditoriumInfoKeys(ModelBuilder modelBuilder)
    {
        
    }
}

