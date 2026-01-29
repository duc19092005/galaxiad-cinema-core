using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;
// ReSharper disable All

namespace DataAccess.Entities.UserInfos
{
    public class UserProfileEntity
    {
        [Key]
        public Guid UserId { get; set; } 

        [Column(TypeName = "nvarchar(100)")]
        [Required]
        public string UserName { get; set; } = null!;
        
        [Column(TypeName = "varchar(200)")]
        [Required]
        public string IdentityCode { get; set; } = null!;

        public DateTime DateOfBirth { get; set; }

        [Column(TypeName = "char(10)")] 
        public string PhoneNumber { get; set; } = null!;

        public UserInfoEntity UserInfoEntity { get; set; } = null!;
    }
}


