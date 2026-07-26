using Cinema.Application.Dtos.Concessions;
using Cinema.Application.Exceptions;
using Cinema.Application.Interfaces.Concessions;
using Cinema.Application.Interfaces.IThirdPersonServices;
using Cinema.Domain.Entities.Concessions;
using Cinema.Domain.Enums;
using Cinema.Domain.Interfaces.Persistence;
using Cinema.Domain.Localization;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Cinema.Infrastructure.ExternalServices.Concessions;

/// <summary>
/// Triển khai cơ chế giữ hàng 3 pha cho tồn kho F&amp;B.
///
/// Vì sao cần Redis lock: hai request bán hàng cùng lúc cho cùng sản phẩm có thể đọc
/// AvailableToSell &gt; 0 trước khi cái nào ghi xong, dẫn tới bán vượt tồn (oversell).
/// RowVersion (optimistic concurrency) của EF chỉ phát hiện xung đột SAU KHI đã tính toán xong,
/// gây lãng phí round-trip và trải nghiệm xấu (phải retry toàn bộ request).
/// Do đó dùng Redis distributed lock theo từng ProductId để tuần tự hóa ghi tồn kho ngay từ đầu,
/// còn RowVersion đóng vai trò lưới an toàn cuối cùng nếu lock bị mất do timeout.
/// </summary>
public class InventoryStockService : IInventoryStockService
{
    private const int LockTimeoutMs = 5000;
    private static readonly TimeSpan LockExpiration = TimeSpan.FromSeconds(10);

    private readonly IUnitOfWork _unitOfWork;
    private readonly IConcessionRepository _concessionRepository;
    private readonly IInventoryRepository _inventoryRepository;
    private readonly IRedisLockService _redisLockService;
    private readonly ILogger<InventoryStockService> _logger;

    public InventoryStockService(
        IUnitOfWork unitOfWork,
        IConcessionRepository concessionRepository,
        IInventoryRepository inventoryRepository,
        IRedisLockService redisLockService,
        ILogger<InventoryStockService> logger)
    {
        _unitOfWork = unitOfWork;
        _concessionRepository = concessionRepository;
        _inventoryRepository = inventoryRepository;
        _redisLockService = redisLockService;
        _logger = logger;
    }

    // ==========================================================
    // Public API
    // ==========================================================

    public async Task<ResConcessionStockCheckResultDto> CheckStockAsync(Guid cinemaId, List<ReqConcessionItemDto> items)
    {
        var (lines, products) = await DecomposeAsync(items);
        var conflicts = new List<ConcessionStockConflictDto>();

        foreach (var line in lines)
        {
            var product = products[line.ProductId];
            var available = product.Inventory?.AvailableToSell ?? 0;
            if (available < line.RequiredQuantity)
            {
                conflicts.Add(await BuildConflictAsync(cinemaId, product, line.RequiredQuantity, available));
            }
        }

        return new ResConcessionStockCheckResultDto
        {
            AllAvailable = conflicts.Count == 0,
            Conflicts = conflicts
        };
    }

    public async Task ReserveAsync(Guid cinemaId, List<ReqConcessionItemDto> items, Guid orderId, Guid? performedByUserId)
    {
        await MutateWithLocksAsync(cinemaId, items, orderId, performedByUserId, commitImmediately: false);
    }

    public async Task<decimal> SellDirectAsync(Guid cinemaId, List<ReqConcessionItemDto> items, Guid orderId, Guid? performedByUserId)
    {
        var totalAmount = await GetOrderAmountAsync(items);
        await MutateWithLocksAsync(cinemaId, items, orderId, performedByUserId, commitImmediately: true);
        return totalAmount;
    }

    public async Task CommitAsync(Guid orderId, Guid? performedByUserId)
    {
        var details = await _inventoryRepository.GetOrderConcessionDetailsAsync(orderId);
        var reserved = details.Where(d => d.StockState == ConcessionStockState.Reserved).ToList();
        if (reserved.Count == 0) return;

        var lockTokens = new List<(string key, string token)>();
        try
        {
            foreach (var detail in reserved.OrderBy(d => d.ProductId))
            {
                var token = await AcquireLockOrThrowAsync(detail.ProductId);
                lockTokens.Add((LockKey(detail.ProductId), token));
            }

            foreach (var detail in reserved)
            {
                var inventory = await _inventoryRepository.GetInventoryAsync(detail.ProductId);
                if (inventory == null) continue;

                inventory.QuantityOnHand -= detail.Quantity;
                if (inventory.QuantityOnHand < 0) inventory.QuantityOnHand = 0;
                inventory.QuantityReserved -= detail.Quantity;
                if (inventory.QuantityReserved < 0) inventory.QuantityReserved = 0;
                inventory.UpdatedAt = DateTime.UtcNow;

                detail.StockState = ConcessionStockState.Committed;

                await _inventoryRepository.AddTransactionAsync(new InventoryTransactionEntity
                {
                    TransactionId = Guid.NewGuid(),
                    ProductId = detail.ProductId,
                    CinemaId = detail.ConcessionProductEntity.CinemaId,
                    TransactionType = InventoryTransactionType.Sale,
                    QuantityChange = -detail.Quantity,
                    QuantityOnHandAfter = inventory.QuantityOnHand,
                    QuantityReservedAfter = inventory.QuantityReserved,
                    OrderId = orderId,
                    PerformedByUserId = performedByUserId,
                    Note = "Commit sale on payment success",
                    OccurredAt = DateTime.UtcNow
                });
            }

            await _unitOfWork.SaveChangesAsync();
        }
        finally
        {
            foreach (var (key, token) in lockTokens)
            {
                await _redisLockService.ReleaseLockAsync(key, token);
            }
        }
    }

    public async Task ReleaseAsync(Guid orderId)
    {
        var details = await _inventoryRepository.GetOrderConcessionDetailsAsync(orderId);
        var reserved = details.Where(d => d.StockState == ConcessionStockState.Reserved).ToList();
        if (reserved.Count == 0) return;

        var lockTokens = new List<(string key, string token)>();
        try
        {
            foreach (var detail in reserved.OrderBy(d => d.ProductId))
            {
                var token = await AcquireLockOrThrowAsync(detail.ProductId);
                lockTokens.Add((LockKey(detail.ProductId), token));
            }

            foreach (var detail in reserved)
            {
                var inventory = await _inventoryRepository.GetInventoryAsync(detail.ProductId);
                if (inventory == null) continue;

                inventory.QuantityReserved -= detail.Quantity;
                if (inventory.QuantityReserved < 0) inventory.QuantityReserved = 0;
                inventory.UpdatedAt = DateTime.UtcNow;

                detail.StockState = ConcessionStockState.Released;

                await _inventoryRepository.AddTransactionAsync(new InventoryTransactionEntity
                {
                    TransactionId = Guid.NewGuid(),
                    ProductId = detail.ProductId,
                    CinemaId = detail.ConcessionProductEntity.CinemaId,
                    TransactionType = InventoryTransactionType.ReleaseReservation,
                    QuantityChange = detail.Quantity,
                    QuantityOnHandAfter = inventory.QuantityOnHand,
                    QuantityReservedAfter = inventory.QuantityReserved,
                    OrderId = orderId,
                    PerformedByUserId = null,
                    Note = "Order canceled/expired, released reservation",
                    OccurredAt = DateTime.UtcNow
                });
            }

            await _unitOfWork.SaveChangesAsync();
        }
        finally
        {
            foreach (var (key, token) in lockTokens)
            {
                await _redisLockService.ReleaseLockAsync(key, token);
            }
        }
    }

