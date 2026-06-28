using Cinema.Application.Interfaces.Booking;
using Microsoft.AspNetCore.SignalR;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Cinema.Api.Hubs;

public class SeatLockerNotificationService : ISeatLockerNotificationService
{
    private readonly IHubContext<SeatHub> _hubContext;

    public SeatLockerNotificationService(IHubContext<SeatHub> hubContext)
    {
        _hubContext = hubContext;
    }

    public async Task NotifySeatsReleasedAsync(string scheduleId, List<string> seatIds)
    {
        foreach (var seatId in seatIds)
        {
            await _hubContext.Clients.Group(scheduleId).SendAsync("OnSeatUnselected", seatId);
        }
    }
}
