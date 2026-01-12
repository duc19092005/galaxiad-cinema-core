using DataAccess.Constants;
using DataAccess.Entities.Cinema_Infos;
using DataAccess.Entities.User_Info;
using DataAccess.SeedsData;
using DataAccess.status_management_relationships_keys;
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
        
        role_lists_seed_data.add_role_lists_seed_data(modelBuilder);
        
        // Seeds data for user infos - profiles - roles
        
        user_info_seed_data.add_user_info_seed_data(modelBuilder , user_identity_code_constant);
        
        // Seeds data for movie format
        
        movie_format_seed_data.add_movie_format_seed_data(modelBuilder);
        
        // User Segments
        
        user_segments_info_relationships_keys.add_user_segments_info_relationships(modelBuilder);
        user_segments_info_relationships_keys.add_user_segments_info_keys(modelBuilder);
        user_segments_info_seed_data.add_user_segments_seed_data(modelBuilder);
        
        // Vouchers
        
        voucher_info_relationships_keys.add_voucher_info_keys(modelBuilder);
        voucher_info_relationships_keys.add_voucher_info_relationships(modelBuilder);
    }
}