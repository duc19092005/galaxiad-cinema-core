using Microsoft.AspNetCore.SignalR;

namespace ApiLayer.Hubs;

public class BookingHub : Hub
{
    public async Task SelectSeat(Guid scheduleId, Guid seatId, string userName)
    {
        await Clients.OthersInGroup(scheduleId.ToString()).SendAsync("SeatSelected", seatId, userName);
    }

    public async Task UnselectSeat(Guid scheduleId, Guid seatId)
    {
        await Clients.OthersInGroup(scheduleId.ToString()).SendAsync("SeatUnselected", seatId);
    }

    public async Task JoinSchedule(Guid scheduleId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, scheduleId.ToString());
    }

    public async Task LeaveSchedule(Guid scheduleId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, scheduleId.ToString());
    }
}
