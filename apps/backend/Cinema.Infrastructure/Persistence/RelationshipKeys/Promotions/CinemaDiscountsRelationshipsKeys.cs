using Cinema.Domain.Entities.CinemaInfos;
using Microsoft.EntityFrameworkCore;

namespace Cinema.Infrastructure.RelationshipKeys.Promotions;

public static class CinemaDiscountsRelationshipsKeys
{
    public static void AddCinemaDiscountsRelationships(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<CinemaDiscountInfoEntity>()
            .HasOne(x => x.CinemaInfoEntity)
            .WithMany(y => y.CinemaDiscountInfoEntity)
            .HasForeignKey(x => x.CinemaId).OnDelete(DeleteBehavior.Restrict);
        
        modelBuilder.Entity<CinemaDiscountInfoEntity>()
            .HasOne(x => x.MovieFormatInfoEntity)
            .WithMany(y => y.cinema_discount_info_entities)
            .HasForeignKey(x => x.MovieFormatId).OnDelete(DeleteBehavior.Restrict);
    }

    public static void AddCinemaDiscountsKeys(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<CinemaDiscountInfoEntity>().HasKey(x => new
        {
            cinemaId = x.CinemaId, movieFormatId = x.MovieFormatId
        });
    }
}


