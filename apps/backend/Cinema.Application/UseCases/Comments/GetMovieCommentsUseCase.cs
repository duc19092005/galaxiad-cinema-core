using System;
using System.Threading.Tasks;
using Cinema.Application.Dtos;
using Cinema.Application.Dtos.Comments;
using Cinema.Application.Interfaces.Comments;

namespace Cinema.Application.UseCases.Comments;

public class GetMovieCommentsUseCase
{
    private readonly IMovieCommentRepository _commentRepository;

    public GetMovieCommentsUseCase(IMovieCommentRepository commentRepository)
    {
        _commentRepository = commentRepository;
    }

    public async Task<BaseResponse<ResMovieCommentsSummaryDto>> ExecuteAsync(Guid movieId)
    {
        var summary = await _commentRepository.GetMovieCommentsSummaryAsync(movieId);

        return new BaseResponse<ResMovieCommentsSummaryDto>
        {
            IsSuccess = true,
            Message = "Lay danh sach binh luan thanh cong.",
            Data = summary
        };
    }
}
