using Cinema.Application.Dtos;
using Cinema.Application.Dtos.MovieManager.Responses;
using Cinema.Application.Interfaces.IBehaviors;
using Cinema.Domain.Localization;
using Cinema.Application.Interfaces;
using Cinema.Application.Interfaces.Admin;

namespace Cinema.Application.UseCases.MovieManager.MovieInfos;

public class ReadMovieInfoUseCase : IReadBehavior<ResGetMovieInfosMovieManagerDto>
{
    private readonly IAdminRepository _adminRepository;
    private readonly IUserContextService _userContextService;

    public ReadMovieInfoUseCase(IAdminRepository adminRepository
    , IUserContextService userContextService)
    {
        this._adminRepository = adminRepository;
        this._userContextService = userContextService;
    }

    public async Task<BaseResponse<List<ResGetMovieInfosMovieManagerDto>>> GetAll()
    {
        return await GetAll(null);
    }

    public async Task<BaseResponse<List<ResGetMovieInfosMovieManagerDto>>> GetAll(Guid? cinemaId)
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

    public async Task<BaseResponse<ResGetMovieInfosMovieManagerDto>> GetById(Guid id)
    {
        Guid currentUserId = GetUserId();
        var isAdmin = _userContextService.IsInRole("Admin");

        var findMovieInfos = await _adminRepository.GetMovieInfoByIdAsync(id, currentUserId, isAdmin);
        
        return new BaseResponse<ResGetMovieInfosMovieManagerDto>()
        {
            Data = findMovieInfos!,
            Message = Messages.Movie.GetInfoSuccess ,
            IsSuccess = true
        };

    }

    public Task<BaseResponse<List<ResGetMovieInfosMovieManagerDto>>> GetByEntityName(string name)
    {
        return Task.FromResult<BaseResponse<List<ResGetMovieInfosMovieManagerDto>>>(null!);
    }

    private Guid GetUserId()
    {
        return _userContextService.GetUserId();
    }
}
