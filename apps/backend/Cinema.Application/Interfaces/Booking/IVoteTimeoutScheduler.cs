namespace Cinema.Application.Interfaces.Booking;

public interface IVoteTimeoutScheduler
{
    void Schedule(Guid groupSessionId, DateTime endTimeUtc);
    void Cancel(Guid groupSessionId);
}
