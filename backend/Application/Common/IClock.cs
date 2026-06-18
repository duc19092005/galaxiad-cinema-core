namespace Application.Common;

/// <summary>
/// Cổng thời gian — tách logic khỏi DateTime.Now tĩnh để chuẩn hoá múi giờ và test được.
/// Khắc phục B4 (trộn DateTime.Now và UtcNow).
/// </summary>
public interface IClock
{
    /// <summary>Thời điểm hiện tại theo UTC.</summary>
    DateTime UtcNow { get; }

    /// <summary>Thời điểm hiện tại theo giờ Việt Nam (UTC+7).</summary>
    DateTime VietnamNow { get; }
}
