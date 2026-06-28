using Cinema.Application.Dtos.Admin.Responses;
using Cinema.Application.Interfaces.Admin;
using Cinema.Domain.Entities.CinemaInfos;
using Cinema.Domain.Entities.MovieInfos;
using Cinema.Domain.Entities.UserInfos;
using Microsoft.EntityFrameworkCore;

namespace Cinema.Infrastructure.Repositories;

public class AdminTransferRepository : IAdminTransferRepository
{
    private readonly CinemaDbContext _dbContext;

    public AdminTransferRepository(CinemaDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<List<AdminTransferUserDto>> GetUsersByRoleAsync(Guid roleId)
    {
        return await _dbContext.Set<UserRoleInfoEntity>().AsNoTracking()
            .Where(ur => ur.RoleId == roleId)
            .Select(ur => new AdminTransferUserDto
            {
                UserId = ur.UserId,
                UserEmail = ur.UserInfoEntity.UserEmail,
                UserName = ur.UserInfoEntity.UserName ?? string.Empty
            })
            .ToListAsync();
    }

    public async Task<List<ManagedItemDto>> GetManagedCinemasAsync(Guid? managerUserId, bool filterUnmanaged, bool isFacilities)
    {
        var query = _dbContext.Set<CinemaInfoEntity>().AsNoTracking();
        if (isFacilities)
        {
            if (filterUnmanaged) query = query.Where(c => c.FacilitiesManagerId == null);
            else if (managerUserId.HasValue) query = query.Where(c => c.FacilitiesManagerId == managerUserId.Value);

            return await query.Select(c => new ManagedItemDto
            {
                ItemId = c.CinemaId,
                ItemName = c.CinemaName,
                Description = $"Vị trí: {c.CinemaLocation} (CSVC)",
                ManagerName = c.FacilitiesManager != null ? c.FacilitiesManager.UserName ?? "Chưa có quản lý CSVC" : "Chưa có quản lý CSVC"
            }).ToListAsync();
        }

        if (filterUnmanaged) query = query.Where(c => c.TheaterManagerId == null);
        else if (managerUserId.HasValue) query = query.Where(c => c.TheaterManagerId == managerUserId.Value);

        return await query.Select(c => new ManagedItemDto
        {
            ItemId = c.CinemaId,
            ItemName = c.CinemaName,
            Description = $"Vị trí: {c.CinemaLocation} (Vận hành)",
            ManagerName = c.TheaterManager != null ? c.TheaterManager.UserName ?? "Chưa có quản lý vận hành" : "Chưa có quản lý vận hành"
        }).ToListAsync();
    }

    public async Task<List<ManagedItemDto>> GetManagedMoviesAsync(Guid? managerUserId, bool filterUnmanaged)
    {
        var query = _dbContext.Set<MovieInfoEntity>().AsNoTracking();
        if (filterUnmanaged) query = query.Where(m => m.MovieManagerId == null);
        else if (managerUserId.HasValue) query = query.Where(m => m.MovieManagerId == managerUserId.Value);

        return await query.Select(m => new ManagedItemDto
        {
            ItemId = m.MovieId,
            ItemName = m.MovieName,
            Description = $"Đạo diễn: {m.Director}",
            ManagerName = m.MovieManager != null ? m.MovieManager.UserName ?? "Chưa có quản lý" : "Chưa có quản lý"
        }).ToListAsync();
    }
}
