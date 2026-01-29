using DataAccess.Entities.CinemaInfos;
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
    }

    public static void AddAuditoriumInfoKeys(ModelBuilder modelBuilder)
    {
        
    }
}

