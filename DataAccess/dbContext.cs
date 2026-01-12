using DataAccess.Constants;
using DataAccess.Entities.Cinema_Infos;
using DataAccess.Entities.User_Info;
using Microsoft.EntityFrameworkCore;

// ReSharper disable All


namespace DataAccess;

public class dbContext : DbContext
{
    private readonly user_identity_code_constant user_identity_code_constant;

    public dbContext(DbContextOptions<dbContext> options , user_identity_code_constant user_identity_code_constant) : base(options)
    {
        this.user_identity_code_constant = user_identity_code_constant;
    }
    
    public DbSet<user_info_entity> user_info_entity { get; set; }
    
    public DbSet<user_role_info_entity>  user_role_info_entity { get; set; }
    
    public DbSet<user_profile_entity>   user_profile_entity { get; set; }
    
    public DbSet<role_list_info_entity> role_list_info_entity { get; set; }
    
    public DbSet<auditorium_info_entity>   auditorium_info_entity { get; set; }
    
    public DbSet<cinema_info_entity>  cinema_info_entity { get; set; }
    
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
        
        modelBuilder.Entity<user_info_entity>()
            .HasOne(u => u.user_profile_entity)
            .WithOne(p => p.user_info_entity)
            .HasForeignKey<user_profile_entity>(p => p.userID);
        
            modelBuilder.Entity<role_list_info_entity>().HasData(
                new role_list_info_entity() { roleId = userRoles.Customer, roleName = "Customer" },
                new role_list_info_entity() { roleId = userRoles.Cashier, roleName = "Cashier" },
                new role_list_info_entity() { roleId = userRoles.Admin, roleName = "Admin" },
                new role_list_info_entity() { roleId = userRoles.MovieManager, roleName = "MovieManager" },
                new role_list_info_entity() { roleId = userRoles.TheaterManager, roleName = "TheaterManager" },
                new role_list_info_entity() { roleId = userRoles.FacilitiesManager, roleName = "FacilitiesManager" }
            );
            
            // Seed Data for UserInformation
            var Cashier = "a1b2c3d4-e5f6-7a8b-c9d0-e1f2a3b4c5d6";
            var MovieManagerId = "b2c3d4e5-f6a7-8b9c-d0e1-f2a3b4c5d6e7";

            // Đây là ngời có Role là QL rap
            string AdminId = "e4e1f7d8-c3b2-4a90-8c67-2f5a1b3d9e0c";
            string UserTheaterManagerId = "7b5d2c1e-9f8a-3e7b-c1d2-a0e9f8c7b6a5";
            string UserFacilitiesManagerId = "f1a0e9b8-d7c6-5e4f-a3b2-1d0c9b8a7f6e";
            
            modelBuilder.Entity<user_info_entity>().HasData(
                new user_info_entity
                {
                    userId = Guid.Parse(MovieManagerId),
                    userEmail = "user@example.com",
                    password = "$2a$12$ADqBiSquthm1g7bLZvg6UulJ5QJFQQ6olUQzf66AQfJDGbQ2W1wlG",
                    refreshToken = null,
                    subId = null
                },
                new user_info_entity
                {
                    userId = Guid.Parse(AdminId),
                    userEmail = "admin@example.com",
                    password = "$2a$12$91JfhncA5t3ssFtiaoKjSOrbMj7zON.wtL/n3cjme/wvK2kDCgZ7K",
                    refreshToken = null,
                    subId = null
                },
                new user_info_entity
                {
                    userId = Guid.Parse(UserTheaterManagerId),
                    userEmail = "theater@example.com",
                    password = "$2a$12$FeLXQjfW3gfNFfELxTJS3.gH8o9Y2CB5WSGcDZxKMrPEJiR2RcxIS",
                    refreshToken = null,
                    subId = null
                },
                new user_info_entity
                {
                    userId = Guid.Parse(UserFacilitiesManagerId),
                    userEmail = "facilities@example.com",
                    password = "$2a$12$CkugZHMrWhxG0h6hUqOAf.fX9QQFkLnfnLlI.xWCNZ1y/PivtfN2O",
                    refreshToken = null,
                    subId = null
                },
                // BỔ SUNG DÒNG NÀY ĐỂ HẾT LỖI FK
                new user_info_entity
                {
                    userId = Guid.Parse(Cashier),
                    userEmail = "cashier@example.com",
                    password = "$2a$12$CkugZHMrWhxG0h6hUqOAf.fX9QQFkLnfnLlI.xWCNZ1y/PivtfN2O",
                    refreshToken = null,
                    subId = null
                }
            );

