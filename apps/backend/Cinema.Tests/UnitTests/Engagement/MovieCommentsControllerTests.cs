using Moq;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Cinema.Api.Controllers.Customer.Engagement;
using Cinema.Application.Dtos;
using Cinema.Application.Dtos.Comments;
using Cinema.Application.UseCases.Customer.Engagement.Comments;
using Cinema.Application.Exceptions;

namespace Cinema.Tests.UnitTests.Engagement;

public class MovieCommentsControllerTests
{
    private readonly Mock<GetMovieCommentsUseCase> _getCommentsUseCase;
    private readonly Mock<CreateMovieCommentUseCase> _postCommentUseCase;
    private readonly Mock<DeleteOwnCommentUseCase> _deleteCommentUseCase;
    private readonly MovieCommentsController _controller;

    public MovieCommentsControllerTests()
    {
        _getCommentsUseCase = new Mock<GetMovieCommentsUseCase>();
        _postCommentUseCase = new Mock<CreateMovieCommentUseCase>();
        _deleteCommentUseCase = new Mock<DeleteOwnCommentUseCase>();
        _controller = new MovieCommentsController(
            _getCommentsUseCase.Object,
            _postCommentUseCase.Object,
            _deleteCommentUseCase.Object);
    }

    [Fact]
    public async Task GetComments_ValidMovieId_ReturnsPaginatedComments()
    {
        var movieId = Guid.NewGuid();
        var response = new BaseResponse<object>
        {
            IsSuccess = true,
            Data = new
            {
                Items = new[]
                {
                    new { CommentId = "c1", Content = "Great movie!", Username = "User1" },
                    new { CommentId = "c2", Content = "Loved it!", Username = "User2" }
                },
                TotalPages = 1
            }
        };

        _getCommentsUseCase.Setup(x => x.ExecuteAsync(movieId, It.IsAny<int>(), It.IsAny<int>()))
            .ReturnsAsync(response);

        var result = await _controller.GetComments(movieId, 0, 10);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task PostComment_ValidContent_ReturnsOk()
    {
        var movieId = Guid.NewGuid();
        var request = new ReqPostCommentDto { Content = "Amazing film!" };
        var response = new BaseResponse<object>
        {
            IsSuccess = true,
            Data = new { CommentId = "new-comment", Content = "Amazing film!" }
        };

        _postCommentUseCase.Setup(x => x.ExecuteAsync(movieId, It.IsAny<ReqPostCommentDto>()))
            .ReturnsAsync(response);

        var result = await _controller.PostComment(movieId, request);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task PostComment_EmptyContent_ThrowsAppException()
    {
        var movieId = Guid.NewGuid();
        var request = new ReqPostCommentDto { Content = "" };

        _postCommentUseCase.Setup(x => x.ExecuteAsync(movieId, It.IsAny<ReqPostCommentDto>()))
            .ThrowsAsync(new AppException("Comment content cannot be empty", 400));

        await Assert.ThrowsAsync<AppException>(() => _controller.PostComment(movieId, request));
    }

    [Fact]
    public async Task DeleteComment_OwnComment_ReturnsOk()
    {
        var commentId = Guid.NewGuid();
        var response = new BaseResponse<object>
        {
            IsSuccess = true,
            Message = "Comment deleted"
        };

        _deleteCommentUseCase.Setup(x => x.ExecuteAsync(commentId, It.IsAny<Guid>()))
            .ReturnsAsync(response);

        var result = await _controller.DeleteComment(commentId);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task DeleteComment_OthersComment_ThrowsForbidden()
    {
        var commentId = Guid.NewGuid();
        _deleteCommentUseCase.Setup(x => x.ExecuteAsync(commentId, It.IsAny<Guid>()))
            .ThrowsAsync(new AppException("Cannot delete another user's comment", 403));

        await Assert.ThrowsAsync<AppException>(() => _controller.DeleteComment(commentId));
    }
}
