using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using DataAccess.Entities.Vouchers;
using Microsoft.EntityFrameworkCore;
// ReSharper disable All


namespace DataAccess.Entities.User_Info
{
    public class role_list_info_entity
    {
        [Key]
        public Guid roleId { get; set; } 
        
        [Required]
        [Column(TypeName = "nvarchar(50)")]
        public string roleName { get; set; } = "";

        public List<user_role_info_entity> user_role_info_entity { get; set; } = [];
        
        public List<voucher_info_entity> voucher_info_entity { get; set; } = [];
    }
}