namespace Cinema.Application.Interfaces.Booking;

public sealed record SeatLockInfo(
    string ScheduleId,
    string SeatId,
    string UserName,
    string OwnerToken,
    string OwnerType,
    Guid? GroupSessionId,
    Guid? MemberId,
    Guid? UserSegmentId,
    DateTime CreatedAtUtc);

public sealed record SeatLockAcquireResult(
    bool Success,
    string? Message,
    SeatLockInfo? CurrentLock);

public sealed record SeatLockRenewResult(
    bool Success,
    string? Message,
    IReadOnlyList<SeatLockInfo> RenewedLocks);

public interface ISeatLockService
{
    Task<SeatLockAcquireResult> TryLockSeatAsync(
        string scheduleId,
        string seatId,
        string userName,
        string ownerToken,
        string ownerType,
        TimeSpan ttl,
        Guid? groupSessionId = null,
        Guid? memberId = null,
        Guid? userSegmentId = null);

    Task<bool> UnlockSeatAsync(string scheduleId, string seatId, string ownerToken);

    Task ForceUnlockSeatAsync(string scheduleId, string seatId);

    Task<SeatLockRenewResult> RenewLocksForOwnerAsync(string scheduleId, string ownerToken, TimeSpan ttl);

    Task ReleaseSeatsByOwnerAsync(string ownerToken);

    Task ReleaseSeatsForScheduleAsync(string scheduleId, IEnumerable<string> seatIds);

    Task<IReadOnlyList<SeatLockInfo>> GetLocksForScheduleAsync(string scheduleId);

    Task<IReadOnlyList<SeatLockInfo>> GetLocksForOwnerAsync(string scheduleId, string ownerToken);

    Task<IReadOnlyList<SeatLockInfo>> GetLocksForOwnerAsync(string ownerToken);
}
