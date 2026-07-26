namespace Cinema.Domain.Enums;

/// <summary>Trạng thái vòng đời của một nhiệm vụ quét dọn.</summary>
public enum CleaningTaskStatus
{
    /// <summary>Mới sinh, chưa gán cho ai</summary>
    Pending = 0,

    /// <summary>Đã gán cho nhân viên</summary>
    Assigned = 1,

    /// <summary>Nhân viên đang dọn</summary>
    InProgress = 2,

    /// <summary>Nhân viên báo đã dọn xong</summary>
    Completed = 3,

    /// <summary>Quản lý đã xác nhận kết quả</summary>
    Verified = 4,

    /// <summary>Bỏ qua (suất chiếu hủy, phòng bảo trì...)</summary>
    Skipped = 5
}

/// <summary>Loại nhiệm vụ quét dọn.</summary>
public enum CleaningTaskType
{
    /// <summary>Dọn phòng chiếu sau suất chiếu</summary>
    PostShowtime = 0,

    /// <summary>Dọn định kỳ theo ca</summary>
    Routine = 1,

    /// <summary>Tổng vệ sinh</summary>
    Deep = 2,

    /// <summary>Dọn nhà vệ sinh</summary>
    Restroom = 3,

    /// <summary>Dọn sảnh chờ</summary>
    Lobby = 4
}
