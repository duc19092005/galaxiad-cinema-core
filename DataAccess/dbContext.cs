using DataAccess.Entities.Cinema_Infos;
using DataAccess.Entities.User_Info;
using Microsoft.EntityFrameworkCore;

// ReSharper disable All


namespace DataAccess;

public class dbContext : DbContext
{
    public dbContext()
    {
        
    }
    public dbContext(DbContextOptions<dbContext> options) : base(options)
    {
        
    }
    
    public DbSet<user_info_entity> user_info_entity { get; set; }
    
    public DbSet<user_role_info_entity>  user_role_info_entity { get; set; }
    
    public DbSet<user_profile_entity>   user_profile_entity { get; set; }
    
    public DbSet<role_list_info_entity> role_list_info_entity { get; set; }
    
    public DbSet<auditorium_info_entity>   auditorium_info_entity { get; set; }
    
    public DbSet<cinema_info_entity>   cinema_info_entity { get; set; }
    
    public DbSet<movie_format_info_entity>  movie_format_info_entity { get; set; }
    
    public DbSet<seats_info_entity> seats_info_entity { get; set; }
    
   protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

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

        modelBuilder.Entity<seats_info_entity>(entity => {
            entity.HasOne(s => s.creator).WithMany(u => u.createdSeats).HasForeignKey(s => s.createdByUserId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(s => s.updater).WithMany(u => u.updatedSeats).HasForeignKey(s => s.updatedByUserId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(s => s.deleter).WithMany(u => u.deletedSeats).HasForeignKey(s => s.deletedByUserId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<movie_format_info_entity>(entity => {
            entity.HasOne(m => m.creator).WithMany(u => u.createdMovieFormats).HasForeignKey(m => m.createdByUserId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(m => m.updater).WithMany(u => u.updatedMovieFormats).HasForeignKey(m => m.updatedByUserId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(m => m.deleter).WithMany(u => u.deletedMovieFormats).HasForeignKey(m => m.deletedByUserId).OnDelete(DeleteBehavior.Restrict);
        });
    }
}