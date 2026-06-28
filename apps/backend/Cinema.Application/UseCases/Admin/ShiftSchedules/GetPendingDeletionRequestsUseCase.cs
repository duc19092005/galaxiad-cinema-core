using Cinema.Application.Dtos;
using Cinema.Application.Dtos.Shifts;
using Cinema.Application.Interfaces;
using Cinema.Application.Interfaces.Facilities;
using Cinema.Domain.Localization;

namespace Cinema.Application.UseCases.Admin.ShiftSchedules;

public class GetPendingDeletionRequestsUseCase
{
    private readonly IShiftManagerRepository _repository;
    private readonly IUserContextService _userContextService;

    public GetPendingDeletionRequestsUseCase(
        IShiftManagerRepository repository,
        IUserContextService userContextService)
    {
        _repository = repository;
        _userContextService = userContextService;
    }

    public async Task<BaseResponse<List<ResPendingDeletionRequestDto>>> ExecuteAsync()
    {
        if (!_userContextService.IsInRole("Admin"))
        {
            return new BaseResponse<List<ResPendingDeletionRequestDto>>
            {
                IsSuccess = false,
                Message = Messages.Staff.NoPermissionPerformAction
            };
        }

        var list = await _repository.GetPendingDeletionRequestsAsync();
        var dtos = new List<ResPendingDeletionRequestDto>();

        foreach (var schedule in list)
        {
            var count = await _repository.CountApprovedOrPendingRegistrationsForScheduleAsync(schedule.ShiftScheduleId);
            var requesterName = "Manager";

            if (schedule.DeletionRequestedByUserId.HasValue)
            {
                var requester = await _repository.GetStaffProfileWithUserAsync(schedule.DeletionRequestedByUserId.Value);
                if (requester?.UserInfoEntity != null)
                {
                    requesterName = requester.UserInfoEntity.UserName;
                }
            }

            dtos.Add(new ResPendingDeletionRequestDto
            {
                ShiftScheduleId = schedule.ShiftScheduleId,
                CinemaId = schedule.CinemaId,
                CinemaName = schedule.CinemaInfoEntity?.CinemaName ?? string.Empty,
                DepartmentId = schedule.DepartmentId,
                DepartmentName = schedule.DepartmentEntity?.DepartmentName ?? string.Empty,
                Date = schedule.Date,
                ShiftName = schedule.ShiftName,
                StartTime = schedule.StartTime,
                EndTime = schedule.EndTime,
                DeletionReason = schedule.DeletionReason ?? string.Empty,
                DeletionRequestedByUserId = schedule.DeletionRequestedByUserId ?? Guid.Empty,
                DeletionRequestedByUserName = requesterName,
                DeletionRequestedAt = schedule.DeletionRequestedAt ?? DateTime.UtcNow,
                RegisteredStaffCount = count
            });
        }

        return new BaseResponse<List<ResPendingDeletionRequestDto>>
        {
            IsSuccess = true,
            Data = dtos
        };
    }
}
