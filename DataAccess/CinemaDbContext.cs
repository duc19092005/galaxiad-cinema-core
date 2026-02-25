using DataAccess.Constants;
using DataAccess.Entities.CinemaInfos;
using DataAccess.Entities.MovieInfos;
using DataAccess.Entities.UserInfos;
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
    
    public DbSet<UserProfileEntity>   UserProfileEntity { get; set; }
    
    public DbSet<RoleListInfoEntity> RoleListInfoEntity { get; set; }
    
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
    
   protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        
        // Status Management status

        StatusManagementRelationships.AddRelationshipsCinemaInfo(modelBuilder);
        
        // User Infos 
        
        UserInfoRelationshipsKeys.AddUserInfoKeys(modelBuilder);
        UserInfoRelationshipsKeys.AddUserInfoRelationships(modelBuilder);
        
        // User Profiles Entities

        UserProfileRelationshipsKeys.AddUserProfileRelationships(modelBuilder);
        UserProfileRelationshipsKeys.AddUserProfileKeys(modelBuilder);
        
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
    }
}



