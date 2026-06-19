using System;
using System.ComponentModel.DataAnnotations;

namespace Cinema.Application.Dtos.Vouchers;

public class CreateVoucherDto
{
    [Required]
    [MaxLength(100)]
    public string VoucherName { get; set; } = string.Empty;

    [MaxLength(300)]
    public string VoucherDescription { get; set; } = string.Empty;

    [Range(0, long.MaxValue)]
    public long VoucherAmount { get; set; }

    [Range(0, 100)]
    public decimal VoucherDiscountPercent { get; set; }

    [Required]
    public Guid RoleId { get; set; }

    public DateTime? ValidFrom { get; set; }

    public DateTime? ValidTo { get; set; }

    [Range(0, int.MaxValue)]
    public int VoucherPointsCost { get; set; }

    [Range(1, int.MaxValue)]
    public int VoucherQuantity { get; set; }
}
