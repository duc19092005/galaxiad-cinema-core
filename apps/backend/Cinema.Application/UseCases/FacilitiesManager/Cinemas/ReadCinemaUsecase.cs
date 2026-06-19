using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Cinema.Domain.Exceptions;
using Cinema.Domain.Localization;
using Cinema.Application.Dtos;
using Cinema.Application.Dtos.FacilitiesManager.Cinemas.Responses;
using Cinema.Application.Interfaces.Facilities;
using Cinema.Application.Interfaces.IBehaviors;
using Cinema.Application.Interfaces;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;

namespace Cinema.Application.UseCases.FacilitiesManager.Cinemas;

public class FacilitiesManagerReadCinemaUseCase : IReadBehavior<ResFacilitiesManagerCinema>
{
    private readonly ICinemaRepository _repository;
    private readonly IUserContextService _userContextService;
    private readonly ILogger<FacilitiesManagerReadCinemaUseCase> _logger;

    public FacilitiesManagerReadCinemaUseCase(
        ICinemaRepository repository,
        ILogger<FacilitiesManagerReadCinemaUseCase> logger,
        IUserContextService userContextService)
    {
        _repository = repository;
        _logger = logger;
        _userContextService = userContextService;
    }
    
    public async Task<BaseResponse<List<ResFacilitiesManagerCinema>>> GetAll()
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

    public async Task<BaseResponse<ResFacilitiesManagerCinema>> GetById(Guid id)
    {
        try
        {
            var userId = _userContextService.GetUserId();
            var isAdmin = _userContextService.IsInRole("Admin");
            var isFacilitiesManager = _userContextService.IsInRole("FacilitiesManager");
            var isTheaterManager = _userContextService.IsInRole("TheaterManager");

            var cinemaData = await _repository.GetCinemaByIdAsync(id, userId, isAdmin, isFacilitiesManager, isTheaterManager);

            if (cinemaData == null)
            {
                throw new AppException(Messages.Cinema.NotFound,
                    StatusCodes.Status404NotFound, "NotFound01");
            }

            return new BaseResponse<ResFacilitiesManagerCinema>
            {
                IsSuccess = true,
                Data = cinemaData,
                Message = Messages.Cinema.GetInfoSuccess
            };
        }
        catch (Exception e)
        {
            _logger.LogError(e.Message);
            throw CustomSystemException.SystemExceptionCaller();
        }
    }

    public Task<BaseResponse<List<ResFacilitiesManagerCinema>>> GetByEntityName(string name)
    {
        throw new NotImplementedException();
    }
}
