using System;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Cinema.Application.Dtos.Vouchers;
using Cinema.Domain.Entities.Vouchers;
using Cinema.Domain.Entities.UserInfos;
using Cinema.Domain.Exceptions;
using Cinema.Domain.Interfaces.Persistence;

namespace Cinema.Application.UseCases.Vouchers;

public class UpdateVoucherUseCase
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly GetVoucherByIdUseCase _getVoucherByIdUseCase;

    public UpdateVoucherUseCase(IUnitOfWork unitOfWork, GetVoucherByIdUseCase getVoucherByIdUseCase)
    {
        _unitOfWork = unitOfWork;
        _getVoucherByIdUseCase = getVoucherByIdUseCase;
    }

    public async Task<VoucherDto> ExecuteAsync(Guid voucherId, UpdateVoucherDto dto)
    {
        var voucher = await _unitOfWork.Repository<VoucherInfoEntity>().Query()
            .FirstOrDefaultAsync(v => v.voucherId == voucherId);
        if (voucher == null)
        {
            throw new AppException("Voucher not found", 404, "V03");
        }

        var roleExists = await _unitOfWork.Repository<RoleListInfoEntity>().Query()
            .AnyAsync(r => r.RoleId == dto.RoleId);
        if (!roleExists)
        {
            throw new AppException("Role does not exist", 400, "V02");
        }

        var nameExists = await _unitOfWork.Repository<VoucherInfoEntity>().Query()
            .AnyAsync(v => v.voucherName.ToLower() == dto.VoucherName.ToLower() && v.voucherId != voucherId);
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
