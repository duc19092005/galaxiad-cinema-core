using Microsoft.AspNetCore.SignalR;

namespace ApiLayer.Hubs;

public class SeatHub : Hub
{
    public async Task JoinSchedule(string scheduleId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, scheduleId);
    }

    public async Task LeaveSchedule(string scheduleId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, scheduleId);
    }

    public async Task SelectSeat(string scheduleId, string seatId, string userName)
    {
        await Clients.OthersInGroup(scheduleId).SendAsync("OnSeatSelected", seatId, userName);
    }

    public async Task UnselectSeat(string scheduleId, string seatId)
    {
        await Clients.OthersInGroup(scheduleId).SendAsync("OnSeatUnselected", seatId);
    }
}
