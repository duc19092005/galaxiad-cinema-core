using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Cinema.Application.Dtos.Vouchers;
using Cinema.Application.Interfaces.Vouchers;

namespace Cinema.Application.UseCases.Admin.Vouchers;

public class GetMyVouchersUseCase
{
    private readonly IVoucherRepository _repository;

    public GetMyVouchersUseCase(IVoucherRepository repository)
    {
        _repository = repository;
    }

    public async Task<List<UserVoucherDto>> ExecuteAsync(Guid userId)
    {
        return await _repository.GetMyVouchersAsync(userId);
    }
}
