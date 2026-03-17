using Microsoft.AspNetCore.SignalR;

namespace ApiLayer.Hubs;

public class BookingHub : Hub
{
    // Khi có user nhấn vào ghế (chưa thanh toán)
    public async Task SelectSeat(Guid scheduleId, Guid seatId, string userName)
    {
        // Gửi cho tất cả những người khác đang xem cùng lịch chiếu đó
        await Clients.OthersInGroup(scheduleId.ToString()).SendAsync("SeatSelected", seatId, userName);
    }

    // Khi user bỏ chọn ghế
    public async Task UnselectSeat(Guid scheduleId, Guid seatId)
    {
        await Clients.OthersInGroup(scheduleId.ToString()).SendAsync("SeatUnselected", seatId);
    }

    // Tham gia vào phòng (room) của một lịch chiếu cụ thể
    public async Task JoinSchedule(Guid scheduleId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, scheduleId.ToString());
    }

    public async Task LeaveSchedule(Guid scheduleId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, scheduleId.ToString());
    }
}
