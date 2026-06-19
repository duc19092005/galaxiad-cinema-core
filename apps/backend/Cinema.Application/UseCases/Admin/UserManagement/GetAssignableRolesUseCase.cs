using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Cinema.Application.Dtos.Admin.Responses;
using Cinema.Application.Interfaces.Admin;

namespace Cinema.Application.UseCases.Admin.UserManagement;

public class GetAssignableRolesUseCase
{
    private readonly IAdminUserRepository _adminUserRepository;

    public GetAssignableRolesUseCase(IAdminUserRepository adminUserRepository)
    {
        _adminUserRepository = adminUserRepository;
    }

    public async Task<List<ResponseRolesDto>> ExecuteAsync()
    {
        return await _adminUserRepository.GetAssignableRolesAsync(AdminUserManagementHelper.StaffRoleIds);
    }
}
