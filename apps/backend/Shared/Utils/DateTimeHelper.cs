namespace Shared.Utils;

/// <summary>
/// Helper để xử lý chuyển đổi giữa múi giờ Việt Nam (UTC+7) và UTC.
/// Quy tắc:
/// - FE gửi lên: giờ Việt Nam (UTC+7)
/// - DB lưu: UTC
/// - Trả về FE: giờ Việt Nam (UTC+7)
/// - So sánh nội bộ: DateTime.UtcNow
/// </summary>
public static class DateTimeHelper
{
    private static TimeZoneInfo GetVietnamTimeZone()
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

    /// <summary>
    /// Chuyển giờ Việt Nam (Unspecified/Local) sang UTC
    /// </summary>
    public static DateTime ToUtc(DateTime vietnamTime)
    {
        if (vietnamTime.Kind == DateTimeKind.Utc)
            return vietnamTime;

        var unspecified = DateTime.SpecifyKind(vietnamTime, DateTimeKind.Unspecified);
        return TimeZoneInfo.ConvertTimeToUtc(unspecified, GetVietnamTimeZone());
    }

    /// <summary>
    /// Chuyển nullable giờ Việt Nam sang UTC
    /// </summary>
    public static DateTime? ToUtc(DateTime? vietnamTime)
    {
        return vietnamTime.HasValue ? ToUtc(vietnamTime.Value) : null;
    }

    /// <summary>
    /// Chuyển UTC sang giờ Việt Nam
    /// </summary>
    public static DateTime ToVietnamTime(DateTime utcTime)
    {
        if (utcTime.Kind == DateTimeKind.Unspecified)
            utcTime = DateTime.SpecifyKind(utcTime, DateTimeKind.Utc);
        return TimeZoneInfo.ConvertTimeFromUtc(utcTime, GetVietnamTimeZone());
    }

    /// <summary>
    /// Chuyển nullable UTC sang giờ Việt Nam
    /// </summary>
    public static DateTime? ToVietnamTime(DateTime? utcTime)
    {
        return utcTime.HasValue ? ToVietnamTime(utcTime.Value) : null;
    }

    /// <summary>
    /// Normalize giá trị đầu vào từ FE (giờ Việt Nam Unspecified) sang UTC trước khi lưu DB.
    /// </summary>
    public static DateTime NormalizeIncoming(DateTime value)
    {
        return value.Kind switch
        {
            DateTimeKind.Utc => value,
            DateTimeKind.Local => value.ToUniversalTime(),
            _ => ToUtc(value) // Unspecified → coi là giờ Việt Nam
        };
    }

    /// <summary>
    /// Normalize nullable giá trị đầu vào từ FE sang UTC
    /// </summary>
    public static DateTime? NormalizeIncoming(DateTime? value)
    {
        return value.HasValue ? NormalizeIncoming(value.Value) : null;
    }
}
