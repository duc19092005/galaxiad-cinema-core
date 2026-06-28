using System.ComponentModel.DataAnnotations;
using Cinema.Domain.Enums;

namespace Cinema.Application.Dtos.Shifts;

public class ReqRegisterShiftDto
{
    public Guid? ShiftTemplateId { get; set; }
    public Guid? ShiftScheduleId { get; set; }

    [Required]
    public DateTime StartDate { get; set; }

    [Required]
    public DateTime EndDate { get; set; }

    public string? Notes { get; set; }
}

public class ResShiftTemplateDto
{
    public Guid ShiftTemplateId { get; set; }
    public Guid? ShiftScheduleId { get; set; }
    public Guid CinemaId { get; set; }
    public string CinemaName { get; set; } = string.Empty;
    public string ShiftName { get; set; } = string.Empty;
    public TimeSpan StartTime { get; set; }
    public TimeSpan EndTime { get; set; }
    public int MaxStaff { get; set; }
    public int RegisteredCount { get; set; }
    public Guid RoleId { get; set; }
    public string RoleName { get; set; } = string.Empty;
    public ShiftType ShiftType { get; set; }
}

public class ResStaffShiftRegistrationDto
{
    public Guid ShiftRegistrationId { get; set; }
    public Guid StaffId { get; set; }
    public string StaffName { get; set; } = string.Empty;
    public Guid ShiftTemplateId { get; set; }
    public string ShiftName { get; set; } = string.Empty;
    public TimeSpan StartTime { get; set; }
    public TimeSpan EndTime { get; set; }
    public DateTime RegistrationDate { get; set; }
    public string Status { get; set; } = string.Empty;
    public string? ApprovedByName { get; set; }
    public DateTime? ApprovedAt { get; set; }
    public string? Notes { get; set; }
}

public class ReqApproveShiftDto
{
    public string? Notes { get; set; }
}

public class ReqAssignShiftDto
{
    [Required]
    public Guid StaffId { get; set; }

    [Required]
    public Guid ShiftTemplateId { get; set; }

    [Required]
    public DateTime RegistrationDate { get; set; }
}

public class ReqRegisterFaceDto
{
    [Required]
    public float[] FaceVector { get; set; } = [];
}

public class ReqClockInDto
{
    [Required]
    public Guid StaffId { get; set; }

    [Required]
    public float[] FaceVector { get; set; } = [];

    public DateTime? SimulatedDateTime { get; set; }
}

public class ResClockInDto
{
    public string AccessToken { get; set; } = string.Empty;
    public string StaffName { get; set; } = string.Empty;
}

public class ReqClockOutDto
{
    public DateTime? SimulatedDateTime { get; set; }
}

public class ReqCreateShiftTemplateDto
{
    [Required]
    public Guid CinemaId { get; set; }

    [Required]
    public string ShiftName { get; set; } = string.Empty;

    [Required]
    public TimeSpan StartTime { get; set; }

    [Required]
    public TimeSpan EndTime { get; set; }

    public int MaxStaff { get; set; } = 2;

    [Required]
    public Guid RoleId { get; set; }

    [Required]
    public ShiftType ShiftType { get; set; }
}

public class ReqUpdateStaffProfileDto
{
    public bool WorkingStatus { get; set; }
    public Guid CinemaId { get; set; }
    public bool IsCinemaManager { get; set; }
    public EmployeeWorkType? EmployeeType { get; set; }
}

public class ResStaffProfileDto
{
    public Guid UserId { get; set; }
    public string UserName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? PortraitImageUrl { get; set; }
    public bool WorkingStatus { get; set; }
    public Guid CinemaId { get; set; }
    public string CinemaName { get; set; } = string.Empty;
    public Guid? DepartmentId { get; set; }
    public string? DepartmentName { get; set; }
    public bool IsCinemaManager { get; set; }
    public bool HasFaceRegistered { get; set; }
    public EmployeeWorkType EmployeeType { get; set; }
}

