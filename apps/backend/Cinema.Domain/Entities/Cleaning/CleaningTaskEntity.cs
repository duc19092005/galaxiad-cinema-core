using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Cinema.Domain.Entities.CinemaInfos;
using Cinema.Domain.Entities.MovieInfos;
using Cinema.Domain.Entities.UserInfos;
using Cinema.Domain.Enums;
// ReSharper disable All

namespace Cinema.Domain.Entities.Cleaning;

/// <summary>
/// Nhiệm vụ quét dọn một phòng chiếu.
///
/// Với loại PostShowtime, task được sinh tự động từ lịch chiếu: mỗi suất kết thúc
/// sinh một task, và DueAt được đặt bằng giờ bắt đầu của suất kế tiếp trong cùng phòng,
/// phản ánh ràng buộc thực tế là phòng phải sạch trước khi khách suất sau vào.
/// </summary>
public class CleaningTaskEntity
{
    [Key]
    public Guid CleaningTaskId { get; set; }

    [ForeignKey("CinemaInfoEntity")]
    public Guid CinemaId { get; set; }

    [ForeignKey("AuditoriumInfoEntities")]
    public Guid AuditoriumId { get; set; }

    /// <summary>Suất chiếu vừa kết thúc mà task này dọn sau đó</summary>
    [ForeignKey("MovieScheduleInfoEntity")]
    public Guid? MovieScheduleId { get; set; }

    /// <summary>Ca làm việc mà task này thuộc về</summary>
    [ForeignKey("CinemaShiftScheduleEntity")]
    public Guid? ShiftScheduleId { get; set; }

    /// <summary>Nhân viên được gán. Null nghĩa là chưa ai nhận</summary>
    [ForeignKey("AssignedStaff")]
    public Guid? AssignedStaffId { get; set; }

    public CleaningTaskStatus Status { get; set; } = CleaningTaskStatus.Pending;

    public CleaningTaskType TaskType { get; set; } = CleaningTaskType.PostShowtime;

    /// <summary>Số càng lớn càng ưu tiên</summary>
    public int Priority { get; set; } = 0;

    /// <summary>Giờ dự kiến bắt đầu dọn</summary>
    public DateTime ScheduledAt { get; set; }

    /// <summary>Hạn phải hoàn thành, thường là giờ bắt đầu suất chiếu kế tiếp</summary>
    public DateTime? DueAt { get; set; }

    public DateTime? StartedAt { get; set; }

    public DateTime? CompletedAt { get; set; }

    public Guid? VerifiedByUserId { get; set; }

    public DateTime? VerifiedAt { get; set; }

    [Column(TypeName = "nvarchar(1000)")]
    public string? Note { get; set; }

    /// <summary>Ảnh nhân viên chụp lại sau khi dọn xong</summary>
    [Column(TypeName = "nvarchar(500)")]
    public string? ProofImageUrl { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public CinemaInfoEntity CinemaInfoEntity { get; set; } = null!;
    public AuditoriumInfoEntities AuditoriumInfoEntities { get; set; } = null!;
    public MovieScheduleInfoEntity? MovieScheduleInfoEntity { get; set; }
    public CinemaShiftScheduleEntity? CinemaShiftScheduleEntity { get; set; }
    public StaffProfileEntity? AssignedStaff { get; set; }
    public UserInfoEntity? VerifiedByUser { get; set; }
}