            modelBuilder.Entity<user_profile_entity>().HasData(new List<user_profile_entity>()
            {
                // 1. Profile cho Người dùng thông thường (MovieManagerId)
                new user_profile_entity
                {
                    userID = Guid.Parse(MovieManagerId),
                    dateOfBirth = new DateTime(2005, 10, 10),
                    identityCode = user_identity_code_constant.getUserIdentityCode()[0],
                    phoneNumber = "0123456789",
                    userName = "Movie Manager 1"
                },
                new user_profile_entity
                {
                    userID = Guid.Parse(AdminId),
                    dateOfBirth = new DateTime(1985, 01, 01),
                    identityCode = user_identity_code_constant.getUserIdentityCode()[1],
                    phoneNumber = "0988123456",
                    userName = "Admin"
                },
                new user_profile_entity
                {
                    userID = Guid.Parse(UserTheaterManagerId),
                    dateOfBirth = new DateTime(1990, 05, 15),
                    identityCode = user_identity_code_constant.getUserIdentityCode()[2],
                    phoneNumber = "0977234567",
                    userName = "Theater Manager"
                },
                new user_profile_entity
                {
                    userID = Guid.Parse(UserFacilitiesManagerId),
                    dateOfBirth = new DateTime(1992, 08, 20),
                    identityCode = user_identity_code_constant.getUserIdentityCode()[3],
                    phoneNumber = "0966345678",
                    userName = "Facilities Manager"
                },
                // 5. Profile bổ sung cho Cashier
                new user_profile_entity
                {
                    userID = Guid.Parse(Cashier),
                    dateOfBirth = new DateTime(1995, 12, 12),
                    identityCode = user_identity_code_constant.getUserIdentityCode()[4],
                    phoneNumber = "0944456789",
                    userName = "Cashier"
                }
            });
            
            modelBuilder.Entity<user_role_info_entity>().HasData(
                // 1. Admin - Quyền Admin
                new user_role_info_entity 
                { 
                    userId = Guid.Parse(AdminId), 
                    roleId = userRoles.Admin 
                },

                // 2. MovieManager - Quyền MovieManager
                new user_role_info_entity 
                { 
                    userId = Guid.Parse(MovieManagerId), 
                    roleId = userRoles.MovieManager 
                },

                // 3. Theater Manager - Quyền TheaterManager
                new user_role_info_entity 
                { 
                    userId = Guid.Parse(UserTheaterManagerId), 
                    roleId = userRoles.TheaterManager 
                },

                // 4. Facilities Manager - Quyền FacilitiesManager
                new user_role_info_entity 
                { 
                    userId = Guid.Parse(UserFacilitiesManagerId), 
                    roleId = userRoles.FacilitiesManager 
                },

                // 5. Cashier - Quyền Cashier
                new user_role_info_entity 
                { 
                    userId = Guid.Parse(Cashier), 
                    roleId = userRoles.Cashier 
                }
            );
            
            // User Profiles Entities

            modelBuilder.Entity<user_profile_entity>().HasIndex(x => x.phoneNumber)
                .IsUnique();

            modelBuilder.Entity<user_profile_entity>().HasIndex(x => x.identityCode)
                .IsUnique();
            
            // User Entites
        
        modelBuilder.Entity<user_info_entity>().HasIndex(x => x.refreshToken).IsUnique();

        modelBuilder.Entity<user_info_entity>().HasIndex(x => x.userEmail).IsUnique();
        
        // auditorium_info_entity
        
        modelBuilder.Entity<auditorium_info_entity>()
            .HasIndex(a => new { a.auditoriumNumber, a.cinemaId })
            .HasFilter("[isDeleted] = CAST(0 AS BIT)")
            .IsUnique();
        
        modelBuilder.Entity<auditorium_info_entity>().HasOne(x => x.cinema_info_entity)
            .WithMany(x => x.auditorium_info_entity)
            .HasForeignKey(x => x.cinemaId).OnDelete(DeleteBehavior.Restrict);
        
        // Cinema_Info_Entity
        
        modelBuilder.Entity<cinema_info_entity>()
            .HasIndex(a => new { a.cinemaName })
            .HasFilter("[isDeleted] = CAST(0 AS BIT)")
            .IsUnique();

        modelBuilder.Entity<cinema_info_entity>().HasIndex(a => new { a.cinemaHotLineNumber })
            .IsUnique();
        
        // Roles_entity

        modelBuilder.Entity<role_list_info_entity>().HasIndex(x => x.roleName).IsUnique();
    }
}