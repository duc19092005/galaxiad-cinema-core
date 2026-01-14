using System.ComponentModel.DataAnnotations.Schema;
using DataAccess.Enums;

namespace DataAccess.Entities.User_Info;

public class order_info_entity
{
    public Guid orderId { get; set; }
    
    public Guid? userId { get; set; }
    
    public order_status_enum orderStatus { get; set; }
    
    public payment_method_enum paymentMethod { get; set; }
    
    [Column(TypeName = "decimal(18,2)")]
    public decimal totalPrice { get; set; }
    
    public DateTime orderDate { get; set; }
    
    public int totalQuantity { get; set; }
    
    [Column(TypeName = "nvarchar(50)")]
    public string customerName { get; set; } = string.Empty;
    
    [Column(TypeName = "nvarchar(200)")]
    public string customerAddress { get; set; } = string.Empty;
    
    [Column(TypeName = "varchar(40)")]
    public string customerEmail { get; set; } = string.Empty;
    
    public user_info_entity user_info { get; set; }

    public List<order_details_info> order_details_info { get; set; } = [];
}