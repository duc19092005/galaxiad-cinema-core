using Application.Common;

namespace Infrastructure.Common;

/// <summary>
/// Đồng hồ hệ thống. VietnamNow luôn quy đổi từ UTC để nhất quán dù server chạy ở múi giờ nào (fix B4).
/// </summary>
public class SystemClock : IClock
{
    private static readonly TimeZoneInfo VietnamTimeZone = ResolveVietnamTimeZone();

    public DateTime UtcNow => DateTime.UtcNow;

    public DateTime VietnamNow => TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, VietnamTimeZone);

    private static TimeZoneInfo ResolveVietnamTimeZone()
    {
        try
        {
            return TimeZoneInfo.FindSystemTimeZoneById("SE Asia Standard Time"); // Windows
        }
        catch (TimeZoneNotFoundException)
        {
            return TimeZoneInfo.FindSystemTimeZoneById("Asia/Ho_Chi_Minh"); // Linux/Mac
        }
    }
}
