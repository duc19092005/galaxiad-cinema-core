// ReSharper disable All

using System.ComponentModel.DataAnnotations;

namespace BussinessLayer.Dtos.cinemas.facilities_manager;

public class res_facilities_manager_cinema
{
    public Guid cinemaId { get; set; }
    public string cinemaName { get; set; } = String.Empty;
    public string cinemaDescription { get; set; } = string.Empty;
    public string cinemaHotlineNumber { get; set; } = String.Empty;
    public string cinemaLocation { get; set; } = String.Empty;
    
    public int totalRooms { get; set; }
}
