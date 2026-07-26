using Cinema.Domain.Entities.Cleaning;
using Microsoft.EntityFrameworkCore;

namespace Cinema.Infrastructure.Persistence.RelationshipKeys.Cleaning;

public static class CleaningRelationships
{
    public static void AddCleaningRelationships(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<CleaningTaskEntity>(entity =>
        {
            entity.HasKey(x => x.CleaningTaskId);

            // Index chinh phuc vu bang cong viec cua quan ly va cua nhan vien
            entity.HasIndex(x => new { x.CinemaId, x.Status, x.ScheduledAt });
            entity.HasIndex(x => new { x.AssignedStaffId, x.Status });
            entity.HasIndex(x => new { x.AuditoriumId, x.ScheduledAt });

            // Moi suat chieu chi sinh dung mot task PostShowtime.
            // Filter cho phep nhieu task Routine khong gan suat chieu cung ton tai.
            entity.HasIndex(x => x.MovieScheduleId)
                .IsUnique()
                .HasFilter("[MovieScheduleId] IS NOT NULL");

            entity.Property(x => x.Status).HasConversion<int>();
            entity.Property(x => x.TaskType).HasConversion<int>();

            entity.HasOne(x => x.CinemaInfoEntity)
                .WithMany(c => c.CleaningTasks)
                .HasForeignKey(x => x.CinemaId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(x => x.AuditoriumInfoEntities)
                .WithMany()
                .HasForeignKey(x => x.AuditoriumId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(x => x.MovieScheduleInfoEntity)
                .WithMany()
                .HasForeignKey(x => x.MovieScheduleId)
                .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(x => x.CinemaShiftScheduleEntity)
                .WithMany()
                .HasForeignKey(x => x.ShiftScheduleId)
                .OnDelete(DeleteBehavior.SetNull);

            // SetNull de khi nhan vien nghi viec, task van con lai lam du lieu lich su
            entity.HasOne(x => x.AssignedStaff)
                .WithMany()
                .HasForeignKey(x => x.AssignedStaffId)
                .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(x => x.VerifiedByUser)
                .WithMany()
                .HasForeignKey(x => x.VerifiedByUserId)
                .OnDelete(DeleteBehavior.SetNull);
        });
    }
}
