using Cinema.Application.Dtos.Concessions;
using Cinema.Domain.Entities.Concessions;
using Cinema.Domain.Enums;

namespace Cinema.Application.Interfaces.Concessions;

/// <summary>
/// Điều phối mọi thay đổi tồn kho F&amp;B qua cơ chế giữ hàng 3 pha
/// (Reserve → Commit/Release), luôn ghi kèm dòng sổ cái <see cref="InventoryTransactionEntity"/>
/// và dùng <see cref="Application.Interfaces.IThirdPersonServices.IRedisLockService"/> để chặn
/// hai giao dịch cùng ghi đè một sản phẩm.
/// </summary>
public interface IInventoryStockService
{
    /// <summary>
    /// Kiểm tra tồn kho khả dụng cho danh sách sản phẩm (bung combo thành các thành phần con).
    /// Không khóa, không thay đổi dữ liệu — dùng để hiển thị trước cho khách/nhân viên.
    /// </summary>
    Task<ResConcessionStockCheckResultDto> CheckStockAsync(Guid cinemaId, List<ReqConcessionItemDto> items);

    /// <summary>
    /// Giữ hàng cho các sản phẩm (dùng khi đặt online kèm vé, đơn ở trạng thái Pending).
    /// Nếu bất kỳ sản phẩm nào không đủ hàng, toàn bộ thao tác bị hủy và
    /// <see cref="Cinema.Application.Exceptions.ConcessionOutOfStockException"/> được ném ra kèm gợi ý thay thế.
    /// </summary>
    Task ReserveAsync(Guid cinemaId, List<ReqConcessionItemDto> items, Guid orderId, Guid? performedByUserId);

    /// <summary>
    /// Chốt bán: chuyển từ Reserved sang Committed, thực sự trừ tồn kho thực (OnHand).
    /// Dùng khi đơn thanh toán thành công (VNPay callback) hoặc bán trực tiếp tại quầy (không qua Reserve).
    /// </summary>
    Task CommitAsync(Guid orderId, Guid? performedByUserId);

    /// <summary>
    /// Bán trực tiếp tại quầy: giữ hàng rồi chốt bán ngay trong một thao tác (không có bước Pending).
    /// </summary>
    Task<decimal> SellDirectAsync(Guid cinemaId, List<ReqConcessionItemDto> items, Guid orderId, Guid? performedByUserId);

    /// <summary>
    /// Nhả hàng đã giữ về kho (đơn bị hủy hoặc hết hạn thanh toán).
    /// </summary>
    Task ReleaseAsync(Guid orderId);

    Task RestockAsync(Guid productId, int quantity, Guid? performedByUserId, string? note);

    Task AdjustAsync(Guid productId, int quantityChange, InventoryTransactionType type, Guid? performedByUserId, string? note);

    Task StockCountAsync(Guid productId, int countedQuantity, Guid? performedByUserId, string? note);
}
