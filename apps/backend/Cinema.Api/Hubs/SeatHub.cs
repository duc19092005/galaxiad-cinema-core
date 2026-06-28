using Microsoft.AspNetCore.SignalR;
using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Cinema.Api.Hubs;

public class SeatHub : Hub
{
    private static readonly ConcurrentDictionary<string, ConcurrentDictionary<string, (string UserName, string ConnectionId)>> _scheduleLockedSeats = new();

    public async Task JoinSchedule(string scheduleId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, scheduleId);

        // Send all currently locked seats in this schedule to the caller
        var lockedSeats = _scheduleLockedSeats.TryGetValue(scheduleId, out var seats)
            ? seats.ToDictionary(k => k.Key, v => v.Value.UserName)
            : new Dictionary<string, string>();

        await Clients.Caller.SendAsync("OnInitialLockedSeats", lockedSeats);
    }

    public async Task LeaveSchedule(string scheduleId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, scheduleId);
    }

    public async Task SelectSeat(string scheduleId, string seatId, string userName)
    {
        var seats = _scheduleLockedSeats.GetOrAdd(scheduleId, _ => new ConcurrentDictionary<string, (string, string)>());
        seats[seatId] = (userName, Context.ConnectionId);

        await Clients.OthersInGroup(scheduleId).SendAsync("OnSeatSelected", seatId, userName);
    }

    public async Task UnselectSeat(string scheduleId, string seatId)
    {
        if (_scheduleLockedSeats.TryGetValue(scheduleId, out var seats))
        {
            seats.TryRemove(seatId, out _);
        }

        await Clients.OthersInGroup(scheduleId).SendAsync("OnSeatUnselected", seatId);
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        var connectionId = Context.ConnectionId;

        // Find all seats locked by this connection across all schedules
        foreach (var schedulePair in _scheduleLockedSeats)
        {
            var scheduleId = schedulePair.Key;
            var seats = schedulePair.Value;

            var seatsToRemove = seats.Where(s => s.Value.ConnectionId == connectionId).Select(s => s.Key).ToList();

            foreach (var seatId in seatsToRemove)
            {
                if (seats.TryRemove(seatId, out _))
                {
                    await Clients.OthersInGroup(scheduleId).SendAsync("OnSeatUnselected", seatId);
                }
            }
        }

        await base.OnDisconnectedAsync(exception);
    }
}
