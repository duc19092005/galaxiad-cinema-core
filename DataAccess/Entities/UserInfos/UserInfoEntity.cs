using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using DataAccess.Entities.CinemaInfos;
using DataAccess.Entities.MovieInfos;
using Shared.Enums;
using Microsoft.EntityFrameworkCore;
// ReSharper disable All

namespace DataAccess.Entities.UserInfos
{
    [Index(nameof(UserEmail) , IsUnique = true)]
    public class UserInfoEntity
    {

        [Key]
        public Guid UserId { get; set; } 
        
        [Column(TypeName = "varchar(100)")]
        [Required]
        public string UserEmail { get; set; } = "";


        [Column(TypeName = "varchar(100)")]
        public string Password { get; set; } = String.Empty;

        [Column(TypeName = "varchar(100)")]
        public string? RefreshToken { get; set; } = null;
        
        [Column(TypeName = "varchar(50)")]
        public string? SubId { get; set; } = null;
        
        [Required]
        public RegisterMethodEnum RegisterMethod { get; set; } 
        
        [Required]
        public AccountStatusEnum AccountStatus { get; set; }

        public List<UserRoleInfoEntity> UserRoleInfoEntity { get; set; } = [];

        public UserProfileEntity UserProfileEntity { get; set; } = null!;
        
        // QL Rap
        
        public virtual ICollection<CinemaInfoEntity> CreatedCinemas { get; set; } = [];
        public virtual ICollection<CinemaInfoEntity> DeletedCinemas { get; set; } = [];
        public virtual ICollection<CinemaInfoEntity> UpdatedCinemas { get; set; } = [];
        public virtual ICollection<CinemaInfoEntity> ManagedCinemas { get; set; } = [];
        
        // QL Phòng
        
        public virtual ICollection<AuditoriumInfoEntities> CreatedAuditoriums { get; set; } = [];
        public virtual ICollection<AuditoriumInfoEntities> DeletedAuditoriums { get; set; } = [];
        public virtual ICollection<AuditoriumInfoEntities> UpdatedAuditoriums { get; set; } = [];
        
        // QL Định dạng
        
        public virtual ICollection<MovieFormatInfoEntity> CreatedMovieFormats { get; set; } = [];
        public virtual ICollection<MovieFormatInfoEntity> DeletedMovieFormats { get; set; } = [];
        public virtual ICollection<MovieFormatInfoEntity> UpdatedMovieFormats { get; set; } = [];
        
        // Quản lý Trạng thái discount
        
        public virtual ICollection<CinemaDiscountInfoEntity> CreatedCinemaDiscounts { get; set; } = [];
        
        public virtual ICollection<CinemaDiscountInfoEntity> DeletedCinemaDiscounts { get; set; } = [];
        
        public virtual ICollection<CinemaDiscountInfoEntity> UpdatedCinemaDiscounts { get; set; } = [];
        
        // Quản lý trạng giảm giá
        
        public virtual ICollection<CinemaSurchargeInfosEntity> CreatedCinemaSurchargeInfos { get; set; } = [];
        
        public virtual ICollection<CinemaSurchargeInfosEntity> DeletedCinemaSurchargeInfos { get; set; } = [];
        
        public virtual ICollection<CinemaSurchargeInfosEntity> UpdatedCinemaSurchargeInfos { get; set; } = [];
        
        // Quanr lys phim
        
        public virtual ICollection<MovieInfoEntity> CreatedMovieInfos { get; set; } = [];
        
        public virtual ICollection<MovieInfoEntity> UpdatedMovieInfos { get; set; } = [];
        
        public virtual ICollection<MovieInfoEntity> DeletedMovieInfos { get; set; } = [];
        
        public virtual ICollection<MovieInfoEntity> ManagedMovieInfos { get; set; } = [];
        
        // QL Lich Chieu
        
        public virtual ICollection<MovieScheduleInfoEntity> CreatedSchedules { get; set; } = [];
        
        public virtual ICollection<MovieScheduleInfoEntity> UpdatedSchedules { get; set; } = [];
        
        public virtual ICollection<MovieScheduleInfoEntity> DeletedSchedules { get; set; } = [];
        
        // QL Order

        public virtual ICollection<OrderInfoEntity> OrderInfoEntity { get; set; } = [];
    }
}



