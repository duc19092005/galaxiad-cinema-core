using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Cinema.Domain.Entities.CinemaInfos;
// ReSharper disable All

namespace Cinema.Domain.Entities.UserInfos;

public class StaffShiftRegistrationEntity
{
    [Key]
    public Guid ShiftRegistrationId { get; set; }

    [ForeignKey("StaffProfileEntity")]
    public Guid StaffId { get; set; }

    [ForeignKey("CinemaShiftTemplateEntity")]
    public Guid? ShiftTemplateId { get; set; }

    [ForeignKey("CinemaShiftScheduleEntity")]
    public Guid? ShiftScheduleId { get; set; }

    public DateTime RegistrationDate { get; set; }

    [Column(TypeName = "varchar(20)")]
    public string Status { get; set; } = "Pending";

    public Guid? ApprovedByUserId { get; set; }

    public DateTime? ApprovedAt { get; set; }

    [Column(TypeName = "nvarchar(500)")]
    public string? Notes { get; set; }

    public StaffProfileEntity StaffProfileEntity { get; set; } = null!;
    public CinemaShiftTemplateEntity? CinemaShiftTemplateEntity { get; set; }
    public CinemaShiftScheduleEntity? CinemaShiftScheduleEntity { get; set; }
    public UserInfoEntity? ApprovedByUser { get; set; }
}
