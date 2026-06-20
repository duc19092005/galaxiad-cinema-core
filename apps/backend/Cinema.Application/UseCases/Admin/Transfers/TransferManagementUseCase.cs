using System;
using System.Threading.Tasks;
using Cinema.Application.Dtos;
using Cinema.Application.Dtos.Admin.Responses;
using Cinema.Application.Constants;
using Microsoft.Extensions.Logging;
using Cinema.Domain.Exceptions;
using Cinema.Application.Interfaces.Admin;
using Cinema.Domain.Interfaces.Persistence;

namespace Cinema.Application.UseCases.Admin.Transfers;

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
