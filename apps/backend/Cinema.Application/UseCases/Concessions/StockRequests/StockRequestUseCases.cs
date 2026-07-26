using Cinema.Application.Dtos;
using Cinema.Application.Dtos.Concessions;
using Cinema.Application.Exceptions;
using Cinema.Application.Interfaces.Concessions;
using Cinema.Domain.Entities.Concessions;
using Cinema.Domain.Enums;
using Cinema.Domain.Interfaces.Persistence;
using Cinema.Domain.Localization;

namespace Cinema.Application.UseCases.Concessions.StockRequests;

public class CreateStockRequestUseCase
{
    private readonly IStockRequestRepository _stockRequestRepository;
    private readonly IConcessionRepository _concessionRepository;
    private readonly IUnitOfWork _unitOfWork;

    public CreateStockRequestUseCase(
        IStockRequestRepository stockRequestRepository,
        IConcessionRepository concessionRepository,
        IUnitOfWork unitOfWork)
    {
        _stockRequestRepository = stockRequestRepository;
        _concessionRepository = concessionRepository;
        _unitOfWork = unitOfWork;
    }

    public async Task<BaseResponse<ResStockRequestDto>> ExecuteAsync(ReqCreateStockRequestDto request, Guid? userId)
    {
        if (!userId.HasValue || userId.Value == Guid.Empty)
        {
            throw new AppException("Vui lòng đăng nhập để thực hiện thao tác này.", 401, "AUTH01");
        }

        if (request.Items == null || request.Items.Count == 0)
        {
            throw new AppException("Vui lòng chọn ít nhất 1 sản phẩm cần nhập.", 400, "SR01");
        }

        var requestCode = $"SR-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString("N")[..6].ToUpper()}";

        var entity = new StockRequestEntity
        {
            StockRequestId = Guid.NewGuid(),
            RequestCode = requestCode,
            CinemaId = request.CinemaId,
            Status = StockRequestStatus.Pending,
            RequestedByUserId = userId.Value,
            Note = request.Note,
            CreatedAt = DateTime.UtcNow,
            Items = new List<StockRequestItemEntity>()
        };

        foreach (var item in request.Items)
        {
            var product = await _concessionRepository.GetProductByIdAsync(item.ProductId);
            if (product == null || product.CinemaId != request.CinemaId)
            {
                throw new AppException($"Sản phẩm (ID: {item.ProductId}) không tồn tại hoặc không thuộc rạp này.", 400, "SR02");
            }

            entity.Items.Add(new StockRequestItemEntity
            {
                StockRequestItemId = Guid.NewGuid(),
                StockRequestId = entity.StockRequestId,
                ProductId = item.ProductId,
                RequestedQuantity = item.Quantity,
                ApprovedQuantity = item.Quantity, // mặc định lấy bằng số yêu cầu
                ReceivedQuantity = 0
            });
        }

        await _stockRequestRepository.AddAsync(entity);
        await _unitOfWork.SaveChangesAsync();

        var created = await _stockRequestRepository.GetByIdWithItemsAsync(entity.StockRequestId);
        return new BaseResponse<ResStockRequestDto>
        {
            IsSuccess = true,
            Message = "Tạo yêu cầu nhập hàng thành công.",
            Data = MapToDto(created!)
        };
    }

    public static ResStockRequestDto MapToDto(StockRequestEntity entity)
    {
        return new ResStockRequestDto
        {
            StockRequestId = entity.StockRequestId,
            RequestCode = entity.RequestCode,
            CinemaId = entity.CinemaId,
            CinemaName = entity.CinemaInfoEntity?.CinemaName ?? string.Empty,
            Status = entity.Status,
            RequestedByUserId = entity.RequestedByUserId,
            RequestedByUserName = entity.RequestedByUser?.UserName ?? string.Empty,
            ApprovedByUserId = entity.ApprovedByUserId,
            ApprovedByUserName = entity.ApprovedByUser?.UserName,
            ShippedByUserId = entity.ShippedByUserId,
            ShippedByUserName = entity.ShippedByUser?.UserName,
            ReceivedByUserId = entity.ReceivedByUserId,
            ReceivedByUserName = entity.ReceivedByUser?.UserName,
            Note = entity.Note,
            RejectReason = entity.RejectReason,
            CreatedAt = entity.CreatedAt,
            ApprovedAt = entity.ApprovedAt,
            ShippedAt = entity.ShippedAt,
            ReceivedAt = entity.ReceivedAt,
            Items = entity.Items.Select(i => new ResStockRequestItemDto
            {
                StockRequestItemId = i.StockRequestItemId,
                ProductId = i.ProductId,
                ProductName = i.ConcessionProductEntity?.ProductName ?? string.Empty,
                Sku = i.ConcessionProductEntity?.Sku ?? string.Empty,
                RequestedQuantity = i.RequestedQuantity,
                ApprovedQuantity = i.ApprovedQuantity,
                ReceivedQuantity = i.ReceivedQuantity
            }).ToList()
        };
    }
}

