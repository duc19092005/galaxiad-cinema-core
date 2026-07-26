using System.ComponentModel.DataAnnotations;
using Cinema.Domain.Enums;

namespace Cinema.Application.Dtos.Concessions;

public class ReqCreateStockRequestItemDto
{
    [Required] public Guid ProductId { get; set; }
    [Range(1, int.MaxValue)] public int Quantity { get; set; }
}

public class ReqCreateStockRequestDto
{
    [Required] public Guid CinemaId { get; set; }
    [Required, MinLength(1)] public List<ReqCreateStockRequestItemDto> Items { get; set; } = [];
    public string? Note { get; set; }
}

public class ReqApproveStockRequestItemDto
{
    [Required] public Guid ProductId { get; set; }
    [Range(0, int.MaxValue)] public int ApprovedQuantity { get; set; }
}

public class ReqApproveStockRequestDto
{
    public List<ReqApproveStockRequestItemDto> Items { get; set; } = [];
    public string? Note { get; set; }
}

public class ReqRejectStockRequestDto
{
    [Required, StringLength(500)] public string Reason { get; set; } = string.Empty;
}

public class ReqReceiveStockRequestItemDto
{
    [Required] public Guid ProductId { get; set; }
    [Range(0, int.MaxValue)] public int ReceivedQuantity { get; set; }
}

public class ReqReceiveStockRequestDto
{
    public List<ReqReceiveStockRequestItemDto> Items { get; set; } = [];
    public string? Note { get; set; }
}

public class ResStockRequestItemDto
{
    public Guid StockRequestItemId { get; set; }
    public Guid ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public string Sku { get; set; } = string.Empty;
    public int RequestedQuantity { get; set; }
    public int ApprovedQuantity { get; set; }
    public int ReceivedQuantity { get; set; }
}

public class ResStockRequestDto
{
    public Guid StockRequestId { get; set; }
    public string RequestCode { get; set; } = string.Empty;
    public Guid CinemaId { get; set; }
    public string CinemaName { get; set; } = string.Empty;
    public StockRequestStatus Status { get; set; }
    public Guid RequestedByUserId { get; set; }
    public string RequestedByUserName { get; set; } = string.Empty;
    public Guid? ApprovedByUserId { get; set; }
    public string? ApprovedByUserName { get; set; }
    public Guid? ShippedByUserId { get; set; }
    public string? ShippedByUserName { get; set; }
    public Guid? ReceivedByUserId { get; set; }
    public string? ReceivedByUserName { get; set; }
    public string? Note { get; set; }
    public string? RejectReason { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? ApprovedAt { get; set; }
    public DateTime? ShippedAt { get; set; }
    public DateTime? ReceivedAt { get; set; }
    public List<ResStockRequestItemDto> Items { get; set; } = [];
}
