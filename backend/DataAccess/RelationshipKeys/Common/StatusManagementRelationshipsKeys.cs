using BusinessLayer.Entities.CinemaInfos;
using BusinessLayer.Entities.MovieInfos;
using Microsoft.EntityFrameworkCore;

namespace DataAccess.RelationshipKeys.Common;

public static class StatusManagementRelationships
{
    public static void AddRelationshipsCinemaInfo(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<CinemaInfoEntity>(entity => {
            entity.HasOne(c => c.TheaterManager).WithMany(u => u.TheaterManagedCinemas).HasForeignKey(c => c.TheaterManagerId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(c => c.FacilitiesManager).WithMany(u => u.FacilitiesManagedCinemas).HasForeignKey(c => c.FacilitiesManagerId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<MovieInfoEntity>(entity =>
        {
            entity.HasOne(x => x.MovieManager).WithMany(u => u.ManagedMovieInfos).HasForeignKey(m => m.MovieManagerId)
                .OnDelete(DeleteBehavior.Restrict);
        });
    }
}


