using Cinema.Application.Exceptions;
using Cinema.Domain.Localization;
using Cinema.Application.Dtos;
using Cinema.Application.Dtos.FacilitiesManager.MovieInfos.MovieFormats.Responses;
using Cinema.Application.Interfaces.Facilities;
using Microsoft.Extensions.Logging;

namespace Cinema.Application.UseCases.FacilitiesManager.MovieFormat;

public class FacilitiesManagerReadMovieFormatUseCase
{
    private readonly IMovieFormatRepository _repository;
    private readonly ILogger<FacilitiesManagerReadMovieFormatUseCase> _logger;

    public FacilitiesManagerReadMovieFormatUseCase(
        IMovieFormatRepository repository,
        ILogger<FacilitiesManagerReadMovieFormatUseCase> logger)
    {
        _repository = repository;
        _logger = logger;
    }

    public async Task<BaseResponse<List<ResFacilitiesManagerMovieFormatDto>>> GetAll()
    {
        try
        {
            var results = await _repository.GetAllMovieFormatsAsync();

            return new BaseResponse<List<ResFacilitiesManagerMovieFormatDto>>
            {
                IsSuccess = true,
                Data = results,
                Message = Messages.MovieFormat.GetDataSuccess
            };
        }
        catch (Exception ex)
        {
            if (ex is AppException) throw;
            _logger.LogError(ex, ex.Message);
            throw CustomSystemException.SystemExceptionCaller();
        }
    }
}
