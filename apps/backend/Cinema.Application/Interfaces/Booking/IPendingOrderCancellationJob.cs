using System;
using System.Threading.Tasks;

namespace Cinema.Application.Interfaces.Booking;

public interface IPendingOrderCancellationJob
{
    Task ExecuteForOrderAsync(Guid orderId);
}
