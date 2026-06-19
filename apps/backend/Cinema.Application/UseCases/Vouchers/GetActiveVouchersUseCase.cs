using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Cinema.Application.Dtos.Vouchers;
using Cinema.Domain.Entities.Vouchers;
using Cinema.Domain.Interfaces.Persistence;

namespace Cinema.Application.UseCases.Vouchers;

public class GetActiveVouchersUseCase
{
    private readonly IUnitOfWork _unitOfWork;

    public GetActiveVouchersUseCase(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<List<VoucherDto>> ExecuteAsync()
    {
        var now = DateTime.UtcNow;
        return await _unitOfWork.Repository<VoucherInfoEntity>().Query()
            .Include(v => v.RoleListInfoEntity)
            .Where(v => v.RemainingQuantity > 0 && 
                        (v.ValidFrom == null || v.ValidFrom <= now) &&
                        (v.ValidTo == null || v.ValidTo >= now))
            .Select(v => new VoucherDto
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
                IsActive = true
            })
            .ToListAsync();
    }
}
