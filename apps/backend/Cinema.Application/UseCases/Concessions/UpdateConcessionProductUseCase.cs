using Cinema.Application.Dtos;
using Cinema.Application.Dtos.Concessions;
using Cinema.Application.Exceptions;
using Cinema.Application.Interfaces.Concessions;
using Cinema.Domain.Interfaces.Persistence;
using Cinema.Domain.Localization;

namespace Cinema.Application.UseCases.Concessions;

public class UpdateConcessionProductUseCase
{
    private readonly IConcessionRepository _concessionRepository;
    private readonly IUnitOfWork _unitOfWork;

    public UpdateConcessionProductUseCase(IConcessionRepository concessionRepository, IUnitOfWork unitOfWork)
    {
        _concessionRepository = concessionRepository;
        _unitOfWork = unitOfWork;
    }

    public async Task<BaseResponse<ResConcessionProductDto>> ExecuteAsync(Guid productId, ReqUpdateConcessionProductDto request)
    {
        var product = await _concessionRepository.GetProductWithComboItemsAsync(productId)
            ?? throw new AppException(Messages.Concession.ProductNotFound, 404, "CON02");

        product.ProductName = request.ProductName;
        product.UnitPrice = request.UnitPrice;
        product.CostPrice = request.CostPrice;
        product.Unit = request.Unit;
        product.ImageUrl = request.ImageUrl;
        product.Description = request.Description;
        product.IsAvailableOnline = request.IsAvailableOnline;
        product.LowStockThreshold = request.LowStockThreshold;

        _concessionRepository.UpdateProduct(product);
        await _unitOfWork.SaveChangesAsync();

        return new BaseResponse<ResConcessionProductDto>
        {
            IsSuccess = true,
            Message = Messages.Concession.ProductUpdated,
            Data = CreateConcessionProductUseCase.MapToDto(product)
        };
    }
}

public class ToggleConcessionProductStatusUseCase
{
    private readonly IConcessionRepository _concessionRepository;
    private readonly IUnitOfWork _unitOfWork;

    public ToggleConcessionProductStatusUseCase(IConcessionRepository concessionRepository, IUnitOfWork unitOfWork)
    {
        _concessionRepository = concessionRepository;
        _unitOfWork = unitOfWork;
    }

    public async Task<BaseResponse<bool>> ExecuteAsync(Guid productId, bool isActive)
    {
        var product = await _concessionRepository.GetProductByIdAsync(productId)
            ?? throw new AppException(Messages.Concession.ProductNotFound, 404, "CON02");

        product.IsActive = isActive;
        _concessionRepository.UpdateProduct(product);
        await _unitOfWork.SaveChangesAsync();

        return new BaseResponse<bool>
        {
            IsSuccess = true,
            Message = Messages.Concession.ProductToggled,
            Data = isActive
        };
    }
}
