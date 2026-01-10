using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;
// ReSharper disable All

namespace DataAccess.Entities.User_Info
{
    public class user_profile_entity
    {
        [Key]
        [ForeignKey("user_info_entity")]
        public string userID { get; set; } = null!;

        [Column(TypeName = "nvarchar(100)")]
        [Required]
        public string userName { get; set; } = null!;
        
        [Column(TypeName = "varchar(200)")]
        [Required]
        public string identityCode { get; set; } = null!;

        public DateTime dateOfBirth { get; set; }

        [Column(TypeName = "char(10)")] 
        public string phoneNumber { get; set; } = null!;

        public user_info_entity user_info_entity { get; set; } = null!;
    }
}