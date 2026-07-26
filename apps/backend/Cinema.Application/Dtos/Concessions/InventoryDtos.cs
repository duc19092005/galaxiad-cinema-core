using System.ComponentModel.DataAnnotations;
using Cinema.Domain.Enums;

namespace Cinema.Application.Dtos.Concessions;

public class ReqRestockInventoryDto
{
    [Required] public Guid ProductId { get; set; }
    [Range(1, int.MaxValue)] public int Quantity { get; set; }
    public string? Note { get; set; }
}

public class ReqAdjustInventoryDto
{
    [Required] public Guid ProductId { get; set; }
    /// <summary>Số lượng thay đổi: âm để hủy hàng hỏng, dương để cộng thêm thủ công</summary>
    public int QuantityChange { get; set; }
    [Required] public InventoryTransactionType TransactionType { get; set; } = InventoryTransactionType.Adjustment;
    public string? Note { get; set; }
}

public class ReqStockCountDto
{
    [Required] public Guid ProductId { get; set; }
    /// <summary>Số lượng thực đếm được</summary>
    [Range(0, int.MaxValue)] public int CountedQuantity { get; set; }
    public string? Note { get; set; }
}

public class ResInventoryStatusDto
{
    public Guid ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public string Sku { get; set; } = string.Empty;
    public ConcessionCategory Category { get; set; }
    public int QuantityOnHand { get; set; }
    public int QuantityReserved { get; set; }
    public int AvailableToSell { get; set; }
    public int LowStockThreshold { get; set; }
    public bool IsLowStock { get; set; }
    public DateTime? LastRestockedAt { get; set; }
    public DateTime? LastCountedAt { get; set; }
}

public class ResInventoryTransactionDto
{
    public Guid TransactionId { get; set; }
    public Guid ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public InventoryTransactionType TransactionType { get; set; }
    public int QuantityChange { get; set; }
    public int QuantityOnHandAfter { get; set; }
    public int QuantityReservedAfter { get; set; }
    public Guid? OrderId { get; set; }
    public Guid? PerformedByUserId { get; set; }
    public string? PerformedByUserName { get; set; }
    public string? Note { get; set; }
    public DateTime OccurredAt { get; set; }
}

public class ReqInventoryHistoryFilterDto
{
    public Guid? ProductId { get; set; }
    public InventoryTransactionType? TransactionType { get; set; }
    public DateTime? FromDate { get; set; }
    public DateTime? ToDate { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
}
