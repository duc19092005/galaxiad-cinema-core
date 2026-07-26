using Cinema.Application.Dtos;
using Cinema.Application.Dtos.Concessions;
using Cinema.Application.Interfaces.Concessions;

namespace Cinema.Application.UseCases.Concessions;

public class GetInventoryStatusUseCase
{
    private readonly IInventoryRepository _inventoryRepository;
    private readonly IConcessionRepository _concessionRepository;

    public GetInventoryStatusUseCase(IInventoryRepository inventoryRepository, IConcessionRepository concessionRepository)
    {
        _inventoryRepository = inventoryRepository;
        _concessionRepository = concessionRepository;
    }

    public async Task<BaseResponse<List<ResInventoryStatusDto>>> ExecuteAsync(Guid cinemaId)
    {
        var products = await _concessionRepository.GetCinemaProductsAsync(cinemaId);
        var data = products
            .Where(p => !p.IsCombo && p.Inventory != null)
            .Select(p => new ResInventoryStatusDto
            {
                ProductId = p.ProductId,
                ProductName = p.ProductName,
                Sku = p.Sku,
                Category = p.Category,
                QuantityOnHand = p.Inventory!.QuantityOnHand,
                QuantityReserved = p.Inventory.QuantityReserved,
                AvailableToSell = p.Inventory.AvailableToSell,
                LowStockThreshold = p.LowStockThreshold,
                IsLowStock = p.Inventory.AvailableToSell <= p.LowStockThreshold,
                LastRestockedAt = p.Inventory.LastRestockedAt,
                LastCountedAt = p.Inventory.LastCountedAt
            })
            .OrderBy(d => d.ProductName)
            .ToList();

        return new BaseResponse<List<ResInventoryStatusDto>> { IsSuccess = true, Message = "OK", Data = data };
    }
}

public class GetInventoryHistoryUseCase
{
    private readonly IInventoryRepository _inventoryRepository;

    public GetInventoryHistoryUseCase(IInventoryRepository inventoryRepository)
    {
        _inventoryRepository = inventoryRepository;
    }

    public async Task<BaseResponse<List<ResInventoryTransactionDto>>> ExecuteAsync(Guid cinemaId, ReqInventoryHistoryFilterDto filter)
    {
        var transactions = await _inventoryRepository.GetTransactionHistoryAsync(
            cinemaId, filter.ProductId, filter.TransactionType, filter.FromDate, filter.ToDate, filter.Page, filter.PageSize);

        var data = transactions.Select(t => new ResInventoryTransactionDto
        {
            TransactionId = t.TransactionId,
            ProductId = t.ProductId,
            ProductName = t.ConcessionProductEntity?.ProductName ?? string.Empty,
            TransactionType = t.TransactionType,
            QuantityChange = t.QuantityChange,
            QuantityOnHandAfter = t.QuantityOnHandAfter,
            QuantityReservedAfter = t.QuantityReservedAfter,
            OrderId = t.OrderId,
            PerformedByUserId = t.PerformedByUserId,
            Note = t.Note,
            OccurredAt = t.OccurredAt
        }).ToList();

        return new BaseResponse<List<ResInventoryTransactionDto>> { IsSuccess = true, Message = "OK", Data = data };
    }
}
