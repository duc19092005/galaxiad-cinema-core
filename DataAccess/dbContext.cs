using DataAccess.Constants;
using DataAccess.Entities.Cinema_Infos;
using DataAccess.Entities.Movie_infos;
using DataAccess.Entities.Movies_Infos;
using DataAccess.Entities.User_Info;
using DataAccess.SeedsData;
using DataAccess.status_management_relationships_keys;
using DataAccess.status_management_relationships_keys.movie_infos;
using DataAccess.status_management_relationships_keys.user_infos;
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
    
    public DbSet<user_segments_info_entity> user_segments_info_entity { get; set; }
    
   protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        
        // Status Management status

        status_management_relationships.add_relationships_cinema_info(modelBuilder);
        
        // User Infos 
        
        user_info_relationships_keys.add_user_info_keys(modelBuilder);
        user_info_relationships_keys.add_user_info_relationships(modelBuilder);
        
        // User Profiles Entities

        user_profile_relationships_keys.add_user_profile_relationships(modelBuilder);
        user_profile_relationships_keys.add_user_info_keys(modelBuilder);
        
        // auditorium_info_entity
        
        auditorium_info_relationships_keys.add_auditorium_info_relationships(modelBuilder);
        auditorium_info_relationships_keys.add_auditorium_info_keys(modelBuilder);
        
        // Cinema_Info_Entity
        
        cinema_info_relationship_keys.add_cinema_info_keys(modelBuilder);
        cinema_info_relationship_keys.add_cinema_info_relationships(modelBuilder);
        
        // Roles_entity
        
        role_lists_relationships_keys.add_role_lists_keys(modelBuilder);
        role_lists_relationships_keys.add_role_lists_relationships(modelBuilder);
        
        // Cinemas Discounts 
        
        cinema_discounts_relationships_keys.add_cinema_discounts_keys(modelBuilder);
        cinema_discounts_relationships_keys.add_cinema_discounts_relationships(modelBuilder);
       
        // Seeds datas for role lists
        
        seedDataRoleLists.AddRoleListsSeedData(modelBuilder);
        
        // Seeds data for user infos - profiles - roles
        
        seedDataUserInfos.AddUserInfos(modelBuilder , user_identity_code_constant);
        
        // Seeds data for movie format
        
        seedDataMovieFormat.AddMovieFormatSeedData(modelBuilder);
        
        // User Segments
        
        user_segments_info_relationships_keys.add_user_segments_info_relationships(modelBuilder);
        user_segments_info_relationships_keys.add_user_segments_info_keys(modelBuilder);
        seedDataUserSegmentsInfos.AddUserSegments(modelBuilder);
        
        // Vouchers
        
        voucher_info_relationships_keys.add_voucher_info_keys(modelBuilder);
        voucher_info_relationships_keys.add_voucher_info_relationships(modelBuilder);
        
        // Cinema Surcharge info 
        
        cinema_surcharge_info_relationships_keys.add_cinema_surcharge_info_keys(modelBuilder);
        cinema_surcharge_info_relationships_keys.add_cinema_surcharge_info_relationships(modelBuilder);
        
        // Movies Infos
        
        movie_info_relationships_keys.add_movie_info_keys(modelBuilder);
        movie_info_relationships_keys.add_movie_info_relationships(modelBuilder);
        
        // Genres
        
        movie_genre_info_relationships_keys.add_movie_genre_info_relationships(modelBuilder);
        movie_genre_info_relationships_keys.add_movie_genre_info_keys(modelBuilder);
        
        // Movie infos - genre
        
        movie_genre_movie_info_relationships_keys.movie_genre_movie_info_keys(modelBuilder);
        movie_genre_movie_info_relationships_keys.movie_genre_movie_info_relationships(modelBuilder);
        
        // Required age
        
        movie_required_age_info_relationships_keys.add_movie_required_age_info_relationships(modelBuilder);
        movie_required_age_info_relationships_keys.add_movie_required_age_info_keys(modelBuilder);
        
        // Order Infos
        
        order_info_relationships_keys.add_order_info_relationships(modelBuilder);
        order_info_relationships_keys.add_order_info_keys(modelBuilder);
        
        // Movie Schedules
        
        movie_shedule_info_relationships_keys.add_movie_shedule_info_keys(modelBuilder);
        movie_shedule_info_relationships_keys.add_movie_shedule_info_relationships(modelBuilder);
        
        // Order details Infos
        
        order_details_info_relationships_keys.add_order_details_info_relationships(modelBuilder);
        order_details_info_relationships_keys.add_order_details_info_keys(modelBuilder);
    }
}