using System.Collections.Generic;
using System.Threading.Tasks;

namespace Cinema.Application.Interfaces.Booking;

public interface ISeatLockerNotificationService
{
    Task NotifySeatsReleasedAsync(string scheduleId, List<string> seatIds);
}
