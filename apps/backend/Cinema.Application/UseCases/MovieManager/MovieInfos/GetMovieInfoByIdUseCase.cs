using Cinema.Application.Dtos;
using Cinema.Application.Dtos.MovieManager.Responses;
using Cinema.Domain.Localization;
using Cinema.Application.Interfaces;
using Cinema.Application.Interfaces.Admin;

namespace Cinema.Application.UseCases.MovieManager.MovieInfos;

public class GetMovieInfoByIdUseCase
{
    private readonly IAdminRepository _adminRepository;
    private readonly IUserContextService _userContextService;

    public GetMovieInfoByIdUseCase(
        IAdminRepository adminRepository, 
        IUserContextService userContextService)
    {
        _adminRepository = adminRepository;
        _userContextService = userContextService;
    }

    public async Task<BaseResponse<ResGetMovieInfosMovieManagerDto>> ExecuteAsync(Guid id)
    {
        Guid currentUserId = _userContextService.GetUserId();
        var isAdmin = _userContextService.IsInRole("Admin");

        var findMovieInfos = await _adminRepository.GetMovieInfoByIdAsync(id, currentUserId, isAdmin);
        
        return new BaseResponse<ResGetMovieInfosMovieManagerDto>()
        {
            Data = findMovieInfos!,
            Message = Messages.Movie.GetInfoSuccess ,
            IsSuccess = true
        };
    }
}
