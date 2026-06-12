using BusinessLayer.Dtos;
using BusinessLayer.Dtos.Admin.Responses;
using BusinessLayer.Constants;
using BusinessLayer.Entities.CinemaInfos;
using BusinessLayer.Entities.MovieInfos;
using BusinessLayer.Entities.UserInfos;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Shared.Exceptions;
using Shared.Interfaces.Persistence;

namespace BusinessLayer.Services.Admin.UserManagement;

public class AdminManagementTransferService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ILogger<AdminManagementTransferService> _logger;

    public AdminManagementTransferService(IUnitOfWork unitOfWork, ILogger<AdminManagementTransferService> logger)
    {
        _unitOfWork = unitOfWork;
        _logger = logger;
    }

    /// <summary>
    /// Lấy danh sách người dùng theo Role
    /// </summary>
    public async Task<BaseResponse<List<AdminTransferUserDto>>> GetUsersByRoleAsync(TransferTypeEnum transferType)
    {
        Guid roleId = transferType switch
        {
            TransferTypeEnum.Facilities => userRoles.FacilitiesManager,
            TransferTypeEnum.Theater => userRoles.TheaterManager,
            TransferTypeEnum.Movie => userRoles.MovieManager,
            _ => throw new BadRequestException("Loại chuyển quyền không hợp lệ." , "B02")
        };

        var users = await Query<UserRoleInfoEntity>()
            .AsNoTracking()
            .Where(ur => ur.RoleId == roleId)
            .Select(ur => new AdminTransferUserDto
            {
                UserId = ur.UserId,
                UserEmail = ur.UserInfoEntity.UserEmail,
                UserName = ur.UserInfoEntity.UserName ?? string.Empty
            })
            .ToListAsync();

        return new BaseResponse<List<AdminTransferUserDto>>
        {
            IsSuccess = true,
            Data = users,
            Message = $"Lấy danh sách người dùng role {transferType} thành công."
        };
    }

    /// <summary>
    /// Lấy danh sách các mục đang được quản lý.
    /// Nếu truyền userId thì lọc theo manager đó, không truyền thì mặc định lấy các mục CHƯA CÓ người quản lý.
    /// Ngoài ra hỗ trợ keyword "unmanaged" để lọc những mục chưa có người quản lý.
    /// </summary>
    public async Task<BaseResponse<List<ManagedItemDto>>> GetManagedItemsAsync(string? userId, TransferTypeEnum transferType)
    {
        bool filterUnmanaged = string.IsNullOrEmpty(userId) || userId.ToLower() == "unmanaged";
        Guid? userGuid = null;
        if (!filterUnmanaged && !string.IsNullOrEmpty(userId))
        {
            if (Guid.TryParse(userId, out var parsedGuid)) userGuid = parsedGuid;
        }

        if (transferType == TransferTypeEnum.Facilities || transferType == TransferTypeEnum.Theater)
        {
            var query = Query<CinemaInfoEntity>().AsNoTracking();
            
            if (transferType == TransferTypeEnum.Facilities)
            {
                if (filterUnmanaged) query = query.Where(c => c.FacilitiesManagerId == null);
                else if (userGuid.HasValue) query = query.Where(c => c.FacilitiesManagerId == userGuid.Value);
                
                var results = await query.Select(c => new ManagedItemDto
                {
                    ItemId = c.CinemaId,
                    ItemName = c.CinemaName,
                    Description = $"Vị trí: {c.CinemaLocation} (CSVC)",
                    ManagerName = c.FacilitiesManager != null 
                        ? c.FacilitiesManager.UserName ?? "Chưa có quản lý CSVC" : "Chưa có quản lý CSVC"
                }).ToListAsync();
                
                return new BaseResponse<List<ManagedItemDto>> { IsSuccess = true, Data = results, Message = "Lấy danh sách rạp (CSVC) thành công." };
            }
            else // Theater
            {
                if (filterUnmanaged) query = query.Where(c => c.TheaterManagerId == null);
                else if (userGuid.HasValue) query = query.Where(c => c.TheaterManagerId == userGuid.Value);
                
                var results = await query.Select(c => new ManagedItemDto
                {
                    ItemId = c.CinemaId,
                    ItemName = c.CinemaName,
                    Description = $"Vị trí: {c.CinemaLocation} (Vận hành)",
                    ManagerName = c.TheaterManager != null 
                        ? c.TheaterManager.UserName ?? "Chưa có quản lý vận hành" : "Chưa có quản lý vận hành"
                }).ToListAsync();
                
                return new BaseResponse<List<ManagedItemDto>> { IsSuccess = true, Data = results, Message = "Lấy danh sách rạp (Vận hành) thành công." };
            }
        }
        else // Movie
        {
            var query = Query<MovieInfoEntity>().AsNoTracking();
            if (filterUnmanaged) query = query.Where(m => m.MovieManagerId == null);
            else if (userGuid.HasValue) query = query.Where(m => m.MovieManagerId == userGuid.Value);

            var movies = await query
                .Select(m => new ManagedItemDto
                {
                    ItemId = m.MovieId,
                    ItemName = m.MovieName,
                    Description = $"Đạo diễn: {m.Director}",
                    ManagerName = m.MovieManager != null ? m.MovieManager.UserName ?? "Chưa có quản lý" : "Chưa có quản lý"
                })
                .ToListAsync();

            return new BaseResponse<List<ManagedItemDto>> { IsSuccess = true, Data = movies, Message = "Lấy danh sách phim thành công." };
        }
    }

    /// <summary>
    /// Chuyển quyền quản lý hàng loạt
    /// </summary>
    public async Task<BaseResponse<string>> TransferManagementAsync(TransferManagementReqDto request)
    {
        await using var transaction = await _unitOfWork.BeginTransactionAsync();
        try
        {
            if (!request.ItemId.HasValue && !request.SourceUserId.HasValue)
            {
                throw new BadRequestException("Cần cung cấp ItemId hoặc SourceUserId để phân quyền.", "MGT01");
            }

            if (request.TransferType == TransferTypeEnum.Facilities)
            {
                var query = Query<CinemaInfoEntity>();
                if (request.ItemId.HasValue)
                    query = query.Where(c => c.CinemaId == request.ItemId.Value);
                else
                    query = query.Where(c => c.FacilitiesManagerId == request.SourceUserId);

                var cinemas = await query.ToListAsync();

                foreach (var cinema in cinemas)
                {
                    cinema.FacilitiesManagerId = request.TargetUserId;
                }
            }
            else if (request.TransferType == TransferTypeEnum.Theater)
            {
                var query = Query<CinemaInfoEntity>();
                if (request.ItemId.HasValue)
                    query = query.Where(c => c.CinemaId == request.ItemId.Value);
                else
                    query = query.Where(c => c.TheaterManagerId == request.SourceUserId);

                var cinemas = await query.ToListAsync();

                foreach (var cinema in cinemas)
                {
                    cinema.TheaterManagerId = request.TargetUserId;
                }
            }
            else // Movie
            {
                var query = Query<MovieInfoEntity>();
                if (request.ItemId.HasValue)
                    query = query.Where(m => m.MovieId == request.ItemId.Value);
                else
                    query = query.Where(m => m.MovieManagerId == request.SourceUserId);

                var movies = await query.ToListAsync();

                foreach (var movie in movies)
                {
                    movie.MovieManagerId = request.TargetUserId;
                }
            }

            await _unitOfWork.SaveChangesAsync();
            await transaction.CommitAsync();

            return new BaseResponse<string>
            {
                IsSuccess = true,
                Data = null,
                Message = $"Đã chuyển quyền quản lý {request.TransferType} thành công."
            };
        }
        catch (Exception e)
        {
            await transaction.RollbackAsync();
            _logger.LogError(e, "Lỗi khi chuyển quyền quản lý.");
            throw CustomSystemException.SystemExceptionCaller();
        }
    }

    private IQueryable<TEntity> Query<TEntity>() where TEntity : class
    {
        return _unitOfWork.Repository<TEntity>().Query();
    }
}
