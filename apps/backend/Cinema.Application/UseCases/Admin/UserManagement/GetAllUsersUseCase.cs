using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Cinema.Application.Dtos;
using Cinema.Application.Dtos.Admin;
using Cinema.Application.Interfaces.Admin;

namespace Cinema.Application.UseCases.Admin.UserManagement;

public class GetAllUsersUseCase
{
    private readonly IAdminUserRepository _userRepository;

    public GetAllUsersUseCase(IAdminUserRepository userRepository)
    {
        _userRepository = userRepository;
    }

    public async Task<BaseResponse<List<AdminUserDto>>> ExecuteAsync()
    {
        var users = await _userRepository.GetAllUsersAsync();

        return new BaseResponse<List<AdminUserDto>>
        {
            IsSuccess = true,
            Data = users,
            Message = "Get all users successfully."
        };
    }
}

