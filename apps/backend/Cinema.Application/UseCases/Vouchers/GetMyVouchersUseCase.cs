using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Cinema.Application.Dtos.Vouchers;
using Cinema.Domain.Entities.Vouchers;
using Cinema.Domain.Interfaces.Persistence;

namespace Cinema.Application.UseCases.Vouchers;

public class GetMyVouchersUseCase
{
    private readonly IUnitOfWork _unitOfWork;

    public GetMyVouchersUseCase(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<List<UserVoucherDto>> ExecuteAsync(Guid userId)
    {
        return await _unitOfWork.Repository<UserVoucherEntity>().Query()
            .Include(uv => uv.VoucherInfoEntity)
            .Where(uv => uv.UserId == userId)
            .OrderByDescending(uv => uv.PurchasedAt)
            .Select(uv => new UserVoucherDto
            {
                UserVoucherId = uv.UserVoucherId,
                UserId = uv.UserId,
                VoucherId = uv.VoucherId,
                VoucherName = uv.VoucherInfoEntity.voucherName,
                VoucherDescription = uv.VoucherInfoEntity.voucherDescription,
                VoucherDiscountPercent = uv.VoucherInfoEntity.voucherDiscountPercent,
                IsUsed = uv.IsUsed,
                PurchasedAt = uv.PurchasedAt,
                UsedAt = uv.UsedAt,
                ValidFrom = uv.VoucherInfoEntity.ValidFrom,
                ValidTo = uv.VoucherInfoEntity.ValidTo
            })
            .ToListAsync();
    }
}
