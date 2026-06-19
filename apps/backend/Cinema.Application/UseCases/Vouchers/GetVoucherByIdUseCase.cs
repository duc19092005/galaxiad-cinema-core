using System;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Cinema.Application.Dtos.Vouchers;
using Cinema.Domain.Entities.Vouchers;
using Cinema.Domain.Exceptions;
using Cinema.Domain.Interfaces.Persistence;

namespace Cinema.Application.UseCases.Vouchers;

public class GetVoucherByIdUseCase
{
    private readonly IUnitOfWork _unitOfWork;

    public GetVoucherByIdUseCase(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<VoucherDto> ExecuteAsync(Guid voucherId)
    {
        var v = await _unitOfWork.Repository<VoucherInfoEntity>().Query()
            .Include(v => v.RoleListInfoEntity)
            .FirstOrDefaultAsync(v => v.voucherId == voucherId);
        if (v == null)
        {
            throw new AppException("Voucher not found", 404, "V03");
        }

        return new VoucherDto
        {
            VoucherId = v.voucherId,
            VoucherName = v.voucherName,
            VoucherDescription = v.voucherDescription,
            VoucherAmount = v.voucherAmount,
            VoucherDiscountPercent = v.voucherDiscountPercent,
            RoleId = v.roleId,
            RoleName = v.RoleListInfoEntity != null ? v.RoleListInfoEntity.RoleName : string.Empty,
            ValidFrom = v.ValidFrom,
            ValidTo = v.ValidTo,
            VoucherPointsCost = v.VoucherPointsCost,
            VoucherQuantity = v.VoucherQuantity,
            RemainingQuantity = v.RemainingQuantity,
            IsActive = v.IsValid(null)
        };
    }
}
