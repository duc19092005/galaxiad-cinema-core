using Cinema.Application.Dtos;
using Cinema.Application.Dtos.Shifts;
using Cinema.Application.Interfaces.Facilities;
using Cinema.Application.Mappers.Booking;
using Cinema.Domain.Utils;

namespace Cinema.Application.UseCases.Staff;

/// <summary>
/// Gets the working history for the logged-in staff member.
/// </summary>
public class GetMyWorkingHistoryUseCase
{
    private readonly IStaffShiftRepository _repository;

    public GetMyWorkingHistoryUseCase(IStaffShiftRepository repository)
    {
        _repository = repository;
    }

    public async Task<BaseResponse<List<ResStaffWorkingLogDto>>> ExecuteAsync(Guid staffId)
    {
        var history = await _repository.GetMyWorkingHistoryAsync(staffId);
        var sales = await _repository.GetTicketSalesForWorkingLogsAsync(staffId, history);
        // Convert UTC times stored in DB to Vietnam time (UTC+7) before returning to FE
        var dtos = history.Select(l => new ResStaffWorkingLogDto
        {
            StaffWorkingLoggerId = l.StaffWorkingLoggerId,
            SalaryPerHour = l.SalaryPerHour,
            WorkingHour = l.WorkingHour,
            StartedShiftTime = DateTimeHelper.ToVietnamTime(l.StartedShiftTime),
            EndedShiftTime = DateTimeHelper.ToVietnamTime(l.EndedShiftTime),
            WorkingDate = DateTimeHelper.ToVietnamTime(l.WorkingDate),
            TotalReceived = l.TotalReceived,
            Sales = sales
                .Where(o => o.OrderDate >= l.StartedShiftTime && o.OrderDate <= (l.EndedShiftTime ?? DateTime.UtcNow))
                .Select(BookingMapper.ToResStaffSaleHistoryDto)
                .ToList()
        }).ToList();
        return new BaseResponse<List<ResStaffWorkingLogDto>> { IsSuccess = true, Data = dtos };
    }
}

