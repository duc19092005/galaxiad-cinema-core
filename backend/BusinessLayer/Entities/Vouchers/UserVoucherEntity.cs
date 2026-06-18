using System;
using BusinessLayer.Entities.UserInfos;

namespace BusinessLayer.Entities.Vouchers;

public class UserVoucherEntity
{
    public Guid UserVoucherId { get; set; }
    
    public Guid UserId { get; set; }
    public virtual UserInfoEntity UserInfoEntity { get; set; } = null!;
    
    public Guid VoucherId { get; set; }
    public virtual VoucherInfoEntity VoucherInfoEntity { get; set; } = null!;
    
    public bool IsUsed { get; set; }
    
    public DateTime PurchasedAt { get; set; }
    
    public DateTime? UsedAt { get; set; }
}
