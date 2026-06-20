using System;
using System.Threading.Tasks;
using Cinema.Application.Dtos;
using Cinema.Application.Dtos.FacilitiesManager.Auditoriums.Responses;
using Cinema.Application.Interfaces;
using Cinema.Application.Interfaces.Facilities;
using Cinema.Domain.Exceptions;
using Cinema.Domain.Localization;
using Microsoft.Extensions.Logging;

namespace Cinema.Application.UseCases.FacilitiesManager.Auditoriums;

public class GetAuditoriumByIdUseCase
{
    private readonly IAuditoriumRepository _repository;
    private readonly IUserContextService _userContextService;
    private readonly ILogger<GetAuditoriumByIdUseCase> _logger;

    public GetAuditoriumByIdUseCase(
        IAuditoriumRepository repository,
        IUserContextService userContextService,
        ILogger<GetAuditoriumByIdUseCase> logger)
    {
        _repository = repository;
        _userContextService = userContextService;
        _logger = logger;
    }

    public async Task<BaseResponse<GetResAuditoriumDto>> ExecuteAsync(Guid id)
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
}
