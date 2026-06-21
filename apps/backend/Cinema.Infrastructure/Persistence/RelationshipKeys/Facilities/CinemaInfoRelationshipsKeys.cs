using Cinema.Domain.Entities.CinemaInfos;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Internal;

namespace Cinema.Infrastructure.RelationshipKeys.Facilities;

public static class CinemaInfoRelationshipsKeys
{
    public static void AddCinemaInfoRelationships(ModelBuilder modelBuilder)
    {
        
    }
    
    public static void AddCinemaInfoKeys(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<CinemaInfoEntity>()
            .HasIndex(a => new { a.CinemaName })
            .HasFilter("[isDeleted] = CAST(0 AS BIT)")
            .IsUnique();

        modelBuilder.Entity<CinemaInfoEntity>().HasIndex(a => new { a.CinemaHotLineNumber })
            .IsUnique();
    }
}

