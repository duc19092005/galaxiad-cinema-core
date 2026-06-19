using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Cinema.Application.Dtos.FacilitiesManager.Cinemas.Requests;
using Cinema.Domain.Entities.CinemaInfos;
using Cinema.Application.Interfaces.Facilities;

namespace Cinema.Infrastructure.Repositories;

public class DepartmentRepository : IDepartmentRepository
{
    private readonly CinemaDbContext _dbContext;

    public DepartmentRepository(CinemaDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<List<ResDepartmentDto>> GetDepartmentsAsync(Guid cinemaId)
    {
        return await _dbContext.Set<DepartmentEntity>()
            .Include(d => d.CinemaInfoEntity)
            .Include(d => d.SharedUserInfoEntity)
            .Where(d => d.CinemaId == cinemaId)
            .Select(d => new ResDepartmentDto
            {
                DepartmentId = d.DepartmentId,
                CinemaId = d.CinemaId,
                CinemaName = d.CinemaInfoEntity.CinemaName,
                DepartmentName = d.DepartmentName,
                DepartmentType = d.DepartmentType.ToString(),
                CashierType = d.CashierType.ToString(),
                SharedUserId = d.SharedUserId,
                SharedUserEmail = d.SharedUserInfoEntity != null ? d.SharedUserInfoEntity.UserEmail : null,
                IsActive = d.IsActive
            })
            .ToListAsync();
    }

    public async Task<CinemaInfoEntity?> FindCinemaAsync(Guid cinemaId)
    {
        return await _dbContext.Set<CinemaInfoEntity>()
            .FirstOrDefaultAsync(c => c.CinemaId == cinemaId && !c.IsDeleted);
    }

    public async Task<bool> DepartmentExistsAsync(Guid cinemaId, string departmentName)
    {
        return await _dbContext.Set<DepartmentEntity>()
            .AnyAsync(d => d.CinemaId == cinemaId && d.DepartmentName == departmentName && d.IsActive);
    }

    public async Task<bool> DepartmentExistsExcludeAsync(Guid cinemaId, string departmentName, Guid departmentId)
    {
        return await _dbContext.Set<DepartmentEntity>()
            .AnyAsync(d => d.CinemaId == cinemaId && 
                           d.DepartmentName == departmentName && 
                           d.IsActive && 
                           d.DepartmentId != departmentId);
    }

    public async Task<DepartmentEntity?> FindDepartmentWithCinemaAndUserAsync(Guid departmentId)
    {
        return await _dbContext.Set<DepartmentEntity>()
            .Include(d => d.CinemaInfoEntity)
            .Include(d => d.SharedUserInfoEntity)
                .ThenInclude(u => u!.StaffProfileEntity)
            .FirstOrDefaultAsync(d => d.DepartmentId == departmentId);
    }
}
