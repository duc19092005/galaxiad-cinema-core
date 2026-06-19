using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Cinema.Application.Dtos;
using Cinema.Application.Dtos.FacilitiesManager.Auditoriums.Responses;
using Cinema.Application.Interfaces.Facilities;
using Cinema.Application.Interfaces.IBehaviors;
using Cinema.Application.Interfaces.ICinema;
using Cinema.Application.Interfaces;
using Cinema.Domain.Exceptions;
using Cinema.Domain.Localization;
using Microsoft.Extensions.Logging;

namespace Cinema.Application.UseCases.FacilitiesManager.Auditoriums;

public class FacilitiesManagerReadAuditoriumUseCase : IReadBehavior<GetResAuditoriumDto>, ICinemaBehavior<GetResAuditoriumDtoCinema>
{
    private readonly IAuditoriumRepository _repository;
    private readonly IUserContextService _userContextService;
    private readonly ILogger<FacilitiesManagerReadAuditoriumUseCase> _logger;

    public FacilitiesManagerReadAuditoriumUseCase(
        IAuditoriumRepository repository,
        IUserContextService userContextService,
        ILogger<FacilitiesManagerReadAuditoriumUseCase> logger)
    {
        _repository = repository;
        _userContextService = userContextService;
        _logger = logger;
    }

    public async Task<BaseResponse<List<GetResAuditoriumDto>>> GetAll()
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

    public async Task<BaseResponse<GetResAuditoriumDto>> GetById(Guid id)
    {
        try
        {
            var userId = _userContextService.GetUserId();
            var result = await _repository.GetAuditoriumByIdAsync(id, userId);

            if (result == null)
            {
                throw new AppException(Messages.Auditorium.CannotFind, 404, "NOTFOUND01");
            }

            return new BaseResponse<GetResAuditoriumDto>
            {
                Data = result,
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

    public async Task<BaseResponse<List<GetResAuditoriumDtoCinema>>> GetByCinemaId(Guid cinemaId)
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

    public Task<BaseResponse<List<GetResAuditoriumDto>>> GetByEntityName(string name)
    {
        throw new NotImplementedException();
    }

    public Task<BaseResponse<List<GetResAuditoriumDtoCinema>>> GetByCinemaName(string name)
    {
        throw new NotImplementedException();
    }
}
