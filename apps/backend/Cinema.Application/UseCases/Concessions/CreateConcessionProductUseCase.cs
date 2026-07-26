using Cinema.Application.Dtos;
using Cinema.Application.Dtos.Concessions;
using Cinema.Application.Exceptions;
using Cinema.Application.Interfaces.Concessions;
using Cinema.Domain.Entities.Concessions;
using Cinema.Domain.Enums;
using Cinema.Domain.Interfaces.Persistence;
using Cinema.Domain.Localization;

namespace Cinema.Application.UseCases.Concessions;

public class CreateConcessionProductUseCase
{
    private readonly IConcessionRepository _concessionRepository;
    private readonly IUnitOfWork _unitOfWork;

    public CreateConcessionProductUseCase(IConcessionRepository concessionRepository, IUnitOfWork unitOfWork)
    {
        _concessionRepository = concessionRepository;
        _unitOfWork = unitOfWork;
    }

    public async Task<BaseResponse<ResConcessionProductDto>> ExecuteAsync(ReqCreateConcessionProductDto request)
    {
        if (await _concessionRepository.SkuExistsAsync(request.CinemaId, request.Sku))
        {
            throw new AppException(Messages.Concession.ProductAlreadyExists, 409, "CON03");
        }

        var product = new ConcessionProductEntity
        {
            ProductId = Guid.NewGuid(),
            CinemaId = request.CinemaId,
            ProductName = request.ProductName,
            Sku = request.Sku,
            Category = request.Category,
            UnitPrice = request.UnitPrice,
            CostPrice = request.CostPrice,
            Unit = request.Unit,
            ImageUrl = request.ImageUrl,
            Description = request.Description,
            IsAvailableOnline = request.IsAvailableOnline,
            IsCombo = false,
            LowStockThreshold = request.LowStockThreshold,
            IsActive = true,
            Inventory = new ConcessionInventoryEntity
            {
                ProductId = Guid.Empty, // set below after product id assigned
                QuantityOnHand = request.InitialQuantity,
                QuantityReserved = 0,
                UpdatedAt = DateTime.UtcNow
            }
        };
        product.Inventory.ProductId = product.ProductId;

        await _concessionRepository.AddProductAsync(product);
        await _unitOfWork.SaveChangesAsync();

        return new BaseResponse<ResConcessionProductDto>
        {
            IsSuccess = true,
            Message = Messages.Concession.ProductCreated,
            Data = MapToDto(product)
        };
    }

    public static ResConcessionProductDto MapToDto(ConcessionProductEntity product)
    {
        var finalImg = string.IsNullOrWhiteSpace(product.ImageUrl)
            ? GetFallbackImageUrl(product.Sku, product.Category)
            : product.ImageUrl;

        return new ResConcessionProductDto
        {
            ProductId = product.ProductId,
            CinemaId = product.CinemaId,
            ProductName = product.ProductName,
            Sku = product.Sku,
            Category = product.Category,
            UnitPrice = product.UnitPrice,
            CostPrice = product.CostPrice,
            Unit = product.Unit,
            ImageUrl = finalImg,
            Description = product.Description,
            IsActive = product.IsActive,
            IsAvailableOnline = product.IsAvailableOnline,
            IsHot = product.IsHot,
            IsCombo = product.IsCombo,
            LowStockThreshold = product.LowStockThreshold,
            QuantityOnHand = product.Inventory?.QuantityOnHand ?? 0,
            QuantityReserved = product.Inventory?.QuantityReserved ?? 0,
            AvailableToSell = product.Inventory?.AvailableToSell ?? 0,
            IsLowStock = product.Inventory != null && product.Inventory.AvailableToSell <= product.LowStockThreshold,
            ComboItems = product.ComboItems.Select(ci => new ResComboItemDto
            {
                ComponentProductId = ci.ComponentProductId,
                ComponentProductName = ci.ComponentProduct?.ProductName ?? string.Empty,
                Quantity = ci.Quantity
            }).ToList()
        };
    }

    public static string GetFallbackImageUrl(string sku, ConcessionCategory category)
    {
        var skuUpper = sku?.ToUpperInvariant() ?? "";
        if (skuUpper.Contains("POP-M") || skuUpper.Contains("POP-L")) return "https://images.unsplash.com/photo-1585647347384-2593bc35786b?w=600&auto=format&fit=crop&q=80";
        if (skuUpper.Contains("POP-CHS")) return "https://images.unsplash.com/photo-1578849278619-e73505e9610f?w=600&auto=format&fit=crop&q=80";
        if (skuUpper.Contains("COKE")) return "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=600&auto=format&fit=crop&q=80";
        if (skuUpper.Contains("PEPSI")) return "https://images.unsplash.com/photo-1553456558-aff63285bdd1?w=600&auto=format&fit=crop&q=80";
        if (skuUpper.Contains("WTR") || skuUpper.Contains("WATER")) return "https://images.unsplash.com/photo-1548839140-29a749e1bc4e?w=600&auto=format&fit=crop&q=80";
        if (skuUpper.Contains("FRY")) return "https://images.unsplash.com/photo-1576107232684-1279f390859f?w=600&auto=format&fit=crop&q=80";
        if (skuUpper.Contains("SAU")) return "https://images.unsplash.com/photo-1619740455993-9e612b1af08a?w=600&auto=format&fit=crop&q=80";

        return category switch
        {
            ConcessionCategory.Popcorn => "https://images.unsplash.com/photo-1578849278619-e73505e9610f?w=600&auto=format&fit=crop&q=80",
            ConcessionCategory.Drink => "https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=600&auto=format&fit=crop&q=80",
            ConcessionCategory.Snack => "https://images.unsplash.com/photo-1576107232684-1279f390859f?w=600&auto=format&fit=crop&q=80",
            ConcessionCategory.Combo => "https://images.unsplash.com/photo-1585647347384-2593bc35786b?w=600&auto=format&fit=crop&q=80",
            _ => "https://images.unsplash.com/photo-1578849278619-e73505e9610f?w=600&auto=format&fit=crop&q=80"
        };
    }
}