    public async Task RestockAsync(Guid productId, int quantity, Guid? performedByUserId, string? note)
    {
        var token = await AcquireLockOrThrowAsync(productId);
        try
        {
            var inventory = await _inventoryRepository.GetInventoryAsync(productId)
                ?? throw new AppException(Messages.Inventory.InventoryNotFound, 404, "INV01");

            inventory.QuantityOnHand += quantity;
            inventory.LastRestockedAt = DateTime.UtcNow;
            inventory.UpdatedAt = DateTime.UtcNow;

            await _inventoryRepository.AddTransactionAsync(new InventoryTransactionEntity
            {
                TransactionId = Guid.NewGuid(),
                ProductId = productId,
                CinemaId = (await _concessionRepository.GetProductByIdAsync(productId))!.CinemaId,
                TransactionType = InventoryTransactionType.Restock,
                QuantityChange = quantity,
                QuantityOnHandAfter = inventory.QuantityOnHand,
                QuantityReservedAfter = inventory.QuantityReserved,
                PerformedByUserId = performedByUserId,
                Note = note,
                OccurredAt = DateTime.UtcNow
            });

            await _unitOfWork.SaveChangesAsync();
        }
        finally
        {
            await _redisLockService.ReleaseLockAsync(LockKey(productId), token);
        }
    }

    public async Task AdjustAsync(Guid productId, int quantityChange, InventoryTransactionType type, Guid? performedByUserId, string? note)
    {
        var token = await AcquireLockOrThrowAsync(productId);
        try
        {
            var inventory = await _inventoryRepository.GetInventoryAsync(productId)
                ?? throw new AppException(Messages.Inventory.InventoryNotFound, 404, "INV01");

            var newOnHand = inventory.QuantityOnHand + quantityChange;
            if (newOnHand < 0)
            {
                throw new AppException(Messages.Inventory.InsufficientStock, 400, "INV02");
            }

            inventory.QuantityOnHand = newOnHand;
            inventory.UpdatedAt = DateTime.UtcNow;

            await _inventoryRepository.AddTransactionAsync(new InventoryTransactionEntity
            {
                TransactionId = Guid.NewGuid(),
                ProductId = productId,
                CinemaId = (await _concessionRepository.GetProductByIdAsync(productId))!.CinemaId,
                TransactionType = type,
                QuantityChange = quantityChange,
                QuantityOnHandAfter = inventory.QuantityOnHand,
                QuantityReservedAfter = inventory.QuantityReserved,
                PerformedByUserId = performedByUserId,
                Note = note,
                OccurredAt = DateTime.UtcNow
            });

            await _unitOfWork.SaveChangesAsync();
        }
        finally
        {
            await _redisLockService.ReleaseLockAsync(LockKey(productId), token);
        }
    }

    public async Task StockCountAsync(Guid productId, int countedQuantity, Guid? performedByUserId, string? note)
    {
        var token = await AcquireLockOrThrowAsync(productId);
        try
        {
            var inventory = await _inventoryRepository.GetInventoryAsync(productId)
                ?? throw new AppException(Messages.Inventory.InventoryNotFound, 404, "INV01");

            var difference = countedQuantity - inventory.QuantityOnHand;
            inventory.QuantityOnHand = countedQuantity;
            inventory.LastCountedAt = DateTime.UtcNow;
            inventory.UpdatedAt = DateTime.UtcNow;

            await _inventoryRepository.AddTransactionAsync(new InventoryTransactionEntity
            {
                TransactionId = Guid.NewGuid(),
                ProductId = productId,
                CinemaId = (await _concessionRepository.GetProductByIdAsync(productId))!.CinemaId,
                TransactionType = InventoryTransactionType.StockCount,
                QuantityChange = difference,
                QuantityOnHandAfter = inventory.QuantityOnHand,
                QuantityReservedAfter = inventory.QuantityReserved,
                PerformedByUserId = performedByUserId,
                Note = note,
                OccurredAt = DateTime.UtcNow
            });

            await _unitOfWork.SaveChangesAsync();
        }
        finally
        {
            await _redisLockService.ReleaseLockAsync(LockKey(productId), token);
        }
    }

    // ==========================================================
    // Internal helpers
    // ==========================================================

    private async Task<decimal> GetOrderAmountAsync(List<ReqConcessionItemDto> items)
    {
        var productIds = items.Select(i => i.ProductId).ToList();
        var products = await _concessionRepository.GetProductsByIdsWithInventoryAsync(productIds);
        decimal total = 0;
        foreach (var item in items)
        {
            var product = products.FirstOrDefault(p => p.ProductId == item.ProductId);
            if (product == null) continue;
            total += product.UnitPrice * item.Quantity;
        }
        return total;
    }

    /// <summary>
    /// Lõi dùng chung cho Reserve và SellDirect: khóa từng sản phẩm theo thứ tự ProductId cố định
    /// (tránh deadlock giữa các giao dịch khóa nhiều sản phẩm cùng lúc theo thứ tự khác nhau),
    /// kiểm tra đủ hàng, rồi ghi giữ/trừ kho + dòng sổ cái trong cùng một transaction DB.
    /// </summary>
    private async Task MutateWithLocksAsync(Guid cinemaId, List<ReqConcessionItemDto> items, Guid orderId, Guid? performedByUserId, bool commitImmediately)
    {
        if (items == null || items.Count == 0)
        {
            throw new AppException(Messages.Concession.NoItemsProvided, 400, "CON01");
        }

        var (lines, products) = await DecomposeAsync(items);
        var orderedProductIds = lines.Select(l => l.ProductId).Distinct().OrderBy(id => id).ToList();

        var lockTokens = new List<(string key, string token)>();
        try
        {
            foreach (var productId in orderedProductIds)
            {
                var token = await AcquireLockOrThrowAsync(productId);
                lockTokens.Add((LockKey(productId), token));
            }

            // Re-fetch fresh inventory snapshots now that we hold the locks, to avoid acting on stale reads.
            var freshInventories = await _inventoryRepository.GetInventoriesAsync(orderedProductIds);
            var inventoryMap = freshInventories.ToDictionary(i => i.ProductId, i => i);

            var conflicts = new List<ConcessionStockConflictDto>();
            foreach (var line in lines)
            {
                var available = inventoryMap.TryGetValue(line.ProductId, out var inv)
                    ? inv.AvailableToSell
                    : 0;

                if (available < line.RequiredQuantity)
                {
                    var product = products[line.ProductId];
                    conflicts.Add(await BuildConflictAsync(cinemaId, product, line.RequiredQuantity, available));
                }
            }

            if (conflicts.Count > 0)
            {
                throw new ConcessionOutOfStockException(conflicts);
            }

            var orderDetails = new List<OrderConcessionDetailEntity>();
            var transactions = new List<InventoryTransactionEntity>();
            var initialState = commitImmediately ? ConcessionStockState.Committed : ConcessionStockState.Reserved;

            foreach (var item in items)
            {
                var product = products[item.ProductId];

                if (!product.IsCombo)
                {
                    var inventory = inventoryMap[item.ProductId];

                    if (commitImmediately)
                    {
                        inventory.QuantityOnHand -= item.Quantity;
                    }
                    else
                    {
                        inventory.QuantityReserved += item.Quantity;
                    }
                    inventory.UpdatedAt = DateTime.UtcNow;

                    transactions.Add(new InventoryTransactionEntity
                    {
                        TransactionId = Guid.NewGuid(),
                        ProductId = product.ProductId,
                        CinemaId = cinemaId,
                        TransactionType = commitImmediately ? InventoryTransactionType.Sale : InventoryTransactionType.Reserve,
                        QuantityChange = -item.Quantity,
                        QuantityOnHandAfter = inventory.QuantityOnHand,
                        QuantityReservedAfter = inventory.QuantityReserved,
                        OrderId = orderId,
                        PerformedByUserId = performedByUserId,
                        Note = commitImmediately ? "POS direct sale" : "Reserved for pending order",
                        OccurredAt = DateTime.UtcNow
                    });
                }

                orderDetails.Add(new OrderConcessionDetailEntity
                {
                    OrderConcessionDetailId = Guid.NewGuid(),
                    OrderId = orderId,
                    ProductId = product.ProductId,
                    Quantity = item.Quantity,
                    UnitPriceSnapshot = product.UnitPrice,
                    LineTotal = product.UnitPrice * item.Quantity,
                    ProductNameSnapshot = product.ProductName,
                    StockState = initialState
                });
            }

            // Combo component consumption also needs its own ledger rows, decomposed separately below
            // (handled implicitly since `lines` already reflects decomposed component quantities and
            // inventory changes for combo components are applied via the aggregated `lines` pass).
            await ApplyComponentOnlyAdjustmentsAsync(items, products, inventoryMap, cinemaId, orderId, performedByUserId, commitImmediately, transactions);

            await _inventoryRepository.AddOrderConcessionDetailsAsync(orderDetails);
            foreach (var tx in transactions)
            {
                await _inventoryRepository.AddTransactionAsync(tx);
            }

            await _unitOfWork.SaveChangesAsync();
        }
        finally
        {
            foreach (var (key, token) in lockTokens)
            {
                await _redisLockService.ReleaseLockAsync(key, token);
            }
        }
    }

