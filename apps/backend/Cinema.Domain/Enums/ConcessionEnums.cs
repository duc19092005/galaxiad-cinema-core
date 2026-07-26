namespace Cinema.Domain.Enums;

/// <summary>Phân loại sản phẩm bắp nước / đồ ăn kèm của rạp.</summary>
public enum ConcessionCategory
{
    /// <summary>Bắp rang</summary>
    Popcorn = 0,

    /// <summary>Nước uống</summary>
    Drink = 1,

    /// <summary>Đồ ăn vặt (snack, khoai tây, hotdog...)</summary>
    Snack = 2,

    /// <summary>Đồ lưu niệm (ly, poster...)</summary>
    Merchandise = 3,

    /// <summary>Combo gồm nhiều sản phẩm con</summary>
    Combo = 4
}

/// <summary>Đơn vị bán của sản phẩm F&amp;B.</summary>
public enum ConcessionUnit
{
    /// <summary>Cái / phần</summary>
    Piece = 0,

    /// <summary>Ly / cốc</summary>
    Cup = 1,

    /// <summary>Hộp</summary>
    Box = 2,

    /// <summary>Combo</summary>
    Combo = 3
}

/// <summary>Loại giao dịch biến động tồn kho (sổ cái kho).</summary>
public enum InventoryTransactionType
{
    /// <summary>Nhập kho</summary>
    Restock = 0,

    /// <summary>Bán hàng (đã chốt, trừ tồn thực)</summary>
    Sale = 1,

    /// <summary>Giữ hàng cho đơn online chưa thanh toán</summary>
    Reserve = 2,

    /// <summary>Trả hàng đã giữ về kho (đơn hủy / hết hạn thanh toán)</summary>
    ReleaseReservation = 3,

    /// <summary>Hủy hàng hỏng / hết hạn sử dụng</summary>
    Waste = 4,

    /// <summary>Điều chỉnh thủ công</summary>
    Adjustment = 5,

    /// <summary>Kiểm kê thực tế</summary>
    StockCount = 6,

    /// <summary>Khách trả hàng</summary>
    Return = 7
}

/// <summary>
/// Trạng thái tồn kho của một dòng đồ ăn thức uống trong đơn hàng.
///
/// Ba trạng thái này loại trừ nhau, nên dùng enum thay vì nhiều cờ boolean
/// để không thể biểu diễn được các tổ hợp vô nghĩa.
/// </summary>
public enum ConcessionStockState
{
    /// <summary>
    /// Hàng đang được giữ cho đơn chưa thanh toán, chưa trừ tồn thực.
    ///
    /// Để làm giá trị mặc định vì đây là trạng thái an toàn nhất: nếu quên cập nhật,
    /// hàng vẫn được nhả về kho chứ không bị trừ oan.
    /// </summary>
    Reserved = 0,

    /// <summary>Đã trừ tồn thực. Áp dụng cho đơn online đã thanh toán và đơn bán tại quầy.</summary>
    Committed = 1,

    /// <summary>Đã trả hàng đang giữ về kho vì đơn bị hủy hoặc hết hạn thanh toán.</summary>
    Released = 2
}

/// <summary>Trạng thái yêu cầu nhập hàng F&B từ rạp tới kho tổng.</summary>
public enum StockRequestStatus
{
    /// <summary>Mới tạo, chờ quản lý kho duyệt</summary>
    Pending = 0,

    /// <summary>Kho tổng đã duyệt yêu cầu (có thể điều chỉnh số lượng xuất)</summary>
    Approved = 1,

    /// <summary>Kho tổng đã xuất hàng & vận chuyển</summary>
    Shipped = 2,

    /// <summary>Rạp đã nhận hàng & kiểm đếm xong (tồn kho rạp tăng)</summary>
    Received = 3,

    /// <summary>Kho tổng từ chối yêu cầu</summary>
    Rejected = 4,

    /// <summary>Rạp hủy yêu cầu khi chưa ship</summary>
    Cancelled = 5
}

/// <summary>Trạng thái báo cáo hàng hỏng / hao hụt tại rạp.</summary>
public enum WasteReportStatus
{
    /// <summary>Chờ quản lý kho duyệt trừ tồn</summary>
    Pending = 0,

    /// <summary>Đã duyệt hủy hàng (tồn kho rạp giảm)</summary>
    Approved = 1,

    /// <summary>Từ chối duyệt hủy</summary>
    Rejected = 2
}

