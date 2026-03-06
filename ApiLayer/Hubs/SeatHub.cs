using Microsoft.AspNetCore.SignalR;

namespace ApiLayer.Hubs;

public class SeatHub : Hub
{
    // Tham gia vào phòng (room) theo ScheduleId khi user vào trang chọn ghế
    public async Task JoinSchedule(string scheduleId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, scheduleId);
    }

    // Rời phòng khi user thoái khỏi trang chọn ghế
    public async Task LeaveSchedule(string scheduleId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, scheduleId);
    }

    // Gửi thông báo đang chọn ghế (Lock ghế tạm thời trên giao diện)
    public async Task SelectSeat(string scheduleId, string seatId, string userName)
    {
        // Gửi sự kiện OnSeatSelected cho tất cả những người khác trong phòng
        await Clients.OthersInGroup(scheduleId).SendAsync("OnSeatSelected", seatId, userName);
    }

    // Gửi thông báo bỏ chọn ghế
    public async Task UnselectSeat(string scheduleId, string seatId)
    {
        // Gửi sự kiện OnSeatUnselected cho tất cả những người khác trong phòng
        await Clients.OthersInGroup(scheduleId).SendAsync("OnSeatUnselected", seatId);
    }
}
