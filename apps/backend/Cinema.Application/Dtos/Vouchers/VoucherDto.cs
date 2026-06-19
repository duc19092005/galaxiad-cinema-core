using System;

namespace Cinema.Application.Dtos.Vouchers;

public class VoucherDto
{
    public Guid VoucherId { get; set; }
    public string VoucherName { get; set; } = string.Empty;
    public string VoucherDescription { get; set; } = string.Empty;
    public long VoucherAmount { get; set; }
    public decimal VoucherDiscountPercent { get; set; }
    public Guid RoleId { get; set; }
    public string RoleName { get; set; } = string.Empty;
    public DateTime? ValidFrom { get; set; }
    public DateTime? ValidTo { get; set; }
    public int VoucherPointsCost { get; set; }
    public int VoucherQuantity { get; set; }
    public int RemainingQuantity { get; set; }
    public bool IsActive { get; set; }
}
