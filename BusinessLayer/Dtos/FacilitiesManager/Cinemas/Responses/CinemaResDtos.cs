namespace BusinessLayer.Dtos.FacilitiesManager.Cinemas.Responses;

public class ResFacilitiesManagerCinema
{
    public Guid CinemaId { get; set; }
    public string CinemaName { get; set; } = String.Empty;
    public string CinemaDescription { get; set; } = string.Empty;
    public string CinemaHotlineNumber { get; set; } = String.Empty;
    public string CinemaLocation { get; set; } = String.Empty;
    public int TotalRooms { get; set; }
}
