using System;

namespace Cinema.Application.Dtos.Vouchers;

public class UserVoucherDto
{
    public Guid UserVoucherId { get; set; }
    public Guid UserId { get; set; }
    public Guid VoucherId { get; set; }
    public string VoucherName { get; set; } = string.Empty;
    public string VoucherDescription { get; set; } = string.Empty;
    public decimal VoucherDiscountPercent { get; set; }
    public bool IsUsed { get; set; }
    public DateTime PurchasedAt { get; set; }
    public DateTime? UsedAt { get; set; }
    public DateTime? ValidFrom { get; set; }
    public DateTime? ValidTo { get; set; }
}
