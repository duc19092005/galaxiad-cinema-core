using Cinema.Application.Dtos;
using Cinema.Application.Dtos.MovieManager.Responses;
using Cinema.Domain.Localization;
using Cinema.Application.Interfaces;
using Cinema.Application.Interfaces.Admin;

namespace Cinema.Application.UseCases.MovieManager.MovieInfos;

public class GetMovieInfosUseCase
{
    private readonly IAdminRepository _adminRepository;
    private readonly IUserContextService _userContextService;

    public GetMovieInfosUseCase(
        IAdminRepository adminRepository, 
        IUserContextService userContextService)
    {
        _adminRepository = adminRepository;
        _userContextService = userContextService;
    }

    public async Task<BaseResponse<List<ResGetMovieInfosMovieManagerDto>>> ExecuteAsync(Guid? cinemaId)
    {
        var findUserId = _userContextService.GetUserId();
        var isAdmin = _userContextService.IsInRole("Admin");

        var getUserMovieInfos = await _adminRepository.GetMovieInfosAsync(findUserId, isAdmin, cinemaId);

        return new BaseResponse<List<ResGetMovieInfosMovieManagerDto>>()
        {
            IsSuccess = true,
            Data = getUserMovieInfos,
            Message = Messages.Movie.GetListSuccess
        };
    }
}
