using System;
using System.Threading.Tasks;
using Cinema.Application.Dtos.Vouchers;
using Cinema.Application.Interfaces.Vouchers;
using Cinema.Application.Exceptions;
using Cinema.Domain.Localization;

namespace Cinema.Application.UseCases.Admin.Vouchers;

public class GetVoucherByIdUseCase
{
    private readonly IVoucherRepository _repository;

    public GetVoucherByIdUseCase(IVoucherRepository repository)
    {
        _repository = repository;
    }

    public async Task<VoucherDto> ExecuteAsync(Guid voucherId)
    {
        var v = await _repository.GetByIdAsync(voucherId);
        if (v == null)
        {
            throw new AppException(Messages.Voucher.NotFound, 404, "V03");
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
