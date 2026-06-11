using System.ComponentModel.DataAnnotations.Schema;
using Shared.Enums;

namespace DataAccess.Entities.UserInfos;

public class OrderInfoEntity
{
    public Guid OrderId { get; set; }
    
    public Guid? UserId { get; set; }

    public Guid? StaffId {get;set;}
    
    public OrderStatusEnum OrderStatus { get; set; }
    
    public PaymentMethodEnum PaymentMethod { get; set; }
    
    [Column(TypeName = "decimal(18,2)")]
    public decimal TotalPrice { get; set; }
    
    public DateTime OrderDate { get; set; }
    
    public int TotalQuantity { get; set; }
    
    [Column(TypeName = "nvarchar(50)")]
    
    public string? CustomerName { get; set; } 
    
    [Column(TypeName = "nvarchar(200)")]
    public string? CustomerAddress { get; set; }
    
    [Column(TypeName = "varchar(40)")]
    public string? CustomerEmail { get; set; }
    
    [Column(TypeName = "varchar(100)")]
    public string? VnPayTransactionId { get; set; }

    public Guid? VoucherId { get; set; }

    public UserInfoEntity UserInfoEntity { get; set; } = null!;

    public List<OrderDetailsInfo> OrderDetailsInfo { get; set; } = [];
}

