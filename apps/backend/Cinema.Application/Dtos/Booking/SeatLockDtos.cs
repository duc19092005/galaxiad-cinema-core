using System.Text.Json.Serialization;

namespace Cinema.Application.Dtos.Booking;

public class ReqLockSeatDto
{
    [JsonPropertyName("scheduleId")]
    public string ScheduleId { get; set; } = string.Empty;

    [JsonPropertyName("seatId")]
    public string SeatId { get; set; } = string.Empty;

    [JsonPropertyName("userName")]
    public string UserName { get; set; } = string.Empty;

    [JsonPropertyName("clientId")]
    public string? ClientId { get; set; }
}

public class ReqUnlockSeatDto
{
    [JsonPropertyName("scheduleId")]
    public string ScheduleId { get; set; } = string.Empty;

    [JsonPropertyName("seatId")]
    public string SeatId { get; set; } = string.Empty;

    [JsonPropertyName("clientId")]
    public string? ClientId { get; set; }
}

public class ResSeatLockDto
{
    [JsonPropertyName("success")]
    public bool Success { get; set; }

    [JsonPropertyName("message")]
    public string? Message { get; set; }

    [JsonPropertyName("lockedSeats")]
    public Dictionary<string, string> LockedSeats { get; set; } = new();
}
