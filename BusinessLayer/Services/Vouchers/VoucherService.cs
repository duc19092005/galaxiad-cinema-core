using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using BusinessLayer.Entities.Vouchers;
using BusinessLayer.Entities.UserInfos;
using BusinessLayer.Dtos.Vouchers;
using Shared.Exceptions;
using Shared.Interfaces.Persistence;

namespace BusinessLayer.Services.Vouchers;

public class VoucherService
{
    private readonly IUnitOfWork _unitOfWork;

    public VoucherService(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    // ==========================================
    // ADMIN METHODS
    // ==========================================

    public async Task<VoucherDto> CreateVoucherAsync(CreateVoucherDto dto)
    {
        // Check if role exists
        var roleExists = await Query<RoleListInfoEntity>().AnyAsync(r => r.RoleId == dto.RoleId);
        if (!roleExists)
        {
            throw new AppException("Role does not exist", 400, "V02");
        }

        var nameExists = await Query<VoucherInfoEntity>()
            .AnyAsync(v => v.voucherName.ToLower() == dto.VoucherName.ToLower());
        if (nameExists)
        {
            throw new AppException("Voucher name already exists", 400, "V01");
        }

        var voucher = new VoucherInfoEntity
        {
            voucherId = Guid.NewGuid(),
            voucherName = dto.VoucherName,
            voucherDescription = dto.VoucherDescription,
            voucherAmount = dto.VoucherAmount,
            voucherDiscountPercent = dto.VoucherDiscountPercent,
            roleId = dto.RoleId,
            ValidFrom = dto.ValidFrom?.ToUniversalTime(),
            ValidTo = dto.ValidTo?.ToUniversalTime(),
            VoucherPointsCost = dto.VoucherPointsCost,
            VoucherQuantity = dto.VoucherQuantity,
            RemainingQuantity = dto.VoucherQuantity
        };

        await Repository<VoucherInfoEntity>().AddAsync(voucher);
        await _unitOfWork.SaveChangesAsync();

        return await GetVoucherByIdAsync(voucher.voucherId);
    }

    public async Task<VoucherDto> UpdateVoucherAsync(Guid voucherId, UpdateVoucherDto dto)
    {
        var voucher = await Query<VoucherInfoEntity>()
            .FirstOrDefaultAsync(v => v.voucherId == voucherId);
        if (voucher == null)
        {
            throw new AppException("Voucher not found", 404, "V03");
        }

        var roleExists = await Query<RoleListInfoEntity>().AnyAsync(r => r.RoleId == dto.RoleId);
        if (!roleExists)
        {
            throw new AppException("Role does not exist", 400, "V02");
        }

        var nameExists = await Query<VoucherInfoEntity>()
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
        return await GetVoucherByIdAsync(voucher.voucherId);
    }

    public async Task<List<VoucherDto>> GetAllVouchersAsync()
    {
        return await Query<VoucherInfoEntity>()
            .Include(v => v.RoleListInfoEntity)
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
                IsActive = v.IsValid(null)
            })
            .ToListAsync();
    }

    public async Task DeleteVoucherAsync(Guid voucherId)
    {
        var voucher = await Query<VoucherInfoEntity>()
            .FirstOrDefaultAsync(v => v.voucherId == voucherId);
        if (voucher == null)
        {
            throw new AppException("Voucher not found", 404, "V03");
        }

        Repository<VoucherInfoEntity>().Remove(voucher);
        await _unitOfWork.SaveChangesAsync();
    }

    public async Task<VoucherDto> GetVoucherByIdAsync(Guid voucherId)
    {
        var v = await Query<VoucherInfoEntity>()
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

    // ==========================================
    // PUBLIC / STORE METHODS
    // ==========================================

    public async Task<List<VoucherDto>> GetActiveVouchersAsync()
    {
        var now = DateTime.UtcNow;
        return await Query<VoucherInfoEntity>()
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

    public async Task<UserVoucherDto> RedeemVoucherAsync(Guid userId, Guid voucherId)
    {
        await using var transaction = await _unitOfWork.BeginTransactionAsync();
        try
        {
            var voucher = await Query<VoucherInfoEntity>()
                .FirstOrDefaultAsync(v => v.voucherId == voucherId);
            if (voucher == null)
            {
                throw new AppException("Voucher not found", 404, "V03");
            }

            if (voucher.RemainingQuantity <= 0)
            {
                throw new AppException("Voucher is out of stock", 400, "V04");
            }

            if (!voucher.IsValid(null))
            {
                throw new AppException("Voucher has expired or is not yet active", 400, "V05");
            }

            var user = await Query<UserInfoEntity>()
                .FirstOrDefaultAsync(u => u.UserId == userId);
            if (user == null)
            {
                throw new AppException("User not found", 404, "V06");
            }

            if (user.RewardPoints < voucher.VoucherPointsCost)
            {
                throw new AppException("Insufficient reward points", 400, "V07");
            }

            // Verify user has the required role (if role is not Customer or Admin or guest equivalent)
            // If the role is Customer (default), anyone who is logged in can redeem.
            // Let's load the user roles
            var userRoles = await Query<UserRoleInfoEntity>()
                .Where(ur => ur.UserId == userId)
                .Select(ur => ur.RoleId)
                .ToListAsync();

            if (voucher.roleId != Guid.Empty)
            {
                // check if the role matches
                var requiredRole = await Repository<RoleListInfoEntity>().FindAsync(voucher.roleId);
                // If the required role name is NOT "Customer" and the user doesn't have it, throw
                if (requiredRole != null && requiredRole.RoleName != "Customer" && !userRoles.Contains(voucher.roleId))
                {
                    throw new AppException("User is not eligible for this voucher (role mismatch)", 400, "V08");
                }
            }

            // Decrement points & stock
            user.RewardPoints -= voucher.VoucherPointsCost;
            voucher.RemainingQuantity -= 1;

            var userVoucher = new UserVoucherEntity
            {
                UserVoucherId = Guid.NewGuid(),
                UserId = userId,
                VoucherId = voucherId,
                IsUsed = false,
                PurchasedAt = DateTime.UtcNow
            };

            await Repository<UserVoucherEntity>().AddAsync(userVoucher);
            await _unitOfWork.SaveChangesAsync();
            await transaction.CommitAsync();

            return new UserVoucherDto
            {
                UserVoucherId = userVoucher.UserVoucherId,
                UserId = userVoucher.UserId,
                VoucherId = userVoucher.VoucherId,
                VoucherName = voucher.voucherName,
                VoucherDescription = voucher.voucherDescription,
                VoucherDiscountPercent = voucher.voucherDiscountPercent,
                IsUsed = false,
                PurchasedAt = userVoucher.PurchasedAt,
                UsedAt = null,
                ValidFrom = voucher.ValidFrom,
                ValidTo = voucher.ValidTo
            };
        }
        catch (Exception)
        {
            await transaction.RollbackAsync();
            throw;
        }
    }

    public async Task<List<UserVoucherDto>> GetMyVouchersAsync(Guid userId)
    {
        return await Query<UserVoucherEntity>()
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

    private IQueryable<TEntity> Query<TEntity>() where TEntity : class
    {
        return Repository<TEntity>().Query();
    }

    private IRepository<TEntity> Repository<TEntity>() where TEntity : class
    {
        return _unitOfWork.Repository<TEntity>();
    }
}
