using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;
using DataAccess.Entities.User_Info;
// ReSharper disable All

namespace DataAccess.Entities.User_Info
{
    // Bảng này được tạo ra mục đích là chỉ ra mối quan hệ nhiều nhiều

    public partial class user_role_info_entity
    {
        // ID của user

        [ForeignKey("user_info_entity")]
        [Column(TypeName = "varchar(100)")]
        public string userId { get; set; } = "";

        // Role của User

        [ForeignKey("role_list_info_entity")]
        [Column(TypeName = "varchar(100)")]
        public string roleId { get; set; } = "";

        public user_info_entity user_info_entity { get; set; } = null!;

        public role_list_info_entity role_list_info_entity { get; set; } = null!;

    }

    [PrimaryKey(nameof(roleId), nameof(userId))]
    public partial class user_role_info_entity
    {

    }
}