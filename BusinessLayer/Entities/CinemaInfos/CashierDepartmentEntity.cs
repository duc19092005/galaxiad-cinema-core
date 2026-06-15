using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using BusinessLayer.Entities.UserInfos;
// ReSharper disable All

namespace BusinessLayer.Entities.CinemaInfos;

/// <summary>
/// Phòng ban thu ngân của một rạp.
/// Khi tạo phòng ban, hệ thống tự động sinh tài khoản dùng chung cho quầy.
/// </summary>
public class CashierDepartmentEntity
{
    [Key]
    public Guid DepartmentId { get; set; }

    [ForeignKey("CinemaInfoEntity")]
    public Guid CinemaId { get; set; }

    /// <summary>Tên hiển thị: "Quầy Vé", "Quầy Bắp Nước"</summary>
    [Column(TypeName = "nvarchar(100)")]
    [Required]
    public string DepartmentName { get; set; } = string.Empty;

    /// <summary>TicketPOS = 0, FoodPOS = 1</summary>
    public CashierDepartmentType DepartmentType { get; set; } = CashierDepartmentType.TicketPOS;

    /// <summary>FK đến tài khoản dùng chung được tạo tự động</summary>
    public Guid? SharedUserId { get; set; }

    [ForeignKey("SharedUserId")]
    public UserInfoEntity? SharedUserInfoEntity { get; set; }

    public bool IsActive { get; set; } = true;

    public CinemaInfoEntity CinemaInfoEntity { get; set; } = null!;
}

public enum CashierDepartmentType
{
    TicketPOS = 0,   // Quầy Vé
    FoodPOS = 1      // Quầy Bắp Nước
}
