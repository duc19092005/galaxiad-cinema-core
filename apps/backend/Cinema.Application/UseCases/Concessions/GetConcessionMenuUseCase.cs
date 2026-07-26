using Cinema.Application.Dtos;
using Cinema.Application.Dtos.Concessions;
using Cinema.Application.Interfaces.Concessions;

namespace Cinema.Application.UseCases.Concessions;

public class GetConcessionMenuUseCase
{
    private readonly IConcessionRepository _concessionRepository;

    public GetConcessionMenuUseCase(IConcessionRepository concessionRepository)
    {
        _concessionRepository = concessionRepository;
    }

    public async Task<BaseResponse<List<ResConcessionMenuItemDto>>> ExecuteAsync(Guid cinemaId, bool onlineOnly)
    {
        var products = await _concessionRepository.GetCinemaMenuAsync(cinemaId, onlineOnly);

        var data = products.Select(p =>
        {
            var availableToSell = GetAvailableToSell(p);
            return new ResConcessionMenuItemDto
            {
                ProductId = p.ProductId,
                ProductName = p.ProductName,
                Category = p.Category,
                UnitPrice = p.UnitPrice,
                Unit = p.Unit,
                ImageUrl = string.IsNullOrWhiteSpace(p.ImageUrl) ? CreateConcessionProductUseCase.GetFallbackImageUrl(p.Sku, p.Category) : p.ImageUrl,
                Description = p.Description,
                IsCombo = p.IsCombo,
                IsHot = p.IsHot,
                AvailableToSell = availableToSell,
                IsLowStock = IsLowStock(p, availableToSell)
            };
        }).ToList();

        return new BaseResponse<List<ResConcessionMenuItemDto>>
        {
            IsSuccess = true,
            Message = "OK",
            Data = data
        };
    }
    private static int GetAvailableToSell(Domain.Entities.Concessions.ConcessionProductEntity product)
    {
        if (!product.IsCombo)
            return Math.Max(0, product.Inventory?.AvailableToSell ?? 0);

        if (product.ComboItems.Count == 0)
            return 0;

        return product.ComboItems.Min(item =>
        {
            var componentAvailable = Math.Max(0, item.ComponentProduct?.Inventory?.AvailableToSell ?? 0);
            return componentAvailable / Math.Max(1, item.Quantity);
        });
    }

    private static bool IsLowStock(Domain.Entities.Concessions.ConcessionProductEntity product, int availableToSell)
    {
        if (availableToSell <= 0)
            return false;

        if (!product.IsCombo)
            return availableToSell <= product.LowStockThreshold;

        return product.ComboItems.Any(item =>
        {
            var component = item.ComponentProduct;
            var componentAvailable = Math.Max(0, component?.Inventory?.AvailableToSell ?? 0);
            return componentAvailable > 0
                && componentAvailable <= Math.Max(component?.LowStockThreshold ?? 0, item.Quantity);
        });
    }
}

public class GetConcessionProductsUseCase
{
    private readonly IConcessionRepository _concessionRepository;

    public GetConcessionProductsUseCase(IConcessionRepository concessionRepository)
    {
        _concessionRepository = concessionRepository;
    }

    public async Task<BaseResponse<List<ResConcessionProductDto>>> ExecuteAsync(Guid cinemaId)
    {
        var products = await _concessionRepository.GetCinemaProductsAsync(cinemaId);
        return new BaseResponse<List<ResConcessionProductDto>>
        {
            IsSuccess = true,
            Message = "OK",
            Data = products.Select(CreateConcessionProductUseCase.MapToDto).ToList()
        };
    }
}
