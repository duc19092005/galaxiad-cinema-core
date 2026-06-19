using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Cinema.Application.Dtos.FacilitiesManager.Cinemas.Requests;
using Cinema.Domain.Entities.CinemaInfos;

namespace Cinema.Application.Interfaces.Facilities;

public interface IDepartmentRepository
{
    Task<List<ResDepartmentDto>> GetDepartmentsAsync(Guid cinemaId);
    Task<CinemaInfoEntity?> FindCinemaAsync(Guid cinemaId);
    Task<bool> DepartmentExistsAsync(Guid cinemaId, string departmentName);
    Task<bool> DepartmentExistsExcludeAsync(Guid cinemaId, string departmentName, Guid departmentId);
    Task<DepartmentEntity?> FindDepartmentWithCinemaAndUserAsync(Guid departmentId);
}
