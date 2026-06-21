using System;
using System.Threading.Tasks;
using Cinema.Application.Dtos;
using Cinema.Application.Dtos.FacilitiesManager.Cinemas.Responses;
using Cinema.Application.Interfaces;
using Cinema.Application.Interfaces.Facilities;
using Cinema.Application.Exceptions;
using Cinema.Domain.Localization;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;

namespace Cinema.Application.UseCases.FacilitiesManager.Cinemas;

public class GetCinemaByIdUseCase
{
    private readonly ICinemaRepository _repository;
    private readonly IUserContextService _userContextService;
    private readonly ILogger<GetCinemaByIdUseCase> _logger;

    public GetCinemaByIdUseCase(
        ICinemaRepository repository,
        ILogger<GetCinemaByIdUseCase> logger,
        IUserContextService userContextService)
    {
        _repository = repository;
        _logger = logger;
        _userContextService = userContextService;
    }

    public async Task<BaseResponse<ResFacilitiesManagerCinema>> ExecuteAsync(Guid id)
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
}
