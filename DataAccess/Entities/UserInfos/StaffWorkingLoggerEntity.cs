using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
// ReSharper disable All

namespace DataAccess.Entities.UserInfos;

public class StaffWorkingLoggerEntity
{
    [Key]
    public Guid StaffWorkingLoggerId { get; set; }

    [ForeignKey("StaffProfileEntity")]
    public Guid StaffId { get; set; }

    [ForeignKey("RoleListInfoEntity")]
    public Guid RoleId { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal SalaryPerHour { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal WorkingHour { get; set; }

    public DateTime StartedShiftTime { get; set; }

    public DateTime? EndedShiftTime { get; set; }

    public DateTime WorkingDate { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal TotalReceived { get; set; }

    [ForeignKey("StaffSalaryTotalLoggerEntity")]
    public Guid? SalaryTotalLoggerId { get; set; }

    public StaffProfileEntity StaffProfileEntity { get; set; } = null!;
    public RoleListInfoEntity RoleListInfoEntity { get; set; } = null!;
    public StaffSalaryTotalLoggerEntity? StaffSalaryTotalLoggerEntity { get; set; }
}
