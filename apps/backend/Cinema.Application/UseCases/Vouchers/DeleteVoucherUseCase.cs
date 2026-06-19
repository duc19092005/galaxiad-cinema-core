using System;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Cinema.Domain.Entities.Vouchers;
using Cinema.Domain.Exceptions;
using Cinema.Domain.Interfaces.Persistence;

namespace Cinema.Application.UseCases.Vouchers;

public class DeleteVoucherUseCase
{
    private readonly IUnitOfWork _unitOfWork;

    public DeleteVoucherUseCase(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task ExecuteAsync(Guid voucherId)
    {
        var voucher = await _unitOfWork.Repository<VoucherInfoEntity>().Query()
            .FirstOrDefaultAsync(v => v.voucherId == voucherId);
        if (voucher == null)
        {
            throw new AppException("Voucher not found", 404, "V03");
        }

        _unitOfWork.Repository<VoucherInfoEntity>().Remove(voucher);
        await _unitOfWork.SaveChangesAsync();
    }
}
