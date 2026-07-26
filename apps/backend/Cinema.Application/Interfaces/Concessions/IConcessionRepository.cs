using Cinema.Domain.Entities.Concessions;

namespace Cinema.Application.Interfaces.Concessions;

/// <summary>
/// Truy vấn/ghi dữ liệu sản phẩm F&amp;B (bắp nước) và combo.
/// Không chứa logic tồn kho — việc đó thuộc về <see cref="IInventoryStockService"/>.
/// </summary>
public interface IConcessionRepository
{
    Task<ConcessionProductEntity?> GetProductByIdAsync(Guid productId);
    Task<ConcessionProductEntity?> GetProductWithInventoryAsync(Guid productId);
    Task<ConcessionProductEntity?> GetProductWithComboItemsAsync(Guid productId);
    Task<List<ConcessionProductEntity>> GetProductsByIdsWithInventoryAsync(IEnumerable<Guid> productIds);
    Task<bool> SkuExistsAsync(Guid cinemaId, string sku);
    Task<List<ConcessionProductEntity>> GetCinemaMenuAsync(Guid cinemaId, bool onlineOnly);
    Task<List<ConcessionProductEntity>> GetCinemaProductsAsync(Guid cinemaId);
    Task AddProductAsync(ConcessionProductEntity product);
    void UpdateProduct(ConcessionProductEntity product);
    Task AddComboItemsAsync(IEnumerable<ConcessionComboItemEntity> comboItems);
    Task<List<ConcessionComboItemEntity>> GetComboItemsAsync(Guid comboProductId);

    /// <summary>Lấy danh sách gợi ý sản phẩm cùng danh mục còn hàng, để đề xuất thay thế khi hết hàng</summary>
    Task<List<ConcessionProductEntity>> GetSubstituteCandidatesAsync(Guid cinemaId, Domain.Enums.ConcessionCategory category, Guid excludeProductId, int take = 3);
}
