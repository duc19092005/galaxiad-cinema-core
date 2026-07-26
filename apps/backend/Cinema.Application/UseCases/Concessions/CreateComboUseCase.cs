using Cinema.Application.Dtos;
using Cinema.Application.Dtos.Concessions;
using Cinema.Application.Exceptions;
using Cinema.Application.Interfaces.Concessions;
using Cinema.Domain.Entities.Concessions;
using Cinema.Domain.Enums;
using Cinema.Domain.Interfaces.Persistence;
using Cinema.Domain.Localization;

namespace Cinema.Application.UseCases.Concessions;

/// <summary>
/// Tạo combo: combo không có tồn kho riêng, chỉ ghi danh sách thành phần con.
/// Tồn kho thực tế của combo được suy ra từ tồn kho các thành phần (min quantity available).
/// </summary>
public class CreateComboUseCase
{
    private readonly IConcessionRepository _concessionRepository;
    private readonly IUnitOfWork _unitOfWork;

    public CreateComboUseCase(IConcessionRepository concessionRepository, IUnitOfWork unitOfWork)
    {
        _concessionRepository = concessionRepository;
        _unitOfWork = unitOfWork;
    }

    public async Task<BaseResponse<ResConcessionProductDto>> ExecuteAsync(ReqCreateComboDto request)
    {
        if (await _concessionRepository.SkuExistsAsync(request.CinemaId, request.Sku))
        {
            throw new AppException(Messages.Concession.ProductAlreadyExists, 409, "CON03");
        }

        var componentIds = request.Items.Select(i => i.ComponentProductId).ToList();
        var componentProducts = await _concessionRepository.GetProductsByIdsWithInventoryAsync(componentIds);
        if (componentProducts.Count != componentIds.Distinct().Count())
        {
            throw new AppException(Messages.Concession.ComboComponentNotFound, 404, "CON04");
        }

        if (componentProducts.Any(p => p.IsCombo))
        {
            throw new AppException(Messages.Concession.ComboComponentMustNotBeCombo, 400, "CON05");
        }

        var combo = new ConcessionProductEntity
        {
            ProductId = Guid.NewGuid(),
            CinemaId = request.CinemaId,
            ProductName = request.ProductName,
            Sku = request.Sku,
            Category = ConcessionCategory.Combo,
            UnitPrice = request.UnitPrice,
            CostPrice = request.Items.Sum(i =>
                componentProducts.First(p => p.ProductId == i.ComponentProductId).CostPrice * i.Quantity),
            Unit = ConcessionUnit.Combo,
            ImageUrl = request.ImageUrl,
            Description = request.Description,
            IsAvailableOnline = request.IsAvailableOnline,
            IsCombo = true,
            LowStockThreshold = 0,
            IsActive = true
        };

        await _concessionRepository.AddProductAsync(combo);

        var comboItems = request.Items.Select(i => new ConcessionComboItemEntity
        {
            ComboItemId = Guid.NewGuid(),
            ComboProductId = combo.ProductId,
            ComponentProductId = i.ComponentProductId,
            Quantity = i.Quantity
        }).ToList();

        await _concessionRepository.AddComboItemsAsync(comboItems);
        await _unitOfWork.SaveChangesAsync();

        combo.ComboItems = comboItems;
        foreach (var item in combo.ComboItems)
        {
            item.ComponentProduct = componentProducts.First(p => p.ProductId == item.ComponentProductId);
        }

        return new BaseResponse<ResConcessionProductDto>
        {
            IsSuccess = true,
            Message = Messages.Concession.ComboCreated,
            Data = CreateConcessionProductUseCase.MapToDto(combo)
        };
    }
}
