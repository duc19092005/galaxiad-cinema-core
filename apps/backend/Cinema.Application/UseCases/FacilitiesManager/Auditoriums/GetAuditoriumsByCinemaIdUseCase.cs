using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Cinema.Application.Dtos;
using Cinema.Application.Dtos.FacilitiesManager.Auditoriums.Responses;
using Cinema.Application.Interfaces.Facilities;
using Cinema.Application.Exceptions;
using Cinema.Domain.Localization;
using Microsoft.Extensions.Logging;

namespace Cinema.Application.UseCases.FacilitiesManager.Auditoriums;

public class GetAuditoriumsByCinemaIdUseCase
{
    private readonly IAuditoriumRepository _repository;
    private readonly ILogger<GetAuditoriumsByCinemaIdUseCase> _logger;

    public GetAuditoriumsByCinemaIdUseCase(
        IAuditoriumRepository repository,
        ILogger<GetAuditoriumsByCinemaIdUseCase> logger)
    {
        _repository = repository;
        _logger = logger;
    }

    public async Task<BaseResponse<List<GetResAuditoriumDtoCinema>>> ExecuteAsync(Guid cinemaId)
    {
        try
        {
            var getData = await _repository.GetAuditoriumsByCinemaIdAsync(cinemaId);
            return new BaseResponse<List<GetResAuditoriumDtoCinema>>
            {
                Data = getData,
                IsSuccess = true,
                Message = Messages.Auditorium.GetCompleted
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
}
