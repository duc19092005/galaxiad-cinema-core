using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Cinema.Application.Dtos;
using Cinema.Application.Dtos.FacilitiesManager.Cinemas.Requests;
using Cinema.Application.Interfaces.Facilities;
using Cinema.Application.Interfaces;

namespace Cinema.Application.UseCases.FacilitiesManager.Cinemas;

public class GetDepartmentsUseCase
{
    private readonly IDepartmentRepository _departmentRepository;
    private readonly IUserContextService _userContext;

    public GetDepartmentsUseCase(IDepartmentRepository departmentRepository, IUserContextService userContext)
    {
        _departmentRepository = departmentRepository;
        _userContext = userContext;
    }

    public async Task<BaseResponse<List<ResDepartmentDto>>> ExecuteAsync(Guid cinemaId)
    {
        var userId = _userContext.GetUserId();
        var isAdmin = _userContext.IsInRole("Admin");

        // Verify access
        if (!isAdmin)
        {
            var cinema = await _departmentRepository.FindCinemaAsync(cinemaId);
            if (cinema == null || (cinema.FacilitiesManagerId != userId && cinema.TheaterManagerId != userId))
            {
                return new BaseResponse<List<ResDepartmentDto>>
                {
                    IsSuccess = false,
                    Message = "Bạn không có quyền quản lý rạp này."
                };
            }
        }

        var departments = await _departmentRepository.GetDepartmentsAsync(cinemaId);

        return new BaseResponse<List<ResDepartmentDto>>
        {
            IsSuccess = true,
            Data = departments
        };
    }
}
