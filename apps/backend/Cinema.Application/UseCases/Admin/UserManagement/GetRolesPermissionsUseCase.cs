using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Cinema.Application.Dtos;
using Cinema.Application.Dtos.Admin;
using Cinema.Application.Interfaces.Admin;

namespace Cinema.Application.UseCases.Admin.UserManagement;

public class GetRolesPermissionsUseCase
{
    private readonly IAdminUserRepository _adminUserRepository;

    public GetRolesPermissionsUseCase(IAdminUserRepository adminUserRepository)
    {
        _adminUserRepository = adminUserRepository;
    }

    public async Task<BaseResponse<List<ResponseRolePermissionsDto>>> ExecuteAsync()
    {
        return await _adminUserRepository.GetRolesPermissionsAsync();
    }
}

