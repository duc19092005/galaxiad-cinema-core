using Cinema.Domain.Entities.Concessions;

namespace Cinema.Application.Interfaces.Concessions;

/// <summary>Truy vấn tồn kho hiện tại và lịch sử biến động (sổ cái), chỉ đọc.</summary>
public interface IInventoryRepository
{
    Task<ConcessionInventoryEntity?> GetInventoryAsync(Guid productId);
    Task<List<ConcessionInventoryEntity>> GetInventoriesAsync(IEnumerable<Guid> productIds);
    Task<List<ConcessionInventoryEntity>> GetLowStockInventoriesAsync(Guid cinemaId);
    Task AddTransactionAsync(InventoryTransactionEntity transaction);
    Task<List<InventoryTransactionEntity>> GetTransactionHistoryAsync(
        Guid cinemaId,
        Guid? productId,
        Domain.Enums.InventoryTransactionType? type,
        DateTime? fromDate,
        DateTime? toDate,
        int page,
        int pageSize);
    Task<int> CountTransactionHistoryAsync(
        Guid cinemaId,
        Guid? productId,
        Domain.Enums.InventoryTransactionType? type,
        DateTime? fromDate,
        DateTime? toDate);
    Task<List<OrderConcessionDetailEntity>> GetOrderConcessionDetailsAsync(Guid orderId);
    Task AddOrderConcessionDetailsAsync(IEnumerable<OrderConcessionDetailEntity> details);
}
