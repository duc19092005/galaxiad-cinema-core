using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;
using DataAccess.Entities.UserInfos;
// ReSharper disable All

namespace DataAccess.Entities.UserInfos
{
    // Bảng này được tạo ra mục đích là chỉ ra mối quan hệ nhiều nhiều

    public partial class UserRoleInfoEntity
    {
        // ID của user

        [ForeignKey("UserInfoEntity")]
        public Guid UserId { get; set; } 

        // Role của User

        [ForeignKey("RoleListInfoEntity")]
        public Guid RoleId { get; set; } 

        public UserInfoEntity UserInfoEntity { get; set; } = null!;

        public RoleListInfoEntity RoleListInfoEntity { get; set; } = null!;

    }

    [PrimaryKey(nameof(RoleId), nameof(UserId))]
    public partial class UserRoleInfoEntity
    {

    }
}


