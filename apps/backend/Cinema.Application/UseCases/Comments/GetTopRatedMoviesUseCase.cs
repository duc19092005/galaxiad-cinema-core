using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Cinema.Application.Dtos;
using Cinema.Application.Dtos.Comments;
using Cinema.Application.Interfaces.Comments;

namespace Cinema.Application.UseCases.Comments;

public class GetTopRatedMoviesUseCase
{
    private readonly IMovieCommentRepository _commentRepository;

    public GetTopRatedMoviesUseCase(IMovieCommentRepository commentRepository)
    {
        _commentRepository = commentRepository;
    }

    public async Task<BaseResponse<List<ResTrendingMovieDto>>> ExecuteAsync(int take = 5, Guid? cinemaId = null)
    {
        take = Math.Clamp(take, 1, 30);
        var topRatedMovies = await _commentRepository.GetTopRatedMoviesAsync(cinemaId);

        var result = topRatedMovies
            .Take(take)
            .ToList();

        return new BaseResponse<List<ResTrendingMovieDto>>
        {
            IsSuccess = true,
            Message = "Lay danh sach phim danh gia cao thanh cong.",
            Data = result
        };
    }
}
