using Cinema.Application.Dtos;
using Cinema.Application.Dtos.Concessions;
using Cinema.Application.Interfaces.Concessions;
using Cinema.Domain.Localization;

namespace Cinema.Application.UseCases.Concessions;

public class RestockInventoryUseCase
{
    private readonly IInventoryStockService _stockService;

    public RestockInventoryUseCase(IInventoryStockService stockService)
    {
        _stockService = stockService;
    }

    public async Task<BaseResponse<bool>> ExecuteAsync(ReqRestockInventoryDto request, Guid? performedByUserId)
    {
        await _stockService.RestockAsync(request.ProductId, request.Quantity, performedByUserId, request.Note);
        return new BaseResponse<bool> { IsSuccess = true, Message = Messages.Inventory.RestockSuccess, Data = true };
    }
}

public class AdjustInventoryUseCase
{
    private readonly IInventoryStockService _stockService;

    public AdjustInventoryUseCase(IInventoryStockService stockService)
    {
        _stockService = stockService;
    }

    public async Task<BaseResponse<bool>> ExecuteAsync(ReqAdjustInventoryDto request, Guid? performedByUserId)
    {
        await _stockService.AdjustAsync(request.ProductId, request.QuantityChange, request.TransactionType, performedByUserId, request.Note);
        return new BaseResponse<bool> { IsSuccess = true, Message = Messages.Inventory.AdjustSuccess, Data = true };
    }
}

public class StockCountInventoryUseCase
{
    private readonly IInventoryStockService _stockService;

    public StockCountInventoryUseCase(IInventoryStockService stockService)
    {
        _stockService = stockService;
    }

    public async Task<BaseResponse<bool>> ExecuteAsync(ReqStockCountDto request, Guid? performedByUserId)
    {
        await _stockService.StockCountAsync(request.ProductId, request.CountedQuantity, performedByUserId, request.Note);
        return new BaseResponse<bool> { IsSuccess = true, Message = Messages.Inventory.StockCountSuccess, Data = true };
    }
}
