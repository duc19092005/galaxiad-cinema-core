namespace DataAccess.Constants;

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
}
