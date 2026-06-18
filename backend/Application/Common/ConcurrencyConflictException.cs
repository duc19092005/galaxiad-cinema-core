namespace Application.Common;

/// <summary>
/// Báo hiệu xung đột ghi đồng thời (ví dụ: vi phạm unique key do 2 request cùng đặt 1 ghế).
/// Infrastructure ném ra khi bắt được lỗi tương ứng từ DB; UseCase ánh xạ sang lỗi nghiệp vụ.
/// </summary>
public class ConcurrencyConflictException : Exception
{
    public ConcurrencyConflictException(string message, Exception? inner = null)
        : base(message, inner) { }
}
