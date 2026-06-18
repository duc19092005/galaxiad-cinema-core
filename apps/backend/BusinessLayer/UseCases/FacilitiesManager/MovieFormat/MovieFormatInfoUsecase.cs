using Shared.Exceptions;
using Shared.Localization;
using BusinessLayer.Dtos;
using BusinessLayer.Dtos.FacilitiesManager.MovieInfos.MovieFormats.Responses;
using BusinessLayer.Interfaces.IBehaviors;
using BusinessLayer.Entities.MovieInfos;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Shared.Interfaces.Persistence;

namespace BusinessLayer.UseCases.FacilitiesManager.MovieFormat;

public class FacilitiesManagerReadMovieFormatUseCase : IReadBehavior<ResFacilitiesManagerMovieFormatDto>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ILogger<FacilitiesManagerReadMovieFormatUseCase> _logger;

    public FacilitiesManagerReadMovieFormatUseCase(IUnitOfWork unitOfWork
    ,ILogger<FacilitiesManagerReadMovieFormatUseCase> logger)
    {
        this._unitOfWork = unitOfWork;
        this._logger = logger;
    }
    public async Task<BaseResponse<List<ResFacilitiesManagerMovieFormatDto>>> GetAll()
    {
        try
        {
            var results = await _unitOfWork.Repository<MovieFormatInfoEntity>().Query().Select(x =>
                new ResFacilitiesManagerMovieFormatDto()
                {
                    FormatId = x.MovieFormatId,
                    FormatDescription = x.MovieFormatDescription,
                    FormatName = x.MovieFormatName,
                    MovieFormatPrice = x.MovieFormatPrice
                }).ToListAsync();

            return new BaseResponse<List<ResFacilitiesManagerMovieFormatDto>>
            {
                IsSuccess = true,
                Data = results,
                Message = Messages.MovieFormat.GetDataSuccess
            };
        }
        catch (Exception ex)
        {
            if (ex is AppException)
            {
                throw;
            }
            _logger.LogError(ex, ex.Message);
            throw CustomSystemException.SystemExceptionCaller();
        }
    }

    public Task<BaseResponse<ResFacilitiesManagerMovieFormatDto>> GetById(Guid id)
    {
        return Task.FromResult<BaseResponse<ResFacilitiesManagerMovieFormatDto>>(null!);
    }

    public Task<BaseResponse<List<ResFacilitiesManagerMovieFormatDto>>> GetByEntityName(string name)
    {
        return Task.FromResult<BaseResponse<List<ResFacilitiesManagerMovieFormatDto>>>(null!);
    }
}
