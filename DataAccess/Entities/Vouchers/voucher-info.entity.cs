// ReSharper disable All

using System.ComponentModel.DataAnnotations.Schema;
using DataAccess.Entities.User_Info;

namespace DataAccess.Entities.Vouchers;

public class voucher_info_entity
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

    public role_list_info_entity role_list_info_entity { get; set; } = null!;
}