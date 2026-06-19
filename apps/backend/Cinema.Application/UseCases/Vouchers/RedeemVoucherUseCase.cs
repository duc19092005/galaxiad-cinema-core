using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Cinema.Application.Dtos.Vouchers;
using Cinema.Domain.Entities.Vouchers;
using Cinema.Domain.Entities.UserInfos;
using Cinema.Domain.Exceptions;
using Cinema.Domain.Interfaces.Persistence;

namespace Cinema.Application.UseCases.Vouchers;

public class RedeemVoucherUseCase
{
    private readonly IUnitOfWork _unitOfWork;

    public RedeemVoucherUseCase(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<UserVoucherDto> ExecuteAsync(Guid userId, Guid voucherId)
    {
        // 1. Query data outside transaction
        var voucher = await _unitOfWork.Repository<VoucherInfoEntity>().FindAsync(voucherId)
            ?? throw new AppException("Voucher not found", 404, "V03");

        if (!voucher.IsValid(null))
            throw new AppException("Voucher has expired or is not yet active", 400, "V05");

        var user = await _unitOfWork.Repository<UserInfoEntity>().FindAsync(userId)
            ?? throw new AppException("User not found", 404, "V06");

        await ValidateUserRoleAsync(userId, voucher.roleId);

        // 2. Perform business logic and persist changes
        await using var transaction = await _unitOfWork.BeginTransactionAsync();
        try
        {
            // rich domain validations and state updates
            user.DeductPoints(voucher.VoucherPointsCost);
            voucher.Redeem();

            var userVoucher = new UserVoucherEntity
            {
                UserVoucherId = Guid.NewGuid(),
                UserId = userId,
                VoucherId = voucherId,
                IsUsed = false,
                PurchasedAt = DateTime.UtcNow
            };

            await _unitOfWork.Repository<UserVoucherEntity>().AddAsync(userVoucher);
            await _unitOfWork.SaveChangesAsync();
            await transaction.CommitAsync();

            return MapToDto(userVoucher, voucher);
        }
        catch (Exception)
        {
            await transaction.RollbackAsync();
            throw;
        }
    }

    private async Task ValidateUserRoleAsync(Guid userId, Guid requiredRoleId)
    {
        if (requiredRoleId == Guid.Empty) return;

        var hasRole = await _unitOfWork.Repository<UserRoleInfoEntity>().Query()
            .AnyAsync(ur => ur.UserId == userId && ur.RoleId == requiredRoleId);

        if (!hasRole)
        {
            throw new AppException("User is not eligible for this voucher (role mismatch)", 400, "V08");
        }
    }

    private static UserVoucherDto MapToDto(UserVoucherEntity uv, VoucherInfoEntity voucher)
    {
        return new UserVoucherDto
        {
            UserVoucherId = uv.UserVoucherId,
            UserId = uv.UserId,
            VoucherId = uv.VoucherId,
            VoucherName = voucher.voucherName,
            VoucherDescription = voucher.voucherDescription,
            VoucherDiscountPercent = voucher.voucherDiscountPercent,
            IsUsed = uv.IsUsed,
            PurchasedAt = uv.PurchasedAt,
            UsedAt = uv.UsedAt,
            ValidFrom = voucher.ValidFrom,
            ValidTo = voucher.ValidTo
        };
    }
}
