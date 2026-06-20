using System.Collections.Generic;
using System.Threading.Tasks;
using Cinema.Application.Dtos.Vouchers;
using Cinema.Application.Interfaces.Vouchers;

namespace Cinema.Application.UseCases.Vouchers;

public class GetActiveVouchersUseCase
{
    private readonly IVoucherRepository _repository;

    public GetActiveVouchersUseCase(IVoucherRepository repository)
    {
        _repository = repository;
    }

    public async Task<List<VoucherDto>> ExecuteAsync()
    {
        return await _repository.GetActiveVouchersAsync();
    }
}
