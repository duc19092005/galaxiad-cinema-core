using System;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Cinema.Application.Dtos.Vouchers;
using Cinema.Domain.Entities.Vouchers;
using Cinema.Domain.Entities.UserInfos;
using Cinema.Domain.Exceptions;
using Cinema.Domain.Interfaces.Persistence;

namespace Cinema.Application.UseCases.Vouchers;

public class CreateVoucherUseCase
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly GetVoucherByIdUseCase _getVoucherByIdUseCase;

    public CreateVoucherUseCase(IUnitOfWork unitOfWork, GetVoucherByIdUseCase getVoucherByIdUseCase)
    {
        _unitOfWork = unitOfWork;
        _getVoucherByIdUseCase = getVoucherByIdUseCase;
    }

    public async Task<VoucherDto> ExecuteAsync(CreateVoucherDto dto)
    {
        // Check if role exists
        var roleExists = await _unitOfWork.Repository<RoleListInfoEntity>().Query()
            .AnyAsync(r => r.RoleId == dto.RoleId);
        if (!roleExists)
        {
            throw new AppException("Role does not exist", 400, "V02");
        }

        var nameExists = await _unitOfWork.Repository<VoucherInfoEntity>().Query()
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

        await _unitOfWork.Repository<VoucherInfoEntity>().AddAsync(voucher);
        await _unitOfWork.SaveChangesAsync();

        return await _getVoucherByIdUseCase.ExecuteAsync(voucher.voucherId);
    }
}
