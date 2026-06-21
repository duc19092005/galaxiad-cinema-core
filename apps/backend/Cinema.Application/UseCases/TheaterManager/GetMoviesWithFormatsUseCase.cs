using Cinema.Application.Dtos;
using Cinema.Application.Interfaces.Facilities;
using Cinema.Application.Interfaces;
using Cinema.Application.Dtos.TheaterManager;
using Microsoft.Extensions.Logging;
using Cinema.Application.Exceptions;

namespace Cinema.Application.UseCases.TheaterManager;

public class GetMoviesWithFormatsUseCase
{
    private readonly ITheaterManagerDataRepository _repository;
    private readonly IUserContextService _userContextService;
    private readonly ILogger<GetMoviesWithFormatsUseCase> _logger;

    public GetMoviesWithFormatsUseCase(
        ITheaterManagerDataRepository repository,
        IUserContextService userContextService,
        ILogger<GetMoviesWithFormatsUseCase> logger)
    {
        _repository = repository;
        _userContextService = userContextService;
        _logger = logger;
    }

    public async Task<BaseResponse<List<TheaterManagerMovieOptionDto>>> ExecuteAsync(Guid cinemaId)
    {
        var userId = _userContextService.GetUserId();
        var isAdmin = _userContextService.IsInRole("Admin");

        if (!isAdmin)
        {
            var isManager = await _repository.IsManagerOfCinemaAsync(cinemaId, userId);
            if (!isManager)
            {
                return new BaseResponse<List<TheaterManagerMovieOptionDto>>
                {
                    IsSuccess = false,
                    Message = "Bạn không có quyền quản lý rạp này."
                };
            }
        }

        var movies = await _repository.GetMoviesWithFormatsAsync(cinemaId);

        return new BaseResponse<List<TheaterManagerMovieOptionDto>>
        {
            IsSuccess = true,
            Data = movies,
            Message = "Lấy dữ liệu chọn phim thành công"
        };
    }
}
