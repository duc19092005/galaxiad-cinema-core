using System;
using System.Threading.Tasks;
using Cinema.Application.Interfaces.Vouchers;
using Cinema.Domain.Exceptions;

namespace Cinema.Application.UseCases.Vouchers;

public class DeleteVoucherUseCase
{
    private readonly IVoucherRepository _repository;

    public DeleteVoucherUseCase(IVoucherRepository repository)
    {
        _repository = repository;
    }

    public async Task ExecuteAsync(Guid voucherId)
    {
        var voucher = await _repository.GetByIdAsync(voucherId);
        if (voucher == null)
        {
            throw new AppException("Voucher not found", 404, "V03");
        }

        await _repository.RemoveAsync(voucher);
        await _repository.SaveChangesAsync();
    }
}
