using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Cinema.Application.Dtos;
using Cinema.Application.Dtos.FacilitiesManager.Cinemas.Responses;
using Cinema.Application.Interfaces;
using Cinema.Application.Interfaces.Facilities;
using Cinema.Application.Exceptions;
using Cinema.Domain.Localization;
using Microsoft.Extensions.Logging;

namespace Cinema.Application.UseCases.FacilitiesManager.Cinemas;

public class GetAllCinemasUseCase
{
    private readonly ICinemaRepository _repository;
    private readonly IUserContextService _userContextService;
    private readonly ILogger<GetAllCinemasUseCase> _logger;

    public GetAllCinemasUseCase(
        ICinemaRepository repository,
        ILogger<GetAllCinemasUseCase> logger,
        IUserContextService userContextService)
    {
        _repository = repository;
        _logger = logger;
        _userContextService = userContextService;
    }
    
    public async Task<BaseResponse<List<ResFacilitiesManagerCinema>>> ExecuteAsync()
    {
        try
        {
            var userId = _userContextService.GetUserId();
            var isAdmin = _userContextService.IsInRole("Admin");
            var isFacilitiesManager = _userContextService.IsInRole("FacilitiesManager");
            var isTheaterManager = _userContextService.IsInRole("TheaterManager");

            var getResults = await _repository.GetAllCinemasAsync(userId, isAdmin, isFacilitiesManager, isTheaterManager);

            return new BaseResponse<List<ResFacilitiesManagerCinema>>
            {
                IsSuccess = true,
                Data = getResults,
                Message = Messages.Cinema.GetListSuccess
            };
        }
        catch (Exception e)
        {
            _logger.LogError(e.Message);
            throw CustomSystemException.SystemExceptionCaller();
        }
    }
}
