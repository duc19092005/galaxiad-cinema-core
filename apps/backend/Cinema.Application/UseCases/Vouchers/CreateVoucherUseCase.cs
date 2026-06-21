using System;
using System.Threading.Tasks;
using Cinema.Application.Dtos.Vouchers;
using Cinema.Application.Interfaces.Vouchers;
using Cinema.Domain.Entities.Vouchers;
using Cinema.Application.Exceptions;
using Cinema.Domain.Interfaces.Persistence;

namespace Cinema.Application.UseCases.Vouchers;

public class CreateVoucherUseCase
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IVoucherRepository _repository;
    private readonly GetVoucherByIdUseCase _getVoucherByIdUseCase;

    public CreateVoucherUseCase(IVoucherRepository repository, GetVoucherByIdUseCase getVoucherByIdUseCase,
        IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
        _repository = repository;
        _getVoucherByIdUseCase = getVoucherByIdUseCase;
    }

    public async Task<VoucherDto> ExecuteAsync(CreateVoucherDto dto)
    {
        // Check if role exists
        var roleExists = await _repository.RoleExistsAsync(dto.RoleId);
        if (!roleExists)
        {
            throw new AppException("Role does not exist", 400, "V02");
        }

        var nameExists = await _repository.ExistsNameAsync(dto.VoucherName);
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

        await _repository.AddAsync(voucher);
        await _unitOfWork.SaveChangesAsync();

        return await _getVoucherByIdUseCase.ExecuteAsync(voucher.voucherId);
    }
}
