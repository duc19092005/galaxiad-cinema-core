using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Cinema.Application.Dtos;
using Cinema.Application.Dtos.Admin.Responses;
using Cinema.Application.Constants;
using Cinema.Application.Exceptions;
using Cinema.Application.Interfaces.Admin;

namespace Cinema.Application.UseCases.Admin.Transfers;

public class GetUsersByRoleUseCase
{
    private readonly IAdminTransferRepository _adminRepository;

    public GetUsersByRoleUseCase(IAdminTransferRepository adminRepository)
    {
        _adminRepository = adminRepository;
    }

    public async Task<BaseResponse<List<AdminTransferUserDto>>> ExecuteAsync(TransferTypeEnum transferType)
    {
        Guid roleId = transferType switch
        {
            TransferTypeEnum.Facilities => userRoles.FacilitiesManager,
            TransferTypeEnum.Theater => userRoles.TheaterManager,
            TransferTypeEnum.Movie => userRoles.MovieManager,
            _ => throw new BadRequestException("Loáº¡i chuyá»ƒn quyá»n khÃ´ng há»£p lá»‡.", "B02")
        };

        var users = await _adminRepository.GetUsersByRoleAsync(roleId);

        return new BaseResponse<List<AdminTransferUserDto>>
        {
            IsSuccess = true,
            Data = users,
            Message = $"Láº¥y danh sÃ¡ch ngÆ°á»i dÃ¹ng role {transferType} thÃ nh cÃ´ng."
        };
    }
}

