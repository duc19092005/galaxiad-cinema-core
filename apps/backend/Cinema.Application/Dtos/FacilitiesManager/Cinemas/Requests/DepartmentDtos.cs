using Cinema.Domain.Entities.CinemaInfos;

namespace Cinema.Application.Dtos.FacilitiesManager.Cinemas.Requests;

public class CreateDepartmentReqDto
{
    /// <summary>Rạp cần thêm phòng ban</summary>
    public Guid CinemaId { get; set; }

    /// <summary>Tên hiển thị (vd: "Quầy Vé", "Quầy Bắp Nước")</summary>
    public string DepartmentName { get; set; } = string.Empty;

    /// <summary>Cashier = 0</summary>
    public DepartmentType DepartmentType { get; set; } = DepartmentType.Cashier;

    /// <summary>TicketPOS = 0, FoodPOS = 1</summary>
    public CashierType CashierType { get; set; } = CashierType.TicketPOS;
}

public class UpdateDepartmentReqDto
{
    public string? DepartmentName { get; set; }
    public bool? IsActive { get; set; }
}

public class ResDepartmentDto
{
    public Guid DepartmentId { get; set; }
    public Guid CinemaId { get; set; }
    public string CinemaName { get; set; } = string.Empty;
    public string DepartmentName { get; set; } = string.Empty;
    public string DepartmentType { get; set; } = string.Empty;
    public string CashierType { get; set; } = string.Empty;
    public Guid? SharedUserId { get; set; }
    public string? SharedUserEmail { get; set; }
    public string SharedUserDefaultPassword { get; set; } = string.Empty;
    public bool IsActive { get; set; }
}