public class ApproveStockRequestUseCase
{
    private readonly IStockRequestRepository _stockRequestRepository;
    private readonly IUnitOfWork _unitOfWork;

    public ApproveStockRequestUseCase(IStockRequestRepository stockRequestRepository, IUnitOfWork unitOfWork)
    {
        _stockRequestRepository = stockRequestRepository;
        _unitOfWork = unitOfWork;
    }

    public async Task<BaseResponse<ResStockRequestDto>> ExecuteAsync(Guid requestId, ReqApproveStockRequestDto request, Guid? userId)
    {
        var entity = await _stockRequestRepository.GetByIdWithItemsAsync(requestId)
            ?? throw new AppException("Không tìm thấy yêu cầu nhập hàng.", 404, "SR03");

        if (entity.Status != StockRequestStatus.Pending)
        {
            throw new AppException("Chỉ có thể duyệt các yêu cầu ở trạng thái Chờ duyệt (Pending).", 400, "SR04");
        }

        if (request.Items != null && request.Items.Count > 0)
        {
            foreach (var approvedItem in request.Items)
            {
                var item = entity.Items.FirstOrDefault(i => i.ProductId == approvedItem.ProductId);
                if (item != null)
                {
                    item.ApprovedQuantity = approvedItem.ApprovedQuantity;
                }
            }
        }

        entity.Status = StockRequestStatus.Approved;
        entity.ApprovedByUserId = userId;
        entity.ApprovedAt = DateTime.UtcNow;
        if (!string.IsNullOrWhiteSpace(request.Note))
        {
            entity.Note = (entity.Note + " | Duyệt: " + request.Note).Trim(' ', '|');
        }

        _stockRequestRepository.Update(entity);
        await _unitOfWork.SaveChangesAsync();

        return new BaseResponse<ResStockRequestDto>
        {
            IsSuccess = true,
            Message = "Đã duyệt yêu cầu nhập hàng.",
            Data = CreateStockRequestUseCase.MapToDto(entity)
        };
    }
}

public class RejectStockRequestUseCase
{
    private readonly IStockRequestRepository _stockRequestRepository;
    private readonly IUnitOfWork _unitOfWork;

    public RejectStockRequestUseCase(IStockRequestRepository stockRequestRepository, IUnitOfWork unitOfWork)
    {
        _stockRequestRepository = stockRequestRepository;
        _unitOfWork = unitOfWork;
    }

    public async Task<BaseResponse<ResStockRequestDto>> ExecuteAsync(Guid requestId, ReqRejectStockRequestDto request, Guid? userId)
    {
        var entity = await _stockRequestRepository.GetByIdWithItemsAsync(requestId)
            ?? throw new AppException("Không tìm thấy yêu cầu nhập hàng.", 404, "SR03");

        if (entity.Status != StockRequestStatus.Pending && entity.Status != StockRequestStatus.Approved)
        {
            throw new AppException("Chỉ có thể từ chối yêu cầu chưa xuất hàng.", 400, "SR05");
        }

        entity.Status = StockRequestStatus.Rejected;
        entity.RejectReason = request.Reason;
        entity.ApprovedByUserId = userId;
        entity.ApprovedAt = DateTime.UtcNow;

        _stockRequestRepository.Update(entity);
        await _unitOfWork.SaveChangesAsync();

        return new BaseResponse<ResStockRequestDto>
        {
            IsSuccess = true,
            Message = "Đã từ chối yêu cầu nhập hàng.",
            Data = CreateStockRequestUseCase.MapToDto(entity)
        };
    }
}

public class ShipStockRequestUseCase
{
    private readonly IStockRequestRepository _stockRequestRepository;
    private readonly IUnitOfWork _unitOfWork;

