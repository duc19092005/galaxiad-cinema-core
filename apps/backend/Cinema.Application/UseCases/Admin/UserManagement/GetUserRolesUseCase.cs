using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Cinema.Application.Interfaces.Admin;

namespace Cinema.Application.UseCases.Admin.UserManagement;

public class GetUserRolesUseCase
{
    private readonly IAdminUserRepository _adminUserRepository;

    public GetUserRolesUseCase(IAdminUserRepository adminUserRepository)
    {
        _adminUserRepository = adminUserRepository;
    }

    public async Task<List<string>> ExecuteAsync(Guid userId)
    {
        return await _adminUserRepository.GetUserRolesAsync(userId);
    }
}
