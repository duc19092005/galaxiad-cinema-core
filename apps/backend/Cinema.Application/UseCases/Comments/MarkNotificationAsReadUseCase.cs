using System;
using System.Threading.Tasks;
using Cinema.Application.Dtos;
using Cinema.Domain.Entities.UserInfos;
using Cinema.Application.Interfaces.Comments;
using Cinema.Application.Interfaces;
using Cinema.Application.Exceptions;
using Cinema.Domain.Interfaces.Persistence;

namespace Cinema.Application.UseCases.Comments;

public class MarkNotificationAsReadUseCase
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMovieCommentRepository _commentRepository;
    private readonly IUserContextService _userContextService;

    public MarkNotificationAsReadUseCase(
        IUnitOfWork unitOfWork,
        IMovieCommentRepository commentRepository,
        IUserContextService userContextService)
    {
        _unitOfWork = unitOfWork;
        _commentRepository = commentRepository;
        _userContextService = userContextService;
    }

    public async Task<BaseResponse<bool>> ExecuteAsync(Guid notificationId)
    {
        var userId = _userContextService.GetUserId();
        var notification = await _commentRepository.GetNotificationByIdAndUserAsync(notificationId, userId);
        if (notification == null)
        {
            throw new NotFoundException("Khong tim thay thong bao.");
        }

        notification.IsRead = true;
        _unitOfWork.Repository<UserNotificationEntity>().Update(notification);
        await _unitOfWork.SaveChangesAsync();

        return new BaseResponse<bool>
        {
            IsSuccess = true,
            Message = "Da doc thong bao.",
            Data = true
        };
    }
}
