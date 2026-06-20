using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Cinema.Application.Dtos;
using Cinema.Application.Dtos.FacilitiesManager.Auditoriums.Responses;
using Cinema.Application.Interfaces.Facilities;
using Cinema.Domain.Exceptions;
using Cinema.Domain.Localization;
using Microsoft.Extensions.Logging;

namespace Cinema.Application.UseCases.FacilitiesManager.Auditoriums;

public class GetAllAuditoriumsUseCase
{
    private readonly IAuditoriumRepository _repository;
    private readonly ILogger<GetAllAuditoriumsUseCase> _logger;

    public GetAllAuditoriumsUseCase(
        IAuditoriumRepository repository,
        ILogger<GetAllAuditoriumsUseCase> logger)
    {
        _repository = repository;
        _logger = logger;
    }

    public async Task<BaseResponse<List<GetResAuditoriumDto>>> ExecuteAsync()
    {
        try
        {
            var getData = await _repository.GetAllAuditoriumsAsync();
            return new BaseResponse<List<GetResAuditoriumDto>>
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
