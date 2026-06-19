using Cinema.Application.Dtos;
using Cinema.Application.Dtos.Admin.Responses;
using Cinema.Application.Constants;
using Cinema.Domain.Entities.CinemaInfos;
using Cinema.Domain.Entities.MovieInfos;
using Cinema.Domain.Entities.UserInfos;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Cinema.Domain.Exceptions;
using Cinema.Domain.Interfaces.Persistence;

namespace Cinema.Application.UseCases.Admin.Transfers;

public class GetUsersByRoleUseCase
{
    private readonly IUnitOfWork _unitOfWork;

    public GetUsersByRoleUseCase(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<BaseResponse<List<AdminTransferUserDto>>> ExecuteAsync(TransferTypeEnum transferType)
    {
        Guid roleId = transferType switch
        {
            TransferTypeEnum.Facilities => userRoles.FacilitiesManager,
            TransferTypeEnum.Theater => userRoles.TheaterManager,
            TransferTypeEnum.Movie => userRoles.MovieManager,
            _ => throw new BadRequestException("Loại chuyển quyền không hợp lệ.", "B02")
        };

        var users = await _unitOfWork.Repository<UserRoleInfoEntity>().Query()
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
}

public class GetManagedItemsUseCase
{
    private readonly IUnitOfWork _unitOfWork;

    public GetManagedItemsUseCase(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<BaseResponse<List<ManagedItemDto>>> ExecuteAsync(string? userId, TransferTypeEnum transferType)
    {
        bool filterUnmanaged = string.IsNullOrEmpty(userId) || userId.ToLower() == "unmanaged";
        Guid? userGuid = null;
        if (!filterUnmanaged && !string.IsNullOrEmpty(userId))
        {
            if (Guid.TryParse(userId, out var parsedGuid)) userGuid = parsedGuid;
        }

        if (transferType == TransferTypeEnum.Facilities || transferType == TransferTypeEnum.Theater)
        {
            var query = _unitOfWork.Repository<CinemaInfoEntity>().Query().AsNoTracking();

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
            else
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
        else
        {
            var query = _unitOfWork.Repository<MovieInfoEntity>().Query().AsNoTracking();
            if (filterUnmanaged) query = query.Where(m => m.MovieManagerId == null);
            else if (userGuid.HasValue) query = query.Where(m => m.MovieManagerId == userGuid.Value);

            var movies = await query.Select(m => new ManagedItemDto
            {
                ItemId = m.MovieId,
                ItemName = m.MovieName,
                Description = $"Đạo diễn: {m.Director}",
                ManagerName = m.MovieManager != null ? m.MovieManager.UserName ?? "Chưa có quản lý" : "Chưa có quản lý"
            }).ToListAsync();

            return new BaseResponse<List<ManagedItemDto>> { IsSuccess = true, Data = movies, Message = "Lấy danh sách phim thành công." };
        }
    }
}

public class TransferManagementUseCase
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ILogger<TransferManagementUseCase> _logger;

    public TransferManagementUseCase(IUnitOfWork unitOfWork, ILogger<TransferManagementUseCase> logger)
    {
        _unitOfWork = unitOfWork;
        _logger = logger;
    }

    public async Task<BaseResponse<string>> ExecuteAsync(TransferManagementReqDto request)
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
                var query = _unitOfWork.Repository<CinemaInfoEntity>().Query();
                if (request.ItemId.HasValue) query = query.Where(c => c.CinemaId == request.ItemId.Value);
                else query = query.Where(c => c.FacilitiesManagerId == request.SourceUserId);

                var cinemas = await query.ToListAsync();
                foreach (var cinema in cinemas)
                    cinema.FacilitiesManagerId = request.TargetUserId;
            }
            else if (request.TransferType == TransferTypeEnum.Theater)
            {
                var query = _unitOfWork.Repository<CinemaInfoEntity>().Query();
                if (request.ItemId.HasValue) query = query.Where(c => c.CinemaId == request.ItemId.Value);
                else query = query.Where(c => c.TheaterManagerId == request.SourceUserId);

                var cinemas = await query.ToListAsync();
                foreach (var cinema in cinemas)
                    cinema.TheaterManagerId = request.TargetUserId;
            }
            else
            {
                var query = _unitOfWork.Repository<MovieInfoEntity>().Query();
                if (request.ItemId.HasValue) query = query.Where(m => m.MovieId == request.ItemId.Value);
                else query = query.Where(m => m.MovieManagerId == request.SourceUserId);

                var movies = await query.ToListAsync();
                foreach (var movie in movies)
                    movie.MovieManagerId = request.TargetUserId;
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
}
