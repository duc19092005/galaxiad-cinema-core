using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Cinema.Domain.Entities.CinemaInfos;
using Cinema.Domain.Enums;
// ReSharper disable All

namespace Cinema.Domain.Entities.UserInfos;

public class StaffProfileEntity
{
    [Key]
    public Guid UserId { get; set; }

    public bool WorkingStatus { get; set; } = true;

    [Required]
    public EmployeeWorkType EmployeeType { get; set; } = EmployeeWorkType.PartTime;

    [ForeignKey("CinemaInfoEntity")]
    public Guid CinemaId { get; set; }

    [ForeignKey("DepartmentEntity")]
    public Guid? DepartmentId { get; set; }

    public bool IsCinemaManager { get; set; } = false;

    [Column(TypeName = "nvarchar(max)")]
    public string? FaceVector { get; set; }

    public UserInfoEntity UserInfoEntity { get; set; } = null!;
    public CinemaInfoEntity CinemaInfoEntity { get; set; } = null!;
    public DepartmentEntity? DepartmentEntity { get; set; }

    public List<StaffWorkingLoggerEntity> StaffWorkingLoggerEntities { get; set; } = [];
    public List<StaffSalaryTotalLoggerEntity> StaffSalaryTotalLoggerEntities { get; set; } = [];
    public List<StaffShiftRegistrationEntity> StaffShiftRegistrationEntities { get; set; } = [];
}
