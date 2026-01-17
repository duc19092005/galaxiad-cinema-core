using DataAccess.Entities.Cinema_Infos;
using DataAccess.Entities.Movie_infos;
using Microsoft.EntityFrameworkCore;

namespace DataAccess.status_management_relationships_keys;

public class status_management_relationships
{
    public static void add_relationships_cinema_info(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<cinema_info_entity>(entity => {
            entity.HasOne(c => c.creator).WithMany(u => u.createdCinemas).HasForeignKey(c => c.createdByUserId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(c => c.updater).WithMany(u => u.updatedCinemas).HasForeignKey(c => c.updatedByUserId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(c => c.deleter).WithMany(u => u.deletedCinemas).HasForeignKey(c => c.deletedByUserId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(c => c.manager).WithMany(u => u.managedCinemas).HasForeignKey(c => c.managerId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<auditorium_info_entity>(entity => {
            entity.HasOne(a => a.creator).WithMany(u => u.createdAuditoriums).HasForeignKey(a => a.createdByUserId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(a => a.updater).WithMany(u => u.updatedAuditoriums).HasForeignKey(a => a.updatedByUserId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(a => a.deleter).WithMany(u => u.deletedAuditoriums).HasForeignKey(a => a.deletedByUserId).OnDelete(DeleteBehavior.Restrict);
        });
        
        modelBuilder.Entity<movieFormatInfoEntity>(entity => {
            entity.HasOne(m => m.creator).WithMany(u => u.createdMovieFormats).HasForeignKey(m => m.createdByUserId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(m => m.updater).WithMany(u => u.updatedMovieFormats).HasForeignKey(m => m.updatedByUserId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(m => m.deleter).WithMany(u => u.deletedMovieFormats).HasForeignKey(m => m.deletedByUserId).OnDelete(DeleteBehavior.Restrict);
        });
        
        modelBuilder.Entity<cinema_discount_info_entity>(entity => {
            entity.HasOne(m => m.creator).WithMany(u => u.createdCinemaDiscounts).HasForeignKey(m => m.createdByUserId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(m => m.updater).WithMany(u => u.updatedCinemaDiscounts).HasForeignKey(m => m.updatedByUserId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(m => m.deleter).WithMany(u => u.deletedCinemaDiscounts).HasForeignKey(m => m.deletedByUserId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<movieInfoEntity>(entity =>
        {
            entity.HasOne(m => m.creator).WithMany(u => u.createdMovieInfos)
                .HasForeignKey(m => m.createdByUserId)
                .OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(m => m.updater).WithMany(u => u.updatedMovieInfos)
                .HasForeignKey(m => m.updatedByUserId)
                .OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(m => m.deleter).WithMany(u => u.deletedMovieInfos)
                .HasForeignKey(m => m.deletedByUserId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<cinema_surcharge_infos_entity>(entity =>
        {
            entity.HasOne(m => m.creator).WithMany(u => u.createdCinemaSurchargeInfos).HasForeignKey(m => m.createdByUserId)
                .OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(m => m.updater).WithMany(u => u.updatedCinemaSurchargeInfos).HasForeignKey(m => m.updatedByUserId)
                .OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(m => m.deleter).WithMany(u => u.deleteCinemaSurchargeInfos).HasForeignKey(m => m.deletedByUserId)
                .OnDelete(DeleteBehavior.Restrict);
        });
        
        modelBuilder.Entity<movie_schedule_info_entity>(entity =>
        {
            entity.HasOne(m => m.creator).WithMany(u => u.createdSchedules).HasForeignKey(m => m.createdByUserId)
                .OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(m => m.updater).WithMany(u => u.updatedSchedules).HasForeignKey(m => m.updatedByUserId)
                .OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(m => m.deleter).WithMany(u => u.deletedSchedules).HasForeignKey(m => m.deletedByUserId)
                .OnDelete(DeleteBehavior.Restrict);
        });
    }
}