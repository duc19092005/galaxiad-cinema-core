using Shared.Exceptions;
using Shared.Localization;
using BusinessLayer.Dtos;
using BusinessLayer.Dtos.FacilitiesManager.MovieInfos.MovieFormats;
using BusinessLayer.Interfaces.IBehaviors;
using DataAccess;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace BusinessLayer.UseCases.FacilitiesManager.MovieFormat;

public class FacilitiesManagerReadMovieFormatUseCase : IReadBehavior<ResFacilitiesManagerMovieFormatDto>
{
    private readonly CinemaDbContext _dbContext;
    private readonly ILogger<FacilitiesManagerReadMovieFormatUseCase> _logger;

    public FacilitiesManagerReadMovieFormatUseCase(CinemaDbContext dbContext
    ,ILogger<FacilitiesManagerReadMovieFormatUseCase> logger)
    {
        this._dbContext = dbContext;
        this._logger = logger;
    }
    public async Task<BaseResponse<List<ResFacilitiesManagerMovieFormatDto>>> GetAll()
    {
        try
        {
            var results = await _dbContext.MovieFormatInfoEntity.Select(x =>
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
        catch (AppException)
        {
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, ex.Message);
            throw CustomSystemException.SystemExceptionCaller();
        }
    }

    public async Task<BaseResponse<ResFacilitiesManagerMovieFormatDto>> GetById(Guid id)
    {
        return null!;
    }

    public async Task<BaseResponse<List<ResFacilitiesManagerMovieFormatDto>>> GetByEntityName(string name)
    {
        return null!;
    }
}

