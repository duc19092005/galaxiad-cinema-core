using System.ComponentModel.DataAnnotations;
using Cinema.Domain.Enums;

namespace Cinema.Application.Dtos.Concessions;

// ==========================================
// Product & Combo - Requests
// ==========================================

public class ReqCreateConcessionProductDto
{
    [Required] public Guid CinemaId { get; set; }
    [Required, StringLength(200)] public string ProductName { get; set; } = string.Empty;
    [Required, StringLength(50)] public string Sku { get; set; } = string.Empty;
    [Required] public ConcessionCategory Category { get; set; }
    [Range(0, double.MaxValue)] public decimal UnitPrice { get; set; }
    [Range(0, double.MaxValue)] public decimal CostPrice { get; set; }
    public ConcessionUnit Unit { get; set; } = ConcessionUnit.Piece;
    public string? ImageUrl { get; set; }
    public string? Description { get; set; }
    public bool IsAvailableOnline { get; set; } = true;
    public bool IsHot { get; set; } = false;
    public int LowStockThreshold { get; set; } = 10;
    /// <summary>Tồn kho khởi tạo khi vừa tạo sản phẩm</summary>
    public int InitialQuantity { get; set; } = 0;
}

public class ReqUpdateConcessionProductDto
{
    [Required, StringLength(200)] public string ProductName { get; set; } = string.Empty;
    [Range(0, double.MaxValue)] public decimal UnitPrice { get; set; }
    [Range(0, double.MaxValue)] public decimal CostPrice { get; set; }
    public ConcessionUnit Unit { get; set; } = ConcessionUnit.Piece;
    public string? ImageUrl { get; set; }
    public string? Description { get; set; }
    public bool IsAvailableOnline { get; set; } = true;
    public bool IsHot { get; set; } = false;
    public int LowStockThreshold { get; set; } = 10;
}

public class ReqCreateComboDto
{
    [Required] public Guid CinemaId { get; set; }
    [Required, StringLength(200)] public string ProductName { get; set; } = string.Empty;
    [Required, StringLength(50)] public string Sku { get; set; } = string.Empty;
    [Range(0, double.MaxValue)] public decimal UnitPrice { get; set; }
    public string? ImageUrl { get; set; }
    public string? Description { get; set; }
    public bool IsAvailableOnline { get; set; } = true;
    [Required, MinLength(1)] public List<ReqComboItemDto> Items { get; set; } = [];
}

public class ReqComboItemDto
{
    [Required] public Guid ComponentProductId { get; set; }
    [Range(1, int.MaxValue)] public int Quantity { get; set; } = 1;
}

// ==========================================
// Product & Combo - Responses
// ==========================================

public class ResConcessionProductDto
{
    public Guid ProductId { get; set; }
    public Guid CinemaId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public string Sku { get; set; } = string.Empty;
    public ConcessionCategory Category { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal CostPrice { get; set; }
    public ConcessionUnit Unit { get; set; }
    public string? ImageUrl { get; set; }
    public string? Description { get; set; }
    public bool IsActive { get; set; }
    public bool IsAvailableOnline { get; set; }
    public bool IsHot { get; set; }
    public bool IsCombo { get; set; }
    public int LowStockThreshold { get; set; }
    public int QuantityOnHand { get; set; }
    public int QuantityReserved { get; set; }
    public int AvailableToSell { get; set; }
    public bool IsLowStock { get; set; }
    public List<ResComboItemDto> ComboItems { get; set; } = [];
}

public class ResComboItemDto
{
    public Guid ComponentProductId { get; set; }
    public string ComponentProductName { get; set; } = string.Empty;
    public int Quantity { get; set; }
}

// ==========================================
// Menu (Online / POS)
// ==========================================

public class ResConcessionMenuItemDto
{
    public Guid ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public ConcessionCategory Category { get; set; }
    public decimal UnitPrice { get; set; }
    public ConcessionUnit Unit { get; set; }
    public string? ImageUrl { get; set; }
    public string? Description { get; set; }
    public bool IsCombo { get; set; }
    public bool IsHot { get; set; }
    public int AvailableToSell { get; set; }
    public bool IsLowStock { get; set; }
    public bool IsOutOfStock => AvailableToSell <= 0;
}

// ==========================================
// Sales requests
// ==========================================

public class ReqConcessionItemDto
{
    [Required] public Guid ProductId { get; set; }
    [Range(1, 100)] public int Quantity { get; set; } = 1;
}

public class ReqSellConcessionPosDto
{
    [Required] public Guid CinemaId { get; set; }
    [Required, MinLength(1)] public List<ReqConcessionItemDto> Items { get; set; } = [];
    public Guid? StaffId { get; set; }
}

public class ReqCheckConcessionStockDto
{
    [Required] public Guid CinemaId { get; set; }
    [Required, MinLength(1)] public List<ReqConcessionItemDto> Items { get; set; } = [];
}

public class ResConcessionSaleDto
{
    public Guid OrderId { get; set; }
    public decimal TotalAmount { get; set; }
    public DateTime SoldAt { get; set; }
}

// ==========================================
// Stock check / out-of-stock suggestions
// ==========================================

public class ConcessionSubstituteDto
{
    public Guid ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public decimal UnitPrice { get; set; }
    public int AvailableToSell { get; set; }
    public string? ImageUrl { get; set; }
}

public class ConcessionStockConflictDto
{
    public Guid ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public int RequestedQuantity { get; set; }
    /// <summary>0 = hết sạch, lớn hơn 0 nghĩa là còn ít hơn số lượng yêu cầu</summary>
    public int AvailableQuantity { get; set; }
    public List<ConcessionSubstituteDto> Suggestions { get; set; } = [];
}

public class ResConcessionStockCheckResultDto
{
    public bool AllAvailable { get; set; }
    public List<ConcessionStockConflictDto> Conflicts { get; set; } = [];
}

// ==========================================
// Sales report
// ==========================================

public class ResConcessionSalesReportDto
{
    public decimal TotalRevenue { get; set; }
    public decimal TotalCost { get; set; }
    public decimal GrossProfit { get; set; }
    public int TotalItemsSold { get; set; }
    public List<ResTopSellingProductDto> TopSellingProducts { get; set; } = [];
}

public class ResTopSellingProductDto
{
    public Guid ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public int QuantitySold { get; set; }
    public decimal Revenue { get; set; }
}
