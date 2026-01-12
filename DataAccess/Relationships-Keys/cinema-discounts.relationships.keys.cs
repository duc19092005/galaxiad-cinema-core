using DataAccess.Entities.Cinema_Infos;
using Microsoft.EntityFrameworkCore;

namespace DataAccess.status_management_relationships_keys;

public class cinema_discounts_relationships_keys
{
    public static void add_cinema_discounts_relationships(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<cinema_discount_info_entity>()
            .HasOne(x => x.cinema_info_entity)
            .WithMany(y => y.cinema_discount_info_entity)
            .HasForeignKey(x => x.cinemaId).OnDelete(DeleteBehavior.Restrict);
        
        modelBuilder.Entity<cinema_discount_info_entity>()
            .HasOne(x => x.movie_format_info_entity)
            .WithMany(y => y.cinema_discount_info_entity)
            .HasForeignKey(x => x.movieFormatId).OnDelete(DeleteBehavior.Restrict);
    }

    public static void add_cinema_discounts_keys(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<cinema_discount_info_entity>().HasKey(x => new
        {
            x.cinemaId, x.movieFormatId
        });
    }
}