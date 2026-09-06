using System;

namespace Cinema.Domain.Constants;

public static class userPermissions
{
    // Cinema Management
    public static readonly Guid ViewCinema = Guid.Parse("a1b2c3d4-1111-1111-1111-111111111001");
    public static readonly Guid ManageCinema = Guid.Parse("a1b2c3d4-1111-1111-1111-111111111002");
    
    // Auditorium Management
    public static readonly Guid ViewAuditorium = Guid.Parse("a1b2c3d4-1111-1111-1111-111111111003");
    public static readonly Guid ManageAuditorium = Guid.Parse("a1b2c3d4-1111-1111-1111-111111111004");
    
    // Movie Management
    public static readonly Guid ViewMovie = Guid.Parse("a1b2c3d4-1111-1111-1111-111111111005");
    public static readonly Guid ManageMovie = Guid.Parse("a1b2c3d4-1111-1111-1111-111111111006");
    
    // Schedule Management
    public static readonly Guid ViewSchedule = Guid.Parse("a1b2c3d4-1111-1111-1111-111111111007");
    public static readonly Guid ManageSchedule = Guid.Parse("a1b2c3d4-1111-1111-1111-111111111008");
    
    // Ticket & Booking
    public static readonly Guid BookTicket = Guid.Parse("a1b2c3d4-1111-1111-1111-111111111009");
    public static readonly Guid SellTicket = Guid.Parse("a1b2c3d4-1111-1111-1111-111111111010");
    public static readonly Guid ViewHistory = Guid.Parse("a1b2c3d4-1111-1111-1111-111111111011");
    
    // Staff & Shift Management
    public static readonly Guid ClockIn = Guid.Parse("a1b2c3d4-1111-1111-1111-111111111012");
    public static readonly Guid ClockOut = Guid.Parse("a1b2c3d4-1111-1111-1111-111111111013");
    public static readonly Guid RegisterShift = Guid.Parse("a1b2c3d4-1111-1111-1111-111111111014");
    public static readonly Guid ApproveShift = Guid.Parse("a1b2c3d4-1111-1111-1111-111111111015");
    
    // Payroll
    public static readonly Guid ViewPayroll = Guid.Parse("a1b2c3d4-1111-1111-1111-111111111016");
    public static readonly Guid ProcessPayroll = Guid.Parse("a1b2c3d4-1111-1111-1111-111111111017");
    
    // User Management
    public static readonly Guid ManageUsers = Guid.Parse("a1b2c3d4-1111-1111-1111-111111111018");
    public static readonly Guid ViewAuditLogs = Guid.Parse("a1b2c3d4-1111-1111-1111-111111111019");
    
    // Voucher Management
    public static readonly Guid ManageVouchers = Guid.Parse("a1b2c3d4-1111-1111-1111-111111111020");
    
    // Format & Surcharge Management
    public static readonly Guid ManageFormats = Guid.Parse("a1b2c3d4-1111-1111-1111-111111111021");
    public static readonly Guid ManageSurcharges = Guid.Parse("a1b2c3d4-1111-1111-1111-111111111022");
    
    // Staff Profile Management
    public static readonly Guid ManageStaffProfiles = Guid.Parse("a1b2c3d4-1111-1111-1111-111111111023");

    // Concession (Food & Beverage)
    /// <summary>Xem danh mục sản phẩm bắp nước</summary>
    public static readonly Guid ViewConcession = Guid.Parse("a1b2c3d4-1111-1111-1111-111111111024");
    /// <summary>Tạo, sửa, bật tắt sản phẩm và giá</summary>
    public static readonly Guid ManageConcession = Guid.Parse("a1b2c3d4-1111-1111-1111-111111111025");
    /// <summary>Bán bắp nước tại quầy</summary>
    public static readonly Guid SellConcession = Guid.Parse("a1b2c3d4-1111-1111-1111-111111111026");

    // Inventory
    /// <summary>Xem tồn kho hiện tại</summary>
    public static readonly Guid ViewInventory = Guid.Parse("a1b2c3d4-1111-1111-1111-111111111027");
    /// <summary>Nhập kho, điều chỉnh, kiểm kê</summary>
    public static readonly Guid ManageInventory = Guid.Parse("a1b2c3d4-1111-1111-1111-111111111028");
    /// <summary>Xem lịch sử biến động kho</summary>
    public static readonly Guid ViewInventoryHistory = Guid.Parse("a1b2c3d4-1111-1111-1111-111111111029");

    // Cleaning
    /// <summary>Nhân viên thực hiện quét dọn</summary>
    public static readonly Guid PerformCleaning = Guid.Parse("a1b2c3d4-1111-1111-1111-111111111030");
    /// <summary>Quản lý gán và theo dõi nhiệm vụ quét dọn</summary>
    public static readonly Guid ManageCleaning = Guid.Parse("a1b2c3d4-1111-1111-1111-111111111031");
    /// <summary>Xác nhận kết quả quét dọn</summary>
    public static readonly Guid VerifyCleaning = Guid.Parse("a1b2c3d4-1111-1111-1111-111111111032");
    // Film contracts
    public static readonly Guid ViewContracts = Guid.Parse("a1b2c3d4-1111-1111-1111-111111111033");
    public static readonly Guid ManageContractDrafts = Guid.Parse("a1b2c3d4-1111-1111-1111-111111111034");
    public static readonly Guid ManageContractTemplates = Guid.Parse("a1b2c3d4-1111-1111-1111-111111111035");
    public static readonly Guid ApproveContracts = Guid.Parse("a1b2c3d4-1111-1111-1111-111111111036");
    public static readonly Guid SignContracts = Guid.Parse("a1b2c3d4-1111-1111-1111-111111111037");
    public static readonly Guid ActivateContracts = Guid.Parse("a1b2c3d4-1111-1111-1111-111111111038");
    public static readonly Guid ViewContractFinance = Guid.Parse("a1b2c3d4-1111-1111-1111-111111111039");
    public static readonly Guid ManageSettlements = Guid.Parse("a1b2c3d4-1111-1111-1111-111111111040");
    public static readonly Guid ProposeMovieChanges = Guid.Parse("a1b2c3d4-1111-1111-1111-111111111041");
    public static readonly Guid ApproveMovieChanges = Guid.Parse("a1b2c3d4-1111-1111-1111-111111111042");
}