    public ShipStockRequestUseCase(IStockRequestRepository stockRequestRepository, IUnitOfWork unitOfWork)
    {
        _stockRequestRepository = stockRequestRepository;
        _unitOfWork = unitOfWork;
    }

    public async Task<BaseResponse<ResStockRequestDto>> ExecuteAsync(Guid requestId, Guid? userId)
    {
        var entity = await _stockRequestRepository.GetByIdWithItemsAsync(requestId)
            ?? throw new AppException("Không tìm thấy yêu cầu nhập hàng.", 404, "SR03");

        if (entity.Status != StockRequestStatus.Approved)
        {
            throw new AppException("Chỉ có thể vận chuyển các yêu cầu đã được duyệt (Approved).", 400, "SR06");
        }

        entity.Status = StockRequestStatus.Shipped;
        entity.ShippedByUserId = userId;
        entity.ShippedAt = DateTime.UtcNow;

        _stockRequestRepository.Update(entity);
        await _unitOfWork.SaveChangesAsync();

        return new BaseResponse<ResStockRequestDto>
        {
            IsSuccess = true,
            Message = "Đã cập nhật trạng thái xuất kho & vận chuyển.",
            Data = CreateStockRequestUseCase.MapToDto(entity)
        };
    }
}

public class ReceiveStockRequestUseCase
{
    private readonly IStockRequestRepository _stockRequestRepository;
    private readonly IInventoryStockService _inventoryStockService;
    private readonly IUnitOfWork _unitOfWork;

    public ReceiveStockRequestUseCase(
        IStockRequestRepository stockRequestRepository,
        IInventoryStockService inventoryStockService,
        IUnitOfWork unitOfWork)
    {
        _stockRequestRepository = stockRequestRepository;
        _inventoryStockService = inventoryStockService;
        _unitOfWork = unitOfWork;
    }

    public async Task<BaseResponse<ResStockRequestDto>> ExecuteAsync(Guid requestId, ReqReceiveStockRequestDto request, Guid? userId)
    {
        var entity = await _stockRequestRepository.GetByIdWithItemsAsync(requestId)
            ?? throw new AppException("Không tìm thấy yêu cầu nhập hàng.", 404, "SR03");

        if (entity.Status != StockRequestStatus.Shipped)
        {
            throw new AppException("Chỉ có thể xác nhận nhận hàng cho các đơn đang vận chuyển (Shipped).", 400, "SR07");
        }

        foreach (var item in entity.Items)
        {
            var receivedInput = request.Items?.FirstOrDefault(i => i.ProductId == item.ProductId);
            item.ReceivedQuantity = receivedInput != null ? receivedInput.ReceivedQuantity : item.ApprovedQuantity;

            if (item.ReceivedQuantity > 0)
            {
                // Gọi kho rạp cộng tồn thực tế
                await _inventoryStockService.RestockAsync(
                    item.ProductId,
                    item.ReceivedQuantity,
                    userId,
                    $"Nhận hàng từ phiếu {entity.RequestCode}");
            }
        }

        entity.Status = StockRequestStatus.Received;
        entity.ReceivedByUserId = userId;
        entity.ReceivedAt = DateTime.UtcNow;
        if (!string.IsNullOrWhiteSpace(request.Note))
        {
            entity.Note = (entity.Note + " | Nhận hàng: " + request.Note).Trim(' ', '|');
        }

        _stockRequestRepository.Update(entity);
        await _unitOfWork.SaveChangesAsync();

        return new BaseResponse<ResStockRequestDto>
        {
            IsSuccess = true,
            Message = "Đã xác nhận nhận hàng và nhập tồn kho thành công.",
            Data = CreateStockRequestUseCase.MapToDto(entity)
        };
    }
}

public class GetStockRequestsUseCase
{
    private readonly IStockRequestRepository _stockRequestRepository;

    public GetStockRequestsUseCase(IStockRequestRepository stockRequestRepository)
    {
        _stockRequestRepository = stockRequestRepository;
    }

    public async Task<BaseResponse<List<ResStockRequestDto>>> ExecuteAsync(Guid? cinemaId, StockRequestStatus? status)
    {
        var list = await _stockRequestRepository.GetListAsync(cinemaId, status);
        var dtos = list.Select(CreateStockRequestUseCase.MapToDto).ToList();
        return new BaseResponse<List<ResStockRequestDto>>
        {
            IsSuccess = true,
            Message = "OK",
            Data = dtos
        };
    }
}
