// ReSharper disable All

using System.ComponentModel.DataAnnotations.Schema;
using Cinema.Domain.Entities.UserInfos;
using Cinema.Domain.Exceptions;

namespace Cinema.Domain.Entities.Vouchers;

public class VoucherInfoEntity
{
    public Guid voucherId { get; set; }
    
    [Column(TypeName = "nvarchar(100)")]
    public string voucherName { get; set; } = string.Empty;
    
    [Column(TypeName = "nvarchar(300)")]
    public string voucherDescription { get; set; } = string.Empty;
    
    public long voucherAmount { get; set; }
    
    [Column(TypeName = "decimal(5,2)")]
    public decimal voucherDiscountPercent { get; set; }
    
    public Guid roleId { get; set; }

    public RoleListInfoEntity RoleListInfoEntity { get; set; } = null!;

    public int VoucherPointsCost { get; set; } = 0;
    
    public int VoucherQuantity { get; set; } = 0;
    
    public int RemainingQuantity { get; set; } = 0;

    public void Redeem()
    {
        if (RemainingQuantity <= 0)
            throw new DomainException("Voucher is out of stock", "V04");
        RemainingQuantity -= 1;
    }

    public virtual ICollection<UserVoucherEntity> UserVouchers { get; set; } = [];

    /// <summary>
    /// Ngày bắt đầu có hiệu lực của voucher
    /// </summary>
    public DateTime? ValidFrom { get; set; }

    /// <summary>
    /// Ngày hết hạn của voucher
    /// </summary>
    public DateTime? ValidTo { get; set; }

    /// <summary>
    /// Kiểm tra voucher có đang trong thời gian hiệu lực không
    /// </summary>
    public bool IsValid(DateTime? at = null)
    {
        var now = at ?? DateTime.UtcNow;
        var from = ValidFrom ?? DateTime.MinValue;
        var to = ValidTo ?? DateTime.MaxValue;
        return now >= from && now <= to;
    }
}

