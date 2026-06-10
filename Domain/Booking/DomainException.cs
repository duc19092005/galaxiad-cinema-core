namespace Domain.Booking;

/// <summary>
/// Ngoại lệ khi vi phạm quy tắc nghiệp vụ ở tầng Domain.
/// Tầng Application/Api sẽ ánh xạ sang lỗi HTTP phù hợp.
/// </summary>
public class DomainException : Exception
{
    public DomainException(string message) : base(message) { }
}
