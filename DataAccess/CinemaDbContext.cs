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
    
    public DbSet<DepartmentEntity> DepartmentEntity { get; set; }
    
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

    public DbSet<MovieCommentEntity> MovieCommentEntity { get; set; }

    public DbSet<MovieViewEntity> MovieViewEntity { get; set; }
    
    public DbSet<AuditoriumFormatInfos> AuditoriumFormatInfosEntity { get; set; }
    
    public DbSet<ScheduleJobLogger> BackGroundJobLoggerEntity { get; set; }

    public DbSet<OrderInfoEntity> OrderInfoEntity { get; set; }

    public DbSet<OrderDetailsInfo> OrderDetailsInfoEntity { get; set; }

    public DbSet<AuditLogEntity> AuditLogEntity { get; set; }
    
    public DbSet<UserVoucherEntity> UserVoucherEntity { get; set; }

    public DbSet<UserNotificationEntity> UserNotificationEntity { get; set; }

    public DbSet<UserGenreSurveyEntity> UserGenreSurveyEntity { get; set; }

    
   protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        var dateTimeConverter = new Microsoft.EntityFrameworkCore.Storage.ValueConversion.ValueConverter<DateTime, DateTime>(
            v => v.Kind == DateTimeKind.Utc ? v : DateTime.SpecifyKind(v, DateTimeKind.Utc),
            v => DateTime.SpecifyKind(v, DateTimeKind.Utc));

        var nullableDateTimeConverter = new Microsoft.EntityFrameworkCore.Storage.ValueConversion.ValueConverter<DateTime?, DateTime?>(
            v => !v.HasValue ? v : (v.Value.Kind == DateTimeKind.Utc ? v : DateTime.SpecifyKind(v.Value, DateTimeKind.Utc)),
            v => v.HasValue ? DateTime.SpecifyKind(v.Value, DateTimeKind.Utc) : null);

        foreach (var entityType in modelBuilder.Model.GetEntityTypes())
        {
            foreach (var property in entityType.GetProperties())
            {
                if (property.ClrType == typeof(DateTime))
                {
                    property.SetValueConverter(dateTimeConverter);
                }
                else if (property.ClrType == typeof(DateTime?))
                {
                    property.SetValueConverter(nullableDateTimeConverter);
                }
            }
        }
        
        // Status Management status

        StatusManagementRelationships.AddRelationshipsCinemaInfo(modelBuilder);

        modelBuilder.Entity<AuditLogEntity>(entity =>
        {
            entity.HasIndex(x => x.CreatedAt);
            entity.HasIndex(x => x.CinemaId);
            entity.HasIndex(x => new { x.EntityType, x.EntityId });
        });

        modelBuilder.Entity<MovieCommentEntity>(entity =>
        {
            entity.HasKey(x => x.CommentId);
            entity.HasIndex(x => new { x.MovieId, x.Status, x.CreatedAt });
            entity.HasIndex(x => new { x.UserId, x.MovieId, x.ParentCommentId });
            entity.HasIndex(x => x.ParentCommentId);

            entity.HasOne(x => x.MovieInfoEntity)
                .WithMany(x => x.MovieCommentEntities)
                .HasForeignKey(x => x.MovieId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(x => x.UserInfoEntity)
                .WithMany(x => x.MovieCommentEntities)
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(x => x.OrderInfoEntity)
                .WithMany()
                .HasForeignKey(x => x.OrderId)
                .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(x => x.ParentComment)
                .WithMany(x => x.Replies)
                .HasForeignKey(x => x.ParentCommentId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<MovieViewEntity>(entity =>
        {
            entity.HasKey(x => x.MovieViewId);
            entity.HasIndex(x => new { x.MovieId, x.ViewedAt });

            entity.HasOne(x => x.MovieInfoEntity)
                .WithMany(x => x.MovieViewEntities)
                .HasForeignKey(x => x.MovieId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<UserNotificationEntity>(entity =>
        {
            entity.HasKey(x => x.NotificationId);
            entity.HasIndex(x => new { x.UserId, x.IsRead, x.CreatedAt });

            entity.HasOne(x => x.UserInfoEntity)
                .WithMany(x => x.UserNotificationEntities)
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(x => x.RelatedComment)
                .WithMany()
                .HasForeignKey(x => x.RelatedCommentId)
                .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(x => x.RelatedMovie)
                .WithMany()
                .HasForeignKey(x => x.RelatedMovieId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<UserGenreSurveyEntity>(entity =>
        {
            entity.HasKey(x => x.SurveyId);
            entity.HasIndex(x => x.UserId).IsUnique(); // one survey per user

            entity.HasOne(x => x.UserInfoEntity)
                .WithMany()
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.Restrict);
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
        
        // Departments
        
        modelBuilder.Entity<DepartmentEntity>(entity =>
        {
            entity.ToTable("DepartmentEntity");

            entity.HasOne(d => d.CinemaInfoEntity)
                .WithMany(c => c.Departments)
                .HasForeignKey(d => d.CinemaId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(d => d.SharedUserInfoEntity)
                .WithOne()
                .HasForeignKey<DepartmentEntity>(d => d.SharedUserId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<StaffProfileEntity>(entity =>
        {
            entity.HasOne(s => s.DepartmentEntity)
                .WithMany()
                .HasForeignKey(s => s.DepartmentId)
                .OnDelete(DeleteBehavior.SetNull);
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



