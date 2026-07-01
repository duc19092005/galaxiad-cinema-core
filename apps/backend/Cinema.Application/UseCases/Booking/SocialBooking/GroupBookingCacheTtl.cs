namespace Cinema.Application.UseCases.Booking.SocialBooking;

internal static class GroupBookingCacheTtl
{
    private static readonly TimeSpan DefaultTtl = TimeSpan.FromMinutes(30);
    private static readonly TimeSpan ExpiryBuffer = TimeSpan.FromMinutes(5);
    private static readonly TimeSpan MinimumTtl = TimeSpan.FromMinutes(1);
    private static readonly TimeSpan PairRequestTtl = TimeSpan.FromMinutes(5);

    public static TimeSpan ForGroup(DateTime? expiresAt)
    {
        var ttl = expiresAt.HasValue
            ? expiresAt.Value - DateTime.UtcNow + ExpiryBuffer
            : DefaultTtl;

        return ttl < MinimumTtl ? MinimumTtl : ttl;
    }

    public static TimeSpan ForPairRequest(DateTime? expiresAt)
    {
        var groupTtl = ForGroup(expiresAt);
        return groupTtl < PairRequestTtl ? groupTtl : PairRequestTtl;
    }
}
