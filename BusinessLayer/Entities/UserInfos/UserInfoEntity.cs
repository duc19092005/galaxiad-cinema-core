using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Runtime.CompilerServices;
using BusinessLayer.Entities.CinemaInfos;
using BusinessLayer.Entities.MovieInfos;
using BusinessLayer.Entities.Vouchers;
using Shared.Enums;
using Microsoft.EntityFrameworkCore;
// ReSharper disable All

namespace BusinessLayer.Entities.UserInfos
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

        [Column(TypeName = "varchar(500)")]
        public string? RefreshToken { get; set; } = null;
        
        [Column(TypeName = "varchar(50)")]
        public string? SubId { get; set; } = null;
        
        [Required]
        public RegisterMethodEnum RegisterMethod { get; set; } 
        
        [Required]
        public AccountStatusEnum AccountStatus { get; set; }
        
        public string? LockoutReason { get; set; }

        // Personal Info (merged from UserProfileEntity)
        
        [Column(TypeName = "nvarchar(100)")]
        [Required]
        public string UserName { get; set; } = null!;
        
        [Column(TypeName = "varchar(200)")]
        [Required]
        public string IdentityCode { get; set; } = null!;

        public DateTime DateOfBirth { get; set; }

        [Column(TypeName = "char(10)")] 
        public string PhoneNumber { get; set; } = null!;

        [Column(TypeName = "varchar(2048)")]
        public string? PortraitImageUrl { get; set; }

        public List<UserRoleInfoEntity> UserRoleInfoEntity { get; set; } = [];
        
        public long RewardPoints { get; set; } = 0;
        public virtual ICollection<UserVoucherEntity> UserVouchers { get; set; } = [];
        
        // QL Rap
        
        public virtual ICollection<CinemaInfoEntity> TheaterManagedCinemas { get; set; } = [];
        public virtual ICollection<CinemaInfoEntity> FacilitiesManagedCinemas { get; set; } = [];
        
        // QL Phòng
        
        
        // QL Định dạng
        
        
        // Quản lý Trạng thái discount
        
        
        
        
        // Quản lý trạng giảm giá
        
        
        
        
        // Quanr lys phim
        
        
        
        
        public virtual ICollection<MovieInfoEntity> ManagedMovieInfos { get; set; } = [];
        
        // QL Lich Chieu
        
        
        
        
        // QL Order

        public virtual ICollection<OrderInfoEntity> OrderInfoEntity { get; set; } = [];
        
        // Staff & Customer Profiles (1-1)
        
        public StaffProfileEntity? StaffProfileEntity { get; set; }
        public CustomerProfileEntity? CustomerProfileEntity { get; set; }
    }
}



