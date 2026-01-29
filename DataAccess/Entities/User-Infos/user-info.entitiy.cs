using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using DataAccess.Entities.Cinema_Infos;
using DataAccess.Entities.Movie_infos;
using DataAccess.Enums;
using Microsoft.EntityFrameworkCore;
// ReSharper disable All

namespace DataAccess.Entities.User_Info
{
    [Index(nameof(userEmail) , IsUnique = true)]
    public class user_info_entity
    {

        [Key]
        public Guid userId { get; set; } 
        
        [Column(TypeName = "varchar(100)")]
        [Required]
        public string userEmail { get; set; } = "";


        [Column(TypeName = "varchar(100)")]
        public string password { get; set; } = String.Empty;

        [Column(TypeName = "varchar(100)")]
        public string? refreshToken { get; set; } = null;
        
        [Column(TypeName = "varchar(50)")]
        public string? subId { get; set; } = null;
        
        [Required]
        public register_method_enum registerMethod { get; set; } 
        
        [Required]
        public account_status_enum accoutStatus { get; set; }

        public List<user_role_info_entity> user_role_info_entity { get; set; } = [];

        public user_profile_entity user_profile_entity { get; set; } = null!;
        
        // QL Rap
        
        public virtual ICollection<cinema_info_entity> createdCinemas { get; set; } = [];
        public virtual ICollection<cinema_info_entity> deletedCinemas { get; set; } = [];
        public virtual ICollection<cinema_info_entity> updatedCinemas { get; set; } = [];
        public virtual ICollection<cinema_info_entity> managedCinemas { get; set; } = [];
        
        // QL Phòng
        
        public virtual ICollection<auditorium_info_entity> createdAuditoriums { get; set; } = [];
        public virtual ICollection<auditorium_info_entity> deletedAuditoriums { get; set; } = [];
        public virtual ICollection<auditorium_info_entity> updatedAuditoriums { get; set; } = [];
        
        // QL Định dạng
        
        public virtual ICollection<movieFormatInfoEntity> createdMovieFormats { get; set; } = [];
        public virtual ICollection<movieFormatInfoEntity> deletedMovieFormats { get; set; } = [];
        public virtual ICollection<movieFormatInfoEntity> updatedMovieFormats { get; set; } = [];
        
        // Quản lý Trạng thái discount
        
        public virtual ICollection<cinema_discount_info_entity> createdCinemaDiscounts { get; set; } = [];
        
        public virtual ICollection<cinema_discount_info_entity> deletedCinemaDiscounts { get; set; } = [];
        
        public virtual ICollection<cinema_discount_info_entity> updatedCinemaDiscounts { get; set; } = [];
        
        // Quản lý trạng giảm giá
        
        public virtual ICollection<cinema_surcharge_infos_entity> createdCinemaSurchargeInfos { get; set; } = [];
        
        public virtual ICollection<cinema_surcharge_infos_entity> deleteCinemaSurchargeInfos { get; set; } = [];
        
        public virtual ICollection<cinema_surcharge_infos_entity> updatedCinemaSurchargeInfos { get; set; } = [];
        
        // Quanr lys phim
        
        public virtual ICollection<movieInfoEntity> createdMovieInfos { get; set; } = [];
        
        public virtual ICollection<movieInfoEntity> updatedMovieInfos { get; set; } = [];
        
        public virtual ICollection<movieInfoEntity> deletedMovieInfos { get; set; } = [];
        
        public virtual ICollection<movieInfoEntity> manageMovieInfos { get; set; } = [];
        
        // QL Lich Chieu
        
        public virtual ICollection<movie_schedule_info_entity> createdSchedules { get; set; } = [];
        
        public virtual ICollection<movie_schedule_info_entity> updatedSchedules { get; set; } = [];
        
        public virtual ICollection<movie_schedule_info_entity> deletedSchedules { get; set; } = [];
        
        // QL Order

        public virtual ICollection<order_info_entity> order_info_entity { get; set; } = [];
    }
}