using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Runtime.CompilerServices;
using Cinema.Domain.Entities.CinemaInfos;
using Cinema.Domain.Entities.MovieInfos;
using Cinema.Domain.Entities.Vouchers;
using Cinema.Domain.Enums;
// ReSharper disable All

namespace Cinema.Domain.Entities.UserInfos
{
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

        public void DeductPoints(long points)
        {
            if (RewardPoints < points)
                throw new Cinema.Domain.Exceptions.AppException("Insufficient reward points", 400, "V07");
            RewardPoints -= points;
        }

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

        public virtual ICollection<MovieCommentEntity> MovieCommentEntities { get; set; } = [];

        public virtual ICollection<UserNotificationEntity> UserNotificationEntities { get; set; } = [];
        
        // Staff & Customer Profiles (1-1)
        
        public StaffProfileEntity? StaffProfileEntity { get; set; }
        public CustomerProfileEntity? CustomerProfileEntity { get; set; }
    }
}



