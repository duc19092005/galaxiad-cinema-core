using Cinema.Application.Dtos;
using Cinema.Application.Dtos.Concessions;
using Cinema.Application.Exceptions;
using Cinema.Application.Interfaces.Concessions;
using Cinema.Domain.Interfaces.Persistence;
using Cinema.Domain.Localization;
using Microsoft.Extensions.Logging;

namespace Cinema.Application.UseCases.Concessions;

/// <summary>Kiểm tra tồn kho trước khi cho phép khách/nhân viên xác nhận đơn (không khóa/không ghi dữ liệu).</summary>
public class CheckConcessionStockUseCase
{
    private readonly IInventoryStockService _stockService;

    public CheckConcessionStockUseCase(IInventoryStockService stockService)
    {
        _stockService = stockService;
    }

    public async Task<BaseResponse<ResConcessionStockCheckResultDto>> ExecuteAsync(ReqCheckConcessionStockDto request)
    {
        var result = await _stockService.CheckStockAsync(request.CinemaId, request.Items);
        return new BaseResponse<ResConcessionStockCheckResultDto>
        {
            IsSuccess = true,
            Message = Messages.Concession.StockCheckSuccess,
            Data = result
        };
    }
}

/// <summary>Bán F&amp;B trực tiếp tại quầy POS (không cho phép đơn F&amp;B đơn độc — quy tắc do FE/BFF phía trên đảm bảo có kèm vé/đơn chính).</summary>
public class SellConcessionPosUseCase
{
    private readonly IInventoryStockService _stockService;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ILogger<SellConcessionPosUseCase> _logger;

    public SellConcessionPosUseCase(
        IInventoryStockService stockService,
        IUnitOfWork unitOfWork,
        ILogger<SellConcessionPosUseCase> logger)
    {
        _stockService = stockService;
        _unitOfWork = unitOfWork;
        _logger = logger;
    }

    public async Task<BaseResponse<ResConcessionSaleDto>> ExecuteAsync(ReqSellConcessionPosDto request)
    {
        if (request.Items == null || request.Items.Count == 0)
        {
            throw new AppException(Messages.Concession.NoItemsProvided, 400, "CON01");
        }

        await using var transaction = await _unitOfWork.BeginTransactionAsync();
        try
        {
            var orderId = Guid.NewGuid();
            var totalAmount = await _stockService.SellDirectAsync(request.CinemaId, request.Items, orderId, request.StaffId);
            await transaction.CommitAsync();

            return new BaseResponse<ResConcessionSaleDto>
            {
                IsSuccess = true,
                Message = Messages.Concession.SaleCompleted,
                Data = new ResConcessionSaleDto
                {
                    OrderId = orderId,
                    TotalAmount = totalAmount,
                    SoldAt = DateTime.UtcNow
                }
            };
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync();
            if (ex is AppException) throw;
            _logger.LogError(ex, "Error selling concessions at POS for cinema {CinemaId}", request.CinemaId);
            throw;
        }
    }
}
