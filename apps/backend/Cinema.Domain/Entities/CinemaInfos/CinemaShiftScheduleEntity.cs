using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Cinema.Domain.Entities.UserInfos;

namespace Cinema.Domain.Entities.CinemaInfos;

public class CinemaShiftScheduleEntity
{
    [Key]
    public Guid ShiftScheduleId { get; set; }

    [ForeignKey("CinemaInfoEntity")]
    public Guid CinemaId { get; set; }

    [ForeignKey("DepartmentEntity")]
    public Guid DepartmentId { get; set; }

    public DateTime Date { get; set; }

    [Required]
    [Column(TypeName = "nvarchar(50)")]
    public string ShiftName { get; set; } = string.Empty;

    public TimeSpan StartTime { get; set; }

    public TimeSpan EndTime { get; set; }

    public int MaxStaff { get; set; } = 2;

    [ForeignKey("RoleListInfoEntity")]
    public Guid RoleId { get; set; }

    public bool IsActive { get; set; } = true;

    // Admin Deletion Request Flow
    [Column(TypeName = "varchar(30)")]
    public string DeletionStatus { get; set; } = "Active"; // "Active", "PendingDeletion", "Deleted"

    [Column(TypeName = "nvarchar(500)")]
    public string? DeletionReason { get; set; }

    public Guid? DeletionRequestedByUserId { get; set; }

    public DateTime? DeletionRequestedAt { get; set; }

    // Relationships
    public CinemaInfoEntity CinemaInfoEntity { get; set; } = null!;
    public DepartmentEntity DepartmentEntity { get; set; } = null!;
    public RoleListInfoEntity RoleListInfoEntity { get; set; } = null!;
    public List<StaffShiftRegistrationEntity> StaffShiftRegistrationEntities { get; set; } = [];
}
