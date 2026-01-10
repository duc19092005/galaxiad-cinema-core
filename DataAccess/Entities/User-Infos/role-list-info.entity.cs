using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;
// ReSharper disable All


namespace DataAccess.Entities.User_Info
{
    [Index(nameof(roleName) , IsUnique = true)]
    public class role_list_info_entity
    {
        [Key]
        [Column(TypeName = "varchar(100)")]
        public string roleId { get; set; } = "";
        
        [Required]
        [Column(TypeName = "nvarchar(50)")]
        public string roleName { get; set; } = "";

        public List<user_role_info_entity> user_role_info_entity { get; set; } = [];
    }
}