using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using DataAccess.Entities.Vouchers;
using Microsoft.EntityFrameworkCore;
// ReSharper disable All


namespace DataAccess.Entities.UserInfos
{
    public class RoleListInfoEntity
    {
        [Key]
        public Guid RoleId { get; set; } 
        
        [Required]
        [Column(TypeName = "nvarchar(50)")]
        public string RoleName { get; set; } = "";

        [Column(TypeName = "decimal(18,2)")]
        public decimal SalaryPerHour { get; set; } = 0;

        [Column(TypeName = "decimal(18,2)")]
        public decimal DiscountPercent { get; set; } = 0;

        public List<UserRoleInfoEntity> UserRoleInfoEntity { get; set; } = [];
        
        public List<VoucherInfoEntity> VoucherInfoEntity { get; set; } = [];

        public List<PermissionForRoleEntity> PermissionForRoleEntities { get; set; } = [];
        public List<StaffWorkingLoggerEntity> StaffWorkingLoggerEntities { get; set; } = [];
    }
}


