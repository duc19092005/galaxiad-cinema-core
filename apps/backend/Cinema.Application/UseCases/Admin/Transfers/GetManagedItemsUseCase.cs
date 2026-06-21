using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Cinema.Application.Dtos;
using Cinema.Application.Dtos.Admin.Responses;
using Cinema.Application.Constants;
using Cinema.Application.Interfaces.Admin;

namespace Cinema.Application.UseCases.Admin.Transfers;

public class GetManagedItemsUseCase
{
    private readonly IAdminTransferRepository _adminRepository;

    public GetManagedItemsUseCase(IAdminTransferRepository adminRepository)
    {
        _adminRepository = adminRepository;
    }

    public async Task<BaseResponse<List<ManagedItemDto>>> ExecuteAsync(string? userId, TransferTypeEnum transferType)
    {
        bool filterUnmanaged = string.IsNullOrEmpty(userId) || userId.ToLower() == "unmanaged";
        Guid? userGuid = null;
        if (!filterUnmanaged && !string.IsNullOrEmpty(userId))
        {
            if (Guid.TryParse(userId, out var parsedGuid)) userGuid = parsedGuid;
        }

        if (transferType == TransferTypeEnum.Facilities || transferType == TransferTypeEnum.Theater)
        {
            var results = await _adminRepository.GetManagedCinemasAsync(userGuid, filterUnmanaged, transferType == TransferTypeEnum.Facilities);
            return new BaseResponse<List<ManagedItemDto>>
            {
                IsSuccess = true,
                Data = results,
                Message = $"Láº¥y danh sÃ¡ch ráº¡p ({(transferType == TransferTypeEnum.Facilities ? "CSVC" : "Váº­n hÃ nh")}) thÃ nh cÃ´ng."
            };
        }
        else
        {
            var movies = await _adminRepository.GetManagedMoviesAsync(userGuid, filterUnmanaged);
            return new BaseResponse<List<ManagedItemDto>> { IsSuccess = true, Data = movies, Message = "Láº¥y danh sÃ¡ch phim thÃ nh cÃ´ng." };
        }
    }
}

