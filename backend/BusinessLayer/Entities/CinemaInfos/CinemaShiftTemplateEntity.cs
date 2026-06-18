using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using BusinessLayer.Entities.UserInfos;
// ReSharper disable All

namespace BusinessLayer.Entities.CinemaInfos;

public class CinemaShiftTemplateEntity
{
    [Key]
    public Guid ShiftTemplateId { get; set; }

    [ForeignKey("CinemaInfoEntity")]
    public Guid CinemaId { get; set; }

    [Required]
    [Column(TypeName = "nvarchar(50)")]
    public string ShiftName { get; set; } = string.Empty;

    public TimeSpan StartTime { get; set; }

    public TimeSpan EndTime { get; set; }

    public int MaxStaff { get; set; } = 2;

    [ForeignKey("RoleListInfoEntity")]
    public Guid RoleId { get; set; }

    public bool IsActive { get; set; } = true;

    public CinemaInfoEntity CinemaInfoEntity { get; set; } = null!;
    public RoleListInfoEntity RoleListInfoEntity { get; set; } = null!;

    public List<StaffShiftRegistrationEntity> StaffShiftRegistrationEntities { get; set; } = [];
}
