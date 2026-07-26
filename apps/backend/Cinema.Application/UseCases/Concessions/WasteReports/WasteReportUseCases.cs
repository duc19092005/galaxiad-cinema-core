using Cinema.Application.Dtos;
using Cinema.Application.Dtos.Concessions;
using Cinema.Application.Exceptions;
using Cinema.Application.Interfaces.Concessions;
using Cinema.Domain.Entities.Concessions;
using Cinema.Domain.Enums;
using Cinema.Domain.Interfaces.Persistence;
using Cinema.Domain.Localization;

namespace Cinema.Application.UseCases.Concessions.WasteReports;

public class CreateWasteReportUseCase
{
    private readonly IWasteReportRepository _wasteReportRepository;
    private readonly IConcessionRepository _concessionRepository;
    private readonly IUnitOfWork _unitOfWork;

    public CreateWasteReportUseCase(
        IWasteReportRepository wasteReportRepository,
        IConcessionRepository concessionRepository,
        IUnitOfWork unitOfWork)
    {
        _wasteReportRepository = wasteReportRepository;
        _concessionRepository = concessionRepository;
        _unitOfWork = unitOfWork;
    }

    public async Task<BaseResponse<ResWasteReportDto>> ExecuteAsync(ReqCreateWasteReportDto request, Guid? userId)
    {
        if (!userId.HasValue || userId.Value == Guid.Empty)
        {
            throw new AppException("Vui lòng đăng nhập để thực hiện thao tác này.", 401, "AUTH01");
        }

        var product = await _concessionRepository.GetProductByIdAsync(request.ProductId);
        if (product == null || product.CinemaId != request.CinemaId)
        {
            throw new AppException("Sản phẩm không tồn tại hoặc không thuộc rạp này.", 400, "WR01");
        }

        var entity = new WasteReportEntity
        {
            WasteReportId = Guid.NewGuid(),
            CinemaId = request.CinemaId,
            ProductId = request.ProductId,
            Quantity = request.Quantity,
            Reason = request.Reason,
            ProofImageUrl = request.ProofImageUrl,
            Status = WasteReportStatus.Pending,
            ReportedByUserId = userId.Value,
            CreatedAt = DateTime.UtcNow
        };

        await _wasteReportRepository.AddAsync(entity);
        await _unitOfWork.SaveChangesAsync();

        var created = await _wasteReportRepository.GetByIdAsync(entity.WasteReportId);
        return new BaseResponse<ResWasteReportDto>
        {
            IsSuccess = true,
            Message = "Đã gửi báo cáo hàng hỏng / hao hụt thành công.",
            Data = MapToDto(created!)
        };
    }

    public static ResWasteReportDto MapToDto(WasteReportEntity entity)
    {
        return new ResWasteReportDto
        {
            WasteReportId = entity.WasteReportId,
            CinemaId = entity.CinemaId,
            CinemaName = entity.CinemaInfoEntity?.CinemaName ?? string.Empty,
            ProductId = entity.ProductId,
            ProductName = entity.ConcessionProductEntity?.ProductName ?? string.Empty,
            Sku = entity.ConcessionProductEntity?.Sku ?? string.Empty,
            Quantity = entity.Quantity,
            Reason = entity.Reason,
            ProofImageUrl = entity.ProofImageUrl,
            Status = entity.Status,
            ReportedByUserId = entity.ReportedByUserId,
            ReportedByUserName = entity.ReportedByUser?.UserName ?? string.Empty,
            ReviewedByUserId = entity.ReviewedByUserId,
            ReviewedByUserName = entity.ReviewedByUser?.UserName,
            ReviewNote = entity.ReviewNote,
            CreatedAt = entity.CreatedAt,
            ReviewedAt = entity.ReviewedAt
        };
    }
}

public class ReviewWasteReportUseCase
{
    private readonly IWasteReportRepository _wasteReportRepository;
    private readonly IInventoryStockService _inventoryStockService;
    private readonly IUnitOfWork _unitOfWork;

    public ReviewWasteReportUseCase(
        IWasteReportRepository wasteReportRepository,
        IInventoryStockService inventoryStockService,
        IUnitOfWork unitOfWork)
    {
        _wasteReportRepository = wasteReportRepository;
        _inventoryStockService = inventoryStockService;
        _unitOfWork = unitOfWork;
    }

    public async Task<BaseResponse<ResWasteReportDto>> ExecuteAsync(Guid reportId, ReqReviewWasteReportDto request, Guid? userId)
    {
        var entity = await _wasteReportRepository.GetByIdAsync(reportId)
            ?? throw new AppException("Không tìm thấy báo cáo hàng hỏng.", 404, "WR02");

        if (entity.Status != WasteReportStatus.Pending)
        {
            throw new AppException("Báo cáo này đã được xử lý trước đó.", 400, "WR03");
        }

        if (request.Approve)
        {
            // Duyệt -> Trừ tồn kho tại rạp với loại giao dịch Waste (-Quantity)
            await _inventoryStockService.AdjustAsync(
                entity.ProductId,
                -entity.Quantity,
                InventoryTransactionType.Waste,
                userId,
                $"Duyệt báo cáo hàng hỏng: {entity.Reason}");

            entity.Status = WasteReportStatus.Approved;
        }
        else
        {
            entity.Status = WasteReportStatus.Rejected;
        }

        entity.ReviewedByUserId = userId;
        entity.ReviewNote = request.ReviewNote;
        entity.ReviewedAt = DateTime.UtcNow;

        _wasteReportRepository.Update(entity);
        await _unitOfWork.SaveChangesAsync();

        return new BaseResponse<ResWasteReportDto>
        {
            IsSuccess = true,
            Message = request.Approve ? "Đã duyệt và trừ tồn kho hàng hỏng." : "Đã từ chối báo cáo hàng hỏng.",
            Data = CreateWasteReportUseCase.MapToDto(entity)
        };
    }
}

public class GetWasteReportsUseCase
{
    private readonly IWasteReportRepository _wasteReportRepository;

    public GetWasteReportsUseCase(IWasteReportRepository wasteReportRepository)
    {
        _wasteReportRepository = wasteReportRepository;
    }

    public async Task<BaseResponse<List<ResWasteReportDto>>> ExecuteAsync(Guid? cinemaId, WasteReportStatus? status)
    {
        var list = await _wasteReportRepository.GetListAsync(cinemaId, status);
        var dtos = list.Select(CreateWasteReportUseCase.MapToDto).ToList();
        return new BaseResponse<List<ResWasteReportDto>>
        {
            IsSuccess = true,
            Message = "OK",
            Data = dtos
        };
    }
}
