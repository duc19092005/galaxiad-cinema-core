using Cinema.Application.Infrastructure.Booking;
using Cinema.Application.Interfaces.Booking;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Cinema.Api.Hubs;

public class SeatLockerNotificationService : ISeatLockerNotificationService
{
    private readonly SeatSseManager _seatSseManager;

    public SeatLockerNotificationService(SeatSseManager seatSseManager)
    {
        _seatSseManager = seatSseManager;
    }

    public Task NotifySeatsReleasedAsync(string scheduleId, List<string> seatIds)
    {
        _seatSseManager.ReleaseSeatsForSchedule(scheduleId, seatIds);
        return Task.CompletedTask;
    }
}
