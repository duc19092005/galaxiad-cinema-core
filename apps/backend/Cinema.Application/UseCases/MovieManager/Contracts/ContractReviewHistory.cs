using System.Text.Json;
using Cinema.Domain.Entities.Contracts;

namespace Cinema.Application.UseCases.MovieManager.Contracts;

// Stored in the revision's existing Unicode JSON column; the client cannot supply history.
public static class ContractReviewHistory
{
    public static void Append(ContractRevisionEntity revision, Guid actorId, string action, object data, string? actorName = null)
    {
        var options = new JsonSerializerOptions(JsonSerializerDefaults.Web);
        var previous = JsonSerializer.Deserialize<JsonElement>(revision.ReviewedDataJson);
        var events = previous.TryGetProperty("events", out var existing)
            ? existing.EnumerateArray().ToList() : new List<JsonElement>();
        if (events.Count == 0 && previous.EnumerateObject().Any())
            events.Add(JsonSerializer.SerializeToElement(new { action = "LEGACY", after = previous }, options));
        var lastReview = events.LastOrDefault(e => e.TryGetProperty("action", out var a) && a.GetString() == "REVIEW");
        events.Add(JsonSerializer.SerializeToElement(new
        {
            actorId, actorName, action, at = DateTime.UtcNow,
            before = lastReview.ValueKind == JsonValueKind.Object ? lastReview.GetProperty("after") : (object?)null,
            after = data
        }, options));
        revision.ReviewedDataJson = JsonSerializer.Serialize(new { events }, options);
    }
}
