using System.ComponentModel.DataAnnotations.Schema;
// ReSharper disable All

namespace Cinema.Domain.Entities.UserInfos
{
    // Bảng này được tạo ra mục đích là chỉ ra mối quan hệ nhiều nhiều

    public class UserRoleInfoEntity
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
}


