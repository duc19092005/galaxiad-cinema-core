using System;
using System.Threading.Tasks;
using Cinema.Application.Dtos.Vouchers;
using Cinema.Application.Interfaces.Vouchers;
using Cinema.Application.Exceptions;
using Cinema.Domain.Interfaces.Persistence;

namespace Cinema.Application.UseCases.Vouchers;

public class UpdateVoucherUseCase
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IVoucherRepository _repository;
    private readonly GetVoucherByIdUseCase _getVoucherByIdUseCase;

    public UpdateVoucherUseCase(IVoucherRepository repository, GetVoucherByIdUseCase getVoucherByIdUseCase,
        IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
        _repository = repository;
        _getVoucherByIdUseCase = getVoucherByIdUseCase;
    }

    public async Task<VoucherDto> ExecuteAsync(Guid voucherId, UpdateVoucherDto dto)
    {
        var voucher = await _repository.GetByIdAsync(voucherId);
        if (voucher == null)
        {
            throw new AppException("Voucher not found", 404, "V03");
        }

        var roleExists = await _repository.RoleExistsAsync(dto.RoleId);
        if (!roleExists)
        {
            throw new AppException("Role does not exist", 400, "V02");
        }

        var nameExists = await _repository.ExistsNameExceptAsync(dto.VoucherName, voucherId);
        if (nameExists)
        {
            throw new AppException("Voucher name already exists", 400, "V01");
        }

        // Adjust remaining quantity
        int qtyDifference = dto.VoucherQuantity - voucher.VoucherQuantity;
        int newRemaining = voucher.RemainingQuantity + qtyDifference;
        if (newRemaining < 0)
        {
            newRemaining = 0;
        }

        voucher.voucherName = dto.VoucherName;
        voucher.voucherDescription = dto.VoucherDescription;
        voucher.voucherAmount = dto.VoucherAmount;
        voucher.voucherDiscountPercent = dto.VoucherDiscountPercent;
        voucher.roleId = dto.RoleId;
        voucher.ValidFrom = dto.ValidFrom?.ToUniversalTime();
        voucher.ValidTo = dto.ValidTo?.ToUniversalTime();
        voucher.VoucherPointsCost = dto.VoucherPointsCost;
        voucher.VoucherQuantity = dto.VoucherQuantity;
        voucher.RemainingQuantity = newRemaining;

        await _unitOfWork.SaveChangesAsync();
        return await _getVoucherByIdUseCase.ExecuteAsync(voucher.voucherId);
    }
}