public class ReqCalculatePayrollDto
{
    [Required]
    public Guid StaffId { get; set; }

    [Required]
    public DateTime UpToDate { get; set; }
}

public class ResPayrollDto
{
    public Guid SalaryTotalLoggerId { get; set; }
    public decimal TotalReceived { get; set; }
    public DateTime ReceivedDay { get; set; }
    public Guid StaffId { get; set; }
    public string StaffName { get; set; } = string.Empty;
    public Guid? PaidByUserId { get; set; }
    public string? PaidByName { get; set; }
    public string PaymentStatus { get; set; } = string.Empty;
    public List<ResStaffWorkingLogDto> WorkingLogs { get; set; } = [];
}

public class ResStaffWorkingLogDto
{
    public Guid StaffWorkingLoggerId { get; set; }
    public decimal SalaryPerHour { get; set; }
    public decimal WorkingHour { get; set; }
    public DateTime StartedShiftTime { get; set; }
    public DateTime? EndedShiftTime { get; set; }
    public DateTime WorkingDate { get; set; }
    public decimal TotalReceived { get; set; }
}

public class ReqCreateShiftScheduleDto
{
    [Required]
    public Guid CinemaId { get; set; }

    [Required]
    public Guid DepartmentId { get; set; }

    [Required]
    public DateTime Date { get; set; }

    [Required]
    public List<ReqShiftScheduleItemDto> Shifts { get; set; } = [];

    public bool RepeatWeekly { get; set; }
    public int? RepeatWeeksCount { get; set; }
}

public class ReqShiftScheduleItemDto
{
    [Required]
    public string ShiftName { get; set; } = string.Empty;

    [Required]
    public TimeSpan StartTime { get; set; }

    [Required]
    public TimeSpan EndTime { get; set; }

    public int MaxStaff { get; set; } = 2;

    [Required]
    public Guid RoleId { get; set; }

    [Required]
    public ShiftType ShiftType { get; set; }
}

public class ResShiftScheduleDto
{
    public Guid ShiftScheduleId { get; set; }
    public Guid CinemaId { get; set; }
    public Guid DepartmentId { get; set; }
    public string DepartmentName { get; set; } = string.Empty;
    public DateTime Date { get; set; }
    public string ShiftName { get; set; } = string.Empty;
    public TimeSpan StartTime { get; set; }
    public TimeSpan EndTime { get; set; }
    public int MaxStaff { get; set; }
    public int RegisteredCount { get; set; }
    public Guid RoleId { get; set; }
    public string RoleName { get; set; } = string.Empty;
    public string DeletionStatus { get; set; } = string.Empty;
    public string? DeletionReason { get; set; }
    public List<ResScheduleStaffRegistrationDto> RegisteredStaff { get; set; } = [];
    public ShiftType ShiftType { get; set; }
}

public class ResScheduleStaffRegistrationDto
{
    public Guid ShiftRegistrationId { get; set; }
    public Guid StaffId { get; set; }
    public string StaffName { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
}

public class ReqDeleteShiftScheduleDto
{
    [Required]
    public string Reason { get; set; } = string.Empty;
}

public class ResPendingDeletionRequestDto
{
    public Guid ShiftScheduleId { get; set; }
    public Guid CinemaId { get; set; }
    public string CinemaName { get; set; } = string.Empty;
    public Guid DepartmentId { get; set; }
    public string DepartmentName { get; set; } = string.Empty;
    public DateTime Date { get; set; }
    public string ShiftName { get; set; } = string.Empty;
    public TimeSpan StartTime { get; set; }
    public TimeSpan EndTime { get; set; }
    public string DeletionReason { get; set; } = string.Empty;
    public Guid DeletionRequestedByUserId { get; set; }
    public string DeletionRequestedByUserName { get; set; } = string.Empty;
    public DateTime DeletionRequestedAt { get; set; }
    public int RegisteredStaffCount { get; set; }
}