    /// <summary>
    /// Với combo, OrderConcessionDetail chỉ ghi 1 dòng cho chính sản phẩm combo (để hóa đơn dễ đọc),
    /// nhưng tồn kho thực tế phải trừ ở các thành phần con. Hàm này áp dụng thay đổi tồn kho
    /// cho các thành phần con của combo và ghi sổ cái riêng cho từng thành phần.
    /// </summary>
    private async Task ApplyComponentOnlyAdjustmentsAsync(
        List<ReqConcessionItemDto> items,
        Dictionary<Guid, ConcessionProductEntity> products,
        Dictionary<Guid, ConcessionInventoryEntity> inventoryMap,
        Guid cinemaId,
        Guid orderId,
        Guid? performedByUserId,
        bool commitImmediately,
        List<InventoryTransactionEntity> transactions)
    {
        foreach (var item in items)
        {
            var product = products[item.ProductId];
            if (!product.IsCombo || product.ComboItems.Count == 0) continue;

            foreach (var comboItem in product.ComboItems)
            {
                var componentInventory = inventoryMap.TryGetValue(comboItem.ComponentProductId, out var inv)
                    ? inv
                    : throw new AppException(Messages.Inventory.InventoryNotFound, 404, "INV01");

                var requiredQty = comboItem.Quantity * item.Quantity;

                if (commitImmediately)
                {
                    componentInventory.QuantityOnHand -= requiredQty;
                }
                else
                {
                    componentInventory.QuantityReserved += requiredQty;
                }
                componentInventory.UpdatedAt = DateTime.UtcNow;

                transactions.Add(new InventoryTransactionEntity
                {
                    TransactionId = Guid.NewGuid(),
                    ProductId = comboItem.ComponentProductId,
                    CinemaId = cinemaId,
                    TransactionType = commitImmediately ? InventoryTransactionType.Sale : InventoryTransactionType.Reserve,
                    QuantityChange = -requiredQty,
                    QuantityOnHandAfter = componentInventory.QuantityOnHand,
                    QuantityReservedAfter = componentInventory.QuantityReserved,
                    OrderId = orderId,
                    PerformedByUserId = performedByUserId,
                    Note = $"Combo component of {product.ProductName}",
                    OccurredAt = DateTime.UtcNow
                });
            }
        }
    }

