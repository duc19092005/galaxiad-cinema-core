using Cinema.Application.Dtos.Concessions;
using Cinema.Domain.Localization;

namespace Cinema.Application.Exceptions;

/// <summary>
/// Hết hàng F&amp;B khi giữ kho (Reserve). Khác các lỗi thông thường: mang theo payload
/// <see cref="Conflicts"/> để FE hiển thị modal "Món này đã hết — bạn muốn chọn món khác?"
/// kèm danh sách gợi ý, thay vì chỉ hiện một thông báo lỗi khô khan.
/// </summary>
public class ConcessionOutOfStockException : AppException
{
    public List<ConcessionStockConflictDto> Conflicts { get; }

    public ConcessionOutOfStockException(List<ConcessionStockConflictDto> conflicts)
        : base(Messages.Concession.OutOfStockChooseAnother, 409, "BK14")
    {
        Conflicts = conflicts;
    }
}
