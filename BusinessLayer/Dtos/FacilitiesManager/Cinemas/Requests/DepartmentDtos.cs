using BusinessLayer.Entities.CinemaInfos;

namespace BusinessLayer.Dtos.FacilitiesManager.Cinemas.Requests;

public class CreateDepartmentReqDto
{
    /// <summary>Rạp cần thêm phòng ban</summary>
    public Guid CinemaId { get; set; }

    /// <summary>Tên hiển thị (vd: "Quầy Vé", "Quầy Bắp Nước")</summary>
    public string DepartmentName { get; set; } = string.Empty;

    /// <summary>TicketPOS = 0, FoodPOS = 1</summary>
    public CashierDepartmentType DepartmentType { get; set; } = CashierDepartmentType.TicketPOS;
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
    public Guid? SharedUserId { get; set; }
    public string? SharedUserEmail { get; set; }
    public bool IsActive { get; set; }
}