    /// <summary>
    /// Bung mỗi item yêu cầu thành các dòng tồn kho thực tế cần kiểm tra: sản phẩm thường giữ nguyên,
    /// combo được bung thành tổng nhu cầu của từng thành phần con (gộp số lượng nếu trùng sản phẩm).
    /// </summary>
    private async Task<(List<DecomposedLine> lines, Dictionary<Guid, ConcessionProductEntity> products)> DecomposeAsync(List<ReqConcessionItemDto> items)
    {
        var productIds = items.Select(i => i.ProductId).ToList();
        var products = await _concessionRepository.GetProductsByIdsWithInventoryAsync(productIds);
        var productMap = products.ToDictionary(p => p.ProductId, p => p);

        foreach (var item in items)
        {
            if (!productMap.ContainsKey(item.ProductId))
            {
                throw new AppException(Messages.Concession.ProductNotFound, 404, "CON02");
            }
        }

        var aggregated = new Dictionary<Guid, int>();

        void AddRequirement(Guid productId, int quantity)
        {
            aggregated[productId] = aggregated.TryGetValue(productId, out var existing) ? existing + quantity : quantity;
        }

        foreach (var item in items)
        {
            var product = productMap[item.ProductId];
            if (product.IsCombo && product.ComboItems.Count > 0)
            {
                foreach (var comboItem in product.ComboItems)
                {
                    AddRequirement(comboItem.ComponentProductId, comboItem.Quantity * item.Quantity);

                    // ensure component product data is available for conflict messages
                    if (!productMap.ContainsKey(comboItem.ComponentProductId) && comboItem.ComponentProduct != null)
                    {
                        productMap[comboItem.ComponentProductId] = comboItem.ComponentProduct;
                    }
                }
            }
            else
            {
                AddRequirement(product.ProductId, item.Quantity);
            }
        }

        var lines = aggregated.Select(kv => new DecomposedLine
        {
            ProductId = kv.Key,
            ProductName = productMap.TryGetValue(kv.Key, out var p) ? p.ProductName : "Unknown",
            RequiredQuantity = kv.Value
        }).ToList();

        return (lines, productMap);
    }

    private async Task<ConcessionStockConflictDto> BuildConflictAsync(Guid cinemaId, ConcessionProductEntity product, int requestedQuantity, int availableQuantity)
    {
        var substitutes = await _concessionRepository.GetSubstituteCandidatesAsync(cinemaId, product.Category, product.ProductId);
        return new ConcessionStockConflictDto
        {
            ProductId = product.ProductId,
            ProductName = product.ProductName,
            RequestedQuantity = requestedQuantity,
            AvailableQuantity = Math.Max(0, availableQuantity),
            Suggestions = substitutes.Select(s => new ConcessionSubstituteDto
            {
                ProductId = s.ProductId,
                ProductName = s.ProductName,
                UnitPrice = s.UnitPrice,
                AvailableToSell = s.Inventory?.AvailableToSell ?? 0,
                ImageUrl = s.ImageUrl
            }).ToList()
        };
    }

    private async Task<string> AcquireLockOrThrowAsync(Guid productId)
    {
        var token = Guid.NewGuid().ToString("N");
        var key = LockKey(productId);
        var acquired = false;
        var deadline = DateTime.UtcNow.AddMilliseconds(LockTimeoutMs);

        while (DateTime.UtcNow < deadline)
        {
            acquired = await _redisLockService.AcquireLockAsync(key, token, LockExpiration);
            if (acquired) break;
            await Task.Delay(50);
        }

        if (!acquired)
        {
            _logger.LogWarning("Failed to acquire inventory lock for product {ProductId} within timeout", productId);
            throw new AppException(Messages.Inventory.ConcurrencyConflict, 409, "INV03");
        }

        return token;
    }

    private static string LockKey(Guid productId) => $"concession:inventory:{productId}";

    private sealed class DecomposedLine
    {
        public Guid ProductId { get; init; }
        public string ProductName { get; init; } = string.Empty;
        public int RequiredQuantity { get; init; }
    }
}
