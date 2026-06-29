using System.ComponentModel.DataAnnotations.Schema;
using Cinema.Domain.Enums;

namespace Cinema.Domain.Entities.UserInfos;

public class OrderInfoEntity
{
    public Guid OrderId { get; set; }

    [Column(TypeName = "varchar(20)")]
    public string BookingCode { get; set; } = string.Empty;
    public Guid? UserId { get; set; }

    public Guid? StaffId {get;set;}
    
    public OrderStatusEnum OrderStatus { get; set; }
    
    public PaymentMethodEnum PaymentMethod { get; set; }
    
    [Column(TypeName = "decimal(18,2)")]
    public decimal TotalPrice { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal SubtotalPrice { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal PromotionDiscountAmount { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal VoucherDiscountAmount { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal FinalAmount { get; set; }

    [Column(TypeName = "nvarchar(max)")]
    public string? PricingSnapshotJson { get; set; }
    
    public DateTime OrderDate { get; set; }
    
    public int TotalQuantity { get; set; }
    
    [Column(TypeName = "nvarchar(50)")]
    
    public string? CustomerName { get; set; } 
    
    [Column(TypeName = "nvarchar(200)")]
    public string? CustomerAddress { get; set; }
    
    [Column(TypeName = "varchar(40)")]
    public string? CustomerEmail { get; set; }

    [Column(TypeName = "varchar(20)")]
    public string? CustomerPhone { get; set; }
    
    [Column(TypeName = "varchar(100)")]
    public string? VnPayTransactionId { get; set; }

    public Guid? VoucherId { get; set; }

    public UserInfoEntity UserInfoEntity { get; set; } = null!;

    public List<OrderDetailsInfo> OrderDetailsInfo { get; set; } = [];
}

