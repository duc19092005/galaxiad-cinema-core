using BusinessLayer.Constants;
using BusinessLayer.Entities.AuditLogs;
using BusinessLayer.Entities.CinemaInfos;
using BusinessLayer.Entities.MovieInfos;
using BusinessLayer.Entities.ScheduleJob;
using BusinessLayer.Entities.UserInfos;
using BusinessLayer.Entities.Vouchers;
using DataAccess.RelationshipKeys.MovieInfos;
using DataAccess.SeedData;
using DataAccess.RelationshipKeys.Facilities;
using DataAccess.RelationshipKeys.IdentityAccess;
using DataAccess.RelationshipKeys.Promotions;
using DataAccess.RelationshipKeys.Common;
using DataAccess.RelationshipKeys.UserInfos;
using Microsoft.EntityFrameworkCore;

// ReSharper disable All


namespace DataAccess;

public class CinemaDbContext : DbContext
{
    private readonly UserIdentityCodeConstant user_identity_code_constant;

    public CinemaDbContext(DbContextOptions<CinemaDbContext> options , UserIdentityCodeConstant user_identity_code_constant) : base(options)
    {
        this.user_identity_code_constant = user_identity_code_constant;
    }
    
    public DbSet<UserInfoEntity> UserInfoEntity { get; set; }
    
    public DbSet<UserRoleInfoEntity>  UserRoleInfoEntity { get; set; }
    
    public DbSet<RoleListInfoEntity> RoleListInfoEntity { get; set; }
    
    // Permission & RBAC
    
    public DbSet<PermissionEntity> PermissionEntity { get; set; }
    
    public DbSet<PermissionForRoleEntity> PermissionForRoleEntity { get; set; }
    
    // Staff & Payroll
    
    public DbSet<StaffProfileEntity> StaffProfileEntity { get; set; }
    
    public DbSet<StaffWorkingLoggerEntity> StaffWorkingLoggerEntity { get; set; }
    
    public DbSet<StaffSalaryTotalLoggerEntity> StaffSalaryTotalLoggerEntity { get; set; }
    
    public DbSet<CustomerProfileEntity> CustomerProfileEntity { get; set; }
    
    // Shift Management
    
    public DbSet<CinemaShiftTemplateEntity> CinemaShiftTemplateEntity { get; set; }
    
    public DbSet<StaffShiftRegistrationEntity> StaffShiftRegistrationEntity { get; set; }
    
    public DbSet<CashierDepartmentEntity> CashierDepartmentEntity { get; set; }
    
    public DbSet<AuditoriumInfoEntities>   AuditoriumInfoEntities { get; set; }
    
    public DbSet<CinemaInfoEntity>  CinemaInfoEntity { get; set; }
    
    public DbSet<MovieFormatInfoEntity>  MovieFormatInfoEntity { get; set; }
    
    public DbSet<SeatsInfoEntity> SeatsInfoEntity { get; set; }
    
    public DbSet<UserSegmentsInfoEntity> UserSegmentsInfoEntity { get; set; }
    
    // Movie Infos
    
    public DbSet<MovieInfoEntity> MovieInfoEntity { get; set; }
    
    public DbSet<MovieGenreMovieInfoEntity> MovieGenreMovieInfoEntity { get; set; }
    
    public DbSet<MovieGenreInfoEntity> MovieGenreInfoEntity { get; set; }
    
    public DbSet<movieFormatMovieInfoEntity> MovieFormatMovieInfoEntity { get; set; }
    
    public DbSet<movieRequiredAgeEntity> MovieRequiredAgeEntity { get; set; }
    
    public DbSet<MovieScheduleInfoEntity> MovieScheduleInfoEntity { get; set; }

    public DbSet<MovieCinemaEntity> MovieCinemaEntities { get; set; }
    
    public DbSet<AuditoriumFormatInfos> AuditoriumFormatInfosEntity { get; set; }
    
    public DbSet<ScheduleJobLogger> BackGroundJobLoggerEntity { get; set; }

    public DbSet<OrderInfoEntity> OrderInfoEntity { get; set; }

    public DbSet<OrderDetailsInfo> OrderDetailsInfoEntity { get; set; }

    public DbSet<AuditLogEntity> AuditLogEntity { get; set; }
    
    public DbSet<UserVoucherEntity> UserVoucherEntity { get; set; }

    
   protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        
        // Status Management status

