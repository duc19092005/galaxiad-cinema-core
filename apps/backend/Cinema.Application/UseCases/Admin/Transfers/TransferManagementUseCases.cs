using Cinema.Application.Dtos;
using Cinema.Application.Dtos.Admin.Responses;
using Cinema.Application.Constants;
using Microsoft.Extensions.Logging;
using Cinema.Domain.Exceptions;
using Cinema.Application.Interfaces.Admin;
using Cinema.Domain.Interfaces.Persistence;

namespace Cinema.Application.UseCases.Admin.Transfers;

public class GetUsersByRoleUseCase
{
    private readonly IAdminRepository _adminRepository;

    public GetUsersByRoleUseCase(IAdminRepository adminRepository)
    {
        _adminRepository = adminRepository;
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

        var users = await _adminRepository.GetUsersByRoleAsync(roleId);

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
    private readonly IAdminRepository _adminRepository;

    public GetManagedItemsUseCase(IAdminRepository adminRepository)
    {
        _adminRepository = adminRepository;
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
            var results = await _adminRepository.GetManagedCinemasAsync(userGuid, filterUnmanaged, transferType == TransferTypeEnum.Facilities);
            return new BaseResponse<List<ManagedItemDto>>
            {
                IsSuccess = true,
                Data = results,
                Message = $"Lấy danh sách rạp ({(transferType == TransferTypeEnum.Facilities ? "CSVC" : "Vận hành")}) thành công."
            };
        }
        else
        {
            var movies = await _adminRepository.GetManagedMoviesAsync(userGuid, filterUnmanaged);
            return new BaseResponse<List<ManagedItemDto>> { IsSuccess = true, Data = movies, Message = "Lấy danh sách phim thành công." };
        }
    }
}

public class TransferManagementUseCase
{
    private readonly IAdminRepository _adminRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ILogger<TransferManagementUseCase> _logger;

    public TransferManagementUseCase(IAdminRepository adminRepository, IUnitOfWork unitOfWork, ILogger<TransferManagementUseCase> logger)
    {
        _adminRepository = adminRepository;
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
                var cinemas = await _adminRepository.GetCinemasByManagerOrIdAsync(request.SourceUserId, request.ItemId, true);
                foreach (var cinema in cinemas)
                    cinema.FacilitiesManagerId = request.TargetUserId;
            }
            else if (request.TransferType == TransferTypeEnum.Theater)
            {
                var cinemas = await _adminRepository.GetCinemasByManagerOrIdAsync(request.SourceUserId, request.ItemId, false);
                foreach (var cinema in cinemas)
                    cinema.TheaterManagerId = request.TargetUserId;
            }
            else
            {
                var movies = await _adminRepository.GetMoviesByManagerOrIdAsync(request.SourceUserId, request.ItemId);
                foreach (var movie in movies)
                    movie.MovieManagerId = request.TargetUserId;
            }

            await _adminRepository.SaveChangesAsync();
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
