using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Cinema.Application.Dtos;
using Cinema.Application.Dtos.Shifts;
using Cinema.Application.Interfaces;
using Cinema.Application.Interfaces.Facilities;

namespace Cinema.Application.UseCases.Admin.ShiftSchedules;

/// <summary>
/// Retrieves all pending shift deletion requests for Admin.
/// </summary>
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
        var isAdmin = _userContextService.IsInRole("Admin");
        if (!isAdmin)
        {
            return new BaseResponse<List<ResPendingDeletionRequestDto>>
            {
                IsSuccess = false,
                Message = "Bạn không có quyền thực hiện chức năng này."
            };
        }

        var list = await _repository.GetPendingDeletionRequestsAsync();

        var dtos = new List<ResPendingDeletionRequestDto>();

        foreach (var s in list)
        {
            var count = await _repository.CountApprovedOrPendingRegistrationsForScheduleAsync(s.ShiftScheduleId);

            string requesterName = "Manager";
            if (s.DeletionRequestedByUserId.HasValue)
            {
                var requester = await _repository.GetStaffProfileWithUserAsync(s.DeletionRequestedByUserId.Value);
                if (requester != null && requester.UserInfoEntity != null)
                {
                    requesterName = requester.UserInfoEntity.UserName;
                }
            }

            dtos.Add(new ResPendingDeletionRequestDto
            {
                ShiftScheduleId = s.ShiftScheduleId,
                CinemaId = s.CinemaId,
                CinemaName = s.CinemaInfoEntity != null ? s.CinemaInfoEntity.CinemaName : "",
                DepartmentId = s.DepartmentId,
                DepartmentName = s.DepartmentEntity != null ? s.DepartmentEntity.DepartmentName : "",
                Date = s.Date,
                ShiftName = s.ShiftName,
                StartTime = s.StartTime,
                EndTime = s.EndTime,
                DeletionReason = s.DeletionReason ?? "",
                DeletionRequestedByUserId = s.DeletionRequestedByUserId ?? Guid.Empty,
                DeletionRequestedByUserName = requesterName,
                DeletionRequestedAt = s.DeletionRequestedAt ?? DateTime.UtcNow,
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
