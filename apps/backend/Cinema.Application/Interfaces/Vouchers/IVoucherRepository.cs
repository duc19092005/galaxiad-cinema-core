using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Cinema.Application.Dtos.Vouchers;
using Cinema.Domain.Entities.Vouchers;
using Cinema.Domain.Entities.UserInfos;
using Cinema.Domain.Interfaces.Persistence;

namespace Cinema.Application.Interfaces.Vouchers;

public interface IVoucherRepository
{
    Task<VoucherInfoEntity?> GetByIdAsync(Guid voucherId);
    Task<bool> RoleExistsAsync(Guid roleId);
    Task<bool> ExistsNameAsync(string voucherName);
    Task<bool> ExistsNameExceptAsync(string voucherName, Guid exceptVoucherId);
    Task AddAsync(VoucherInfoEntity voucher);
    Task RemoveAsync(VoucherInfoEntity voucher);
    Task<List<VoucherDto>> GetAllAsync();
    Task<List<VoucherDto>> GetActiveVouchersAsync();
    Task<List<UserVoucherDto>> GetMyVouchersAsync(Guid userId);
    Task<UserInfoEntity?> FindUserByIdAsync(Guid userId);
    Task<bool> UserHasRoleAsync(Guid userId, Guid roleId);
    Task AddUserVoucherAsync(UserVoucherEntity userVoucher);
    Task SaveChangesAsync();
    Task<IUnitOfWorkTransaction> BeginTransactionAsync();
}
