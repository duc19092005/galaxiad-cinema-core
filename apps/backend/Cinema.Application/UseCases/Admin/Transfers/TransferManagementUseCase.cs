using System;
using System.Threading.Tasks;
using Cinema.Application.Dtos;
using Cinema.Application.Dtos.Admin.Responses;
using Cinema.Domain.Constants;
using Microsoft.Extensions.Logging;
using Cinema.Application.Exceptions;
using Cinema.Application.Interfaces.Admin;
using Cinema.Domain.Interfaces.Persistence;
using Cinema.Domain.Localization;

namespace Cinema.Application.UseCases.Admin.Transfers;

public class TransferManagementUseCase
{
    private readonly IAdminAccessScopeRepository _scopeRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ILogger<TransferManagementUseCase> _logger;

    public TransferManagementUseCase(IAdminAccessScopeRepository scopeRepository, IUnitOfWork unitOfWork, ILogger<TransferManagementUseCase> logger)
    {
        _scopeRepository = scopeRepository;
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
                throw new BadRequestException(Messages.Validation.MustProvideItemIdOrSourceUserId, "MGT01");
            }

            if (request.TransferType == TransferTypeEnum.Facilities)
            {
                var cinemas = await _scopeRepository.GetCinemasByManagerOrIdAsync(request.SourceUserId, request.ItemId, true);
                foreach (var cinema in cinemas)
                    cinema.FacilitiesManagerId = request.TargetUserId;
            }
            else if (request.TransferType == TransferTypeEnum.Theater)
            {
                var cinemas = await _scopeRepository.GetCinemasByManagerOrIdAsync(request.SourceUserId, request.ItemId, false);
                foreach (var cinema in cinemas)
                    cinema.TheaterManagerId = request.TargetUserId;
            }
            else
            {
                var movies = await _scopeRepository.GetMoviesByManagerOrIdAsync(request.SourceUserId, request.ItemId);
                foreach (var movie in movies)
                    movie.MovieManagerId = request.TargetUserId;
            }

            await _unitOfWork.SaveChangesAsync();
            await transaction.CommitAsync();

            return new BaseResponse<string>
            {
                IsSuccess = true,
                Data = null,
                Message = $"Transferred management right of '{request.TransferType}' successfully."
            };
        }
        catch (Exception e)
        {
            await transaction.RollbackAsync();
            _logger.LogError(e, "Error transferring management authority.");
            throw CustomSystemException.SystemExceptionCaller();
        }
    }
}
