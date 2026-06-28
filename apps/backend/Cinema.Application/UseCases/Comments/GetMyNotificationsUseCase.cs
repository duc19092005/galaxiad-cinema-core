using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Cinema.Application.Dtos;
using Cinema.Application.Dtos.Comments;
using Cinema.Application.Interfaces.Comments;
using Cinema.Application.Interfaces;

namespace Cinema.Application.UseCases.Comments;

public class GetMyNotificationsUseCase
{
    private readonly IMovieCommentRepository _commentRepository;
    private readonly IUserContextService _userContextService;

    public GetMyNotificationsUseCase(IMovieCommentRepository commentRepository, IUserContextService userContextService)
    {
        _commentRepository = commentRepository;
        _userContextService = userContextService;
    }

    public async Task<BaseResponse<List<ResUserNotificationDto>>> ExecuteAsync()
    {
        var userId = _userContextService.GetUserId();
        var notifications = await _commentRepository.GetNotificationsByUserIdAsync(userId);

        return new BaseResponse<List<ResUserNotificationDto>>
        {
            IsSuccess = true,
            Message = "Get notifications successfully.",
            Data = notifications
        };
    }
}

