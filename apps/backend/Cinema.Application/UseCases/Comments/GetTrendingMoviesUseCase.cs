using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Cinema.Application.Dtos;
using Cinema.Application.Dtos.Comments;
using Cinema.Application.Interfaces.Comments;

namespace Cinema.Application.UseCases.Comments;

public class GetTrendingMoviesUseCase
{
    private readonly IMovieCommentRepository _commentRepository;

    public GetTrendingMoviesUseCase(IMovieCommentRepository commentRepository)
    {
        _commentRepository = commentRepository;
    }

    public async Task<BaseResponse<List<ResTrendingMovieDto>>> ExecuteAsync(int days = 30, int take = 10, Guid? cinemaId = null, string? city = null)
    {
        days = Math.Clamp(days, 1, 365);
        take = Math.Clamp(take, 1, 30);
        var from = DateTime.UtcNow.AddDays(-days);

        var trendingMovies = await _commentRepository.GetTrendingMoviesAsync(from, cinemaId, city);
        
        var result = trendingMovies
            .Take(take)
            .ToList();

        return new BaseResponse<List<ResTrendingMovieDto>>
        {
            IsSuccess = true,
            Message = "Get trending movies successfully.",
            Data = result
        };
    }
}

