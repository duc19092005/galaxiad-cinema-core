using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Cinema.Application.Dtos.Vouchers;
using Cinema.Application.Interfaces.Vouchers;
using Cinema.Domain.Entities.Vouchers;
using Cinema.Domain.Entities.UserInfos;
using Cinema.Domain.Interfaces.Persistence;

namespace Cinema.Infrastructure.Repositories;

public class VoucherRepository : IVoucherRepository
{
    private readonly CinemaDbContext _dbContext;

    public VoucherRepository(CinemaDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<VoucherInfoEntity?> GetByIdAsync(Guid voucherId)
    {
        return await _dbContext.Set<VoucherInfoEntity>()
            .Include(v => v.RoleListInfoEntity)
            .FirstOrDefaultAsync(v => v.voucherId == voucherId);
    }

    public async Task<bool> RoleExistsAsync(Guid roleId)
    {
        return await _dbContext.Set<RoleListInfoEntity>()
            .AnyAsync(r => r.RoleId == roleId);
    }

    public async Task<bool> ExistsNameAsync(string voucherName)
    {
        return await _dbContext.Set<VoucherInfoEntity>()
            .AnyAsync(v => v.voucherName.ToLower() == voucherName.ToLower());
    }

    public async Task<bool> ExistsNameExceptAsync(string voucherName, Guid exceptVoucherId)
    {
        return await _dbContext.Set<VoucherInfoEntity>()
            .AnyAsync(v => v.voucherName.ToLower() == voucherName.ToLower() && v.voucherId != exceptVoucherId);
    }

    public async Task AddAsync(VoucherInfoEntity voucher)
    {
        await _dbContext.Set<VoucherInfoEntity>().AddAsync(voucher);
    }

    public Task RemoveAsync(VoucherInfoEntity voucher)
    {
        _dbContext.Set<VoucherInfoEntity>().Remove(voucher);
        return Task.CompletedTask;
    }

    public async Task<List<VoucherDto>> GetAllAsync()
    {
        return await _dbContext.Set<VoucherInfoEntity>()
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

    public async Task<List<VoucherDto>> GetActiveVouchersAsync()
    {
        var now = DateTime.UtcNow;
        return await _dbContext.Set<VoucherInfoEntity>()
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

    public async Task<List<UserVoucherDto>> GetMyVouchersAsync(Guid userId)
    {
        return await _dbContext.Set<UserVoucherEntity>()
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

    public async Task<UserInfoEntity?> FindUserByIdAsync(Guid userId)
    {
        return await _dbContext.Set<UserInfoEntity>().FindAsync(userId);
    }

    public async Task<bool> UserHasRoleAsync(Guid userId, Guid roleId)
    {
        return await _dbContext.Set<UserRoleInfoEntity>()
            .AnyAsync(ur => ur.UserId == userId && ur.RoleId == roleId);
    }

    public async Task AddUserVoucherAsync(UserVoucherEntity userVoucher)
    {
        await _dbContext.Set<UserVoucherEntity>().AddAsync(userVoucher);
    }

    public async Task SaveChangesAsync()
    {
        await _dbContext.SaveChangesAsync();
    }

    public async Task<IUnitOfWorkTransaction> BeginTransactionAsync()
    {
        var transaction = await _dbContext.Database.BeginTransactionAsync();
        return new EfUnitOfWorkTransaction(transaction);
    }
}