        StatusManagementRelationships.AddRelationshipsCinemaInfo(modelBuilder);

        modelBuilder.Entity<AuditLogEntity>(entity =>
        {
            entity.HasIndex(x => x.CreatedAt);
            entity.HasIndex(x => x.CinemaId);
            entity.HasIndex(x => new { x.EntityType, x.EntityId });
        });
        
        // User Infos 
        
        UserInfoRelationshipsKeys.AddUserInfoKeys(modelBuilder);
        
        // Staff Profile (1-1 with User)
        
        modelBuilder.Entity<StaffProfileEntity>(entity =>
        {
            entity.HasOne(s => s.UserInfoEntity)
                .WithOne(u => u.StaffProfileEntity)
                .HasForeignKey<StaffProfileEntity>(s => s.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(s => s.CinemaInfoEntity)
                .WithMany()
                .HasForeignKey(s => s.CinemaId)
                .OnDelete(DeleteBehavior.Restrict);
        });
        
        // Customer Profile (1-1 with User)
        
        modelBuilder.Entity<CustomerProfileEntity>(entity =>
        {
            entity.HasOne(c => c.UserInfoEntity)
                .WithOne(u => u.CustomerProfileEntity)
                .HasForeignKey<CustomerProfileEntity>(c => c.UserId)
                .OnDelete(DeleteBehavior.Restrict);
        });
        
        // Staff Working Logger
        
        modelBuilder.Entity<StaffWorkingLoggerEntity>(entity =>
        {
            entity.HasIndex(e => new { e.StaffId, e.StartedShiftTime }).IsUnique();
        });
        
        // Shift Templates
        
        modelBuilder.Entity<CinemaShiftTemplateEntity>(entity =>
        {
            entity.HasOne(t => t.CinemaInfoEntity)
                .WithMany()
                .HasForeignKey(t => t.CinemaId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(t => t.RoleListInfoEntity)
                .WithMany()
                .HasForeignKey(t => t.RoleId)
                .OnDelete(DeleteBehavior.Restrict);
        });
        
        // Shift Registration (Staff <-> Template)
        
        modelBuilder.Entity<StaffShiftRegistrationEntity>(entity =>
        {
            entity.HasIndex(e => new { e.StaffId, e.ShiftTemplateId, e.RegistrationDate }).IsUnique();
            
            entity.HasOne(r => r.ApprovedByUser)
                .WithMany()
                .HasForeignKey(r => r.ApprovedByUserId)
                .OnDelete(DeleteBehavior.Restrict);
        });
        
        // Salary Total Logger
        
        modelBuilder.Entity<StaffSalaryTotalLoggerEntity>(entity =>
        {
            entity.HasOne(s => s.PaidByUser)
                .WithMany()
                .HasForeignKey(s => s.PaidByUserId)
                .OnDelete(DeleteBehavior.Restrict);
        });
        
        // Cashier Department
        
        modelBuilder.Entity<CashierDepartmentEntity>(entity =>
        {
            entity.HasOne(d => d.CinemaInfoEntity)
                .WithMany(c => c.CashierDepartments)
                .HasForeignKey(d => d.CinemaId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(d => d.SharedUserInfoEntity)
                .WithOne()
                .HasForeignKey<CashierDepartmentEntity>(d => d.SharedUserId)
                .OnDelete(DeleteBehavior.Restrict);
        });
        
        // AuditoriumInfoEntities
        
        AuditoriumInfoRelationshipsKeys.AddAuditoriumInfoRelationships(modelBuilder);
        AuditoriumInfoRelationshipsKeys.AddAuditoriumInfoKeys(modelBuilder);
        
        // CinemaInfoEntity
        
        CinemaInfoRelationshipsKeys.AddCinemaInfoKeys(modelBuilder);
        CinemaInfoRelationshipsKeys.AddCinemaInfoRelationships(modelBuilder);
        
        // Roles_entity
        
        RoleListsRelationshipsKeys.AddRoleListsKeys(modelBuilder);
        RoleListsRelationshipsKeys.AddRoleListsRelationships(modelBuilder);
        
        // Cinemas Discounts 
        
        CinemaDiscountsRelationshipsKeys.AddCinemaDiscountsKeys(modelBuilder);
        CinemaDiscountsRelationshipsKeys.AddCinemaDiscountsRelationships(modelBuilder);
        
        
        // User Segments
        
        UserSegmentsInfoRelationshipsKeys.AddUserSegmentsInfoRelationships(modelBuilder);
        UserSegmentsInfoRelationshipsKeys.AddUserSegmentsInfoKeys(modelBuilder);
        SeedDataUserSegmentsInfos.AddUserSegments(modelBuilder);
        
        // Vouchers
        
        VoucherInfoRelationshipsKeys.AddVoucherInfoKeys(modelBuilder);
        VoucherInfoRelationshipsKeys.AddVoucherInfoRelationships(modelBuilder);
        VoucherInfoRelationshipsKeys.AddUserVoucherRelationships(modelBuilder);
        
        // Cinema Surcharge info 
        
        CinemaSurchargeInfoRelationshipsKeys.AddCinemaSurchargeInfoKeys(modelBuilder);
        CinemaSurchargeInfoRelationshipsKeys.AddCinemaSurchargeInfoRelationships(modelBuilder);
        
        // Movies Infos
        
        MovieInfoRelationshipsKeys.AddMovieInfoKeys(modelBuilder);
        MovieInfoRelationshipsKeys.AddMovieInfoRelationships(modelBuilder);
        
        // Genres
        
        MovieGenreInfoRelationshipsKeys.AddMovieGenreInfoRelationships(modelBuilder);
        MovieGenreInfoRelationshipsKeys.AddMovieGenreInfoKeys(modelBuilder);
        
        // Movie infos - genre
        
        MovieGenreMovieInfoRelationshipsKeys.AddMovieGenreMovieInfoKeys(modelBuilder);
        MovieGenreMovieInfoRelationshipsKeys.AddMovieGenreMovieInfoRelationships(modelBuilder);
        
        // Movie Infos - Formats
        
        MovieFormatMovieInfoRelationshipsKeys.AddMovieFormatMovieInfoKeys(modelBuilder);
        MovieFormatMovieInfoRelationshipsKeys.AddMovieFormatMovieInfoRelationships(modelBuilder);
        
        // Required age
        
        MovieRequiredAgeInfoRelationshipsKeys.AddMovieRequiredAgeInfoRelationships(modelBuilder);
        MovieRequiredAgeInfoRelationshipsKeys.AddMovieRequiredAgeInfoKeys(modelBuilder);
        
        // Order Infos
        
        OrderInfoRelationshipsKeys.AddOrderInfoRelationships(modelBuilder);
        OrderInfoRelationshipsKeys.AddOrderInfoKeys(modelBuilder);
        
        // Movie Schedules
        
        MovieSheduleInfoRelationshipsKeys.AddMovieSheduleInfoKeys(modelBuilder);
        MovieSheduleInfoRelationshipsKeys.AddMovieSheduleInfoRelationships(modelBuilder);
        
        // Order details Infos
        
        OrderDetailsInfoRelationshipsKeys.AddOrderDetailsInfoRelationships(modelBuilder);
        OrderDetailsInfoRelationshipsKeys.AddOrderDetailsInfoKeys(modelBuilder);
        
        // Seeds datas for role lists
        
        SeedDataRoleLists.AddRoleListsSeedData(modelBuilder);
        
        // Seeds data for user infos - profiles - roles
        
        SeedDataUserInfos.AddUserInfos(modelBuilder , user_identity_code_constant);
        
        // Seeds data for movie format
        
        SeedDataMovieFormat.AddMovieFormatSeedData(modelBuilder);
        
        // Seed Genres 
        
        MovieGenresSeedData.AddMovieGenreSeedData(modelBuilder);
        
        // Seeds ages
        
        MovieRequiredAgeSeedData.AddMovieAgeSeedData(modelBuilder);

        // Seeds Cinema, Auditorium, Seats, Movie, Schedule (For Booking Flow)
        CinemaAndMovieSeedData.AddSeedData(modelBuilder);
        
        // Seeds Cinema Surcharges for User Segments
        CinemaSurchargeSeedData.AddCinemaSurchargeSeedData(modelBuilder);
        
        // Seeds Permissions & PermissionForRole
        PermissionsSeedData.AddPermissionsSeedData(modelBuilder);

        // Seeds Vouchers
        VoucherSeedData.AddVoucherSeedData(modelBuilder);
    }
    
}



