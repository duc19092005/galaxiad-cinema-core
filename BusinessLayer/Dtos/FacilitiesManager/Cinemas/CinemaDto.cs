
using System.ComponentModel.DataAnnotations;

namespace BusinessLayer.Dtos.FacilitiesManager.Cinemas;

public class AddCinemaReqDto
{
    [Required(ErrorMessage = "Cinema Location is Required")]
    [MaxLength(50, ErrorMessage = "Cinema Location cannot exceed 50 characters")]
    public string CinemaLocation { get; set; } = String.Empty;

    [Required(ErrorMessage = "Cinema Name is Required")]
    [MaxLength(50, ErrorMessage = "Cinema Name cannot exceed 50 characters")]
    public string CinemaName { get; set; } = string.Empty;
    
    [Required(ErrorMessage = "Cinema Hotline number is required")]
    [MaxLength(10, ErrorMessage = "Cinema cinemaHotlineNumber cannot exceed 50 characters")]
    public string CinemaHotlineNumber { get; set; } = string.Empty;
    
    [Required(ErrorMessage = "Cinema Description is Required")]
    public string CinemaDescription { get; set; } = string.Empty;
    
    [Required(ErrorMessage = "Release Date is Required")]
    public DateTime? ActiveAt { get; set; }
}

public class EditCinemaReqDto
{
    [MaxLength(50, ErrorMessage = "Cinema Location cannot exceed 50 characters")]
    public string? CinemaLocation { get; set; }

    [MaxLength(50, ErrorMessage = "Cinema Name cannot exceed 50 characters")]
    public string? CinemaName { get; set; }
    
    [MaxLength(10, ErrorMessage = "Cinema cinemaHotlineNumber cannot exceed 50 characters")]
    public string? CinemaHotlineNumber { get; set; }
    
    public string? CinemaDescription { get; set; } = string.Empty;
    
    public DateTime? ActiveAt { get; set; }
}

public class ResFacilitiesManagerCinema
{
    public Guid CinemaId { get; set; }
    public string CinemaName { get; set; } = String.Empty;
    public string CinemaDescription { get; set; } = string.Empty;
    public string CinemaHotlineNumber { get; set; } = String.Empty;
    public string CinemaLocation { get; set; } = String.Empty;
    public int TotalRooms { get; set; }
}
