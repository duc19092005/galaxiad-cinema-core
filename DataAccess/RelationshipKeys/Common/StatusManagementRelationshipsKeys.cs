using DataAccess.Entities.CinemaInfos;
using DataAccess.Entities.MovieInfos;
using DataAccess.Entities.UserInfos;
using Microsoft.EntityFrameworkCore;

namespace DataAccess.RelationshipKeys.Common;

public static class StatusManagementRelationships
{
    public static void AddRelationshipsCinemaInfo(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<CinemaInfoEntity>(entity => {
            entity.HasOne(c => c.Creator).WithMany(u => u.CreatedCinemas).HasForeignKey(c => c.CreatedByUserId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(c => c.Updater).WithMany(u => u.UpdatedCinemas).HasForeignKey(c => c.UpdatedByUserId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(c => c.Deleter).WithMany(u => u.DeletedCinemas).HasForeignKey(c => c.DeletedByUserId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(c => c.manager).WithMany(u => u.ManagedCinemas).HasForeignKey(c => c.ManagerId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<AuditoriumInfoEntities>(entity => {
            entity.HasOne(a => a.Creator).WithMany(u => u.CreatedAuditoriums).HasForeignKey(a => a.CreatedByUserId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(a => a.Updater).WithMany(u => u.UpdatedAuditoriums).HasForeignKey(a => a.UpdatedByUserId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(a => a.Deleter).WithMany(u => u.DeletedAuditoriums).HasForeignKey(a => a.DeletedByUserId).OnDelete(DeleteBehavior.Restrict);
        });
        
        modelBuilder.Entity<MovieFormatInfoEntity>(entity => {
            entity.HasOne(m => m.Creator).WithMany(u => u.CreatedMovieFormats).HasForeignKey(m => m.CreatedByUserId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(m => m.Updater).WithMany(u => u.UpdatedMovieFormats).HasForeignKey(m => m.UpdatedByUserId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(m => m.Deleter).WithMany(u => u.DeletedMovieFormats).HasForeignKey(m => m.DeletedByUserId).OnDelete(DeleteBehavior.Restrict);
        });
        
        modelBuilder.Entity<CinemaDiscountInfoEntity>(entity => {
            entity.HasOne(m => m.Creator).WithMany(u => u.CreatedCinemaDiscounts).HasForeignKey(m => m.CreatedByUserId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(m => m.Updater).WithMany(u => u.UpdatedCinemaDiscounts).HasForeignKey(m => m.UpdatedByUserId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(m => m.Deleter).WithMany(u => u.DeletedCinemaDiscounts).HasForeignKey(m => m.DeletedByUserId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<MovieInfoEntity>(entity =>
        {
            entity.HasOne(m => m.Creator).WithMany(u => u.CreatedMovieInfos)
                .HasForeignKey(m => m.CreatedByUserId)
                .OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(m => m.Updater).WithMany(u => u.UpdatedMovieInfos)
                .HasForeignKey(m => m.UpdatedByUserId)
                .OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(m => m.Deleter).WithMany(u => u.DeletedMovieInfos)
                .HasForeignKey(m => m.DeletedByUserId)
                .OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(x => x.Manager).WithMany(u => u.ManagedMovieInfos)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<CinemaSurchargeInfosEntity>(entity =>
        {
            entity.HasOne(m => m.Creator).WithMany(u => u.CreatedCinemaSurchargeInfos).HasForeignKey(m => m.CreatedByUserId)
                .OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(m => m.Updater).WithMany(u => u.UpdatedCinemaSurchargeInfos).HasForeignKey(m => m.UpdatedByUserId)
                .OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(m => m.Deleter).WithMany(u => u.DeletedCinemaSurchargeInfos).HasForeignKey(m => m.DeletedByUserId)
                .OnDelete(DeleteBehavior.Restrict);
        });
        
        modelBuilder.Entity<MovieScheduleInfoEntity>(entity =>
        {
            entity.HasOne(m => m.Creator).WithMany(u => u.CreatedSchedules).HasForeignKey(m => m.CreatedByUserId)
                .OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(m => m.Updater).WithMany(u => u.UpdatedSchedules).HasForeignKey(m => m.UpdatedByUserId)
                .OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(m => m.Deleter).WithMany(u => u.DeletedSchedules).HasForeignKey(m => m.DeletedByUserId)
                .OnDelete(DeleteBehavior.Restrict);
        });
    }
}


