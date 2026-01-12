// ReSharper disable All

using System.ComponentModel.DataAnnotations;

namespace BussinessLayer.Dtos.cinemas;

public class add_cinema_req_dto
{
    [Required(ErrorMessage = "Cinema Location is Required")]
    [MaxLength(50, ErrorMessage = "Cinema Location cannot exceed 50 characters")]
    public string cinemaLocation { get; set; } = String.Empty;

    [Required(ErrorMessage = "Cinema Name is Required")]
    [MaxLength(50, ErrorMessage = "Cinema Name cannot exceed 50 characters")]
    public string cinemaName { get; set; } = string.Empty;
    
    [Required(ErrorMessage = "Cinema Hotline number is required")]
    [MaxLength(10, ErrorMessage = "Cinema cinemaHotlineNumber cannot exceed 50 characters")]
    public string cinemaHotlineNumber { get; set; } = string.Empty;
    
    [Required(ErrorMessage = "Cinema Description is Required")]
    public string cinemaDescription { get; set; } = string.Empty;
    
    [Required(ErrorMessage = "Release Date is Required")]
    public DateTime activeAt { get; set; }
}

public class edit_cinema_req_dto
{
    [MaxLength(50, ErrorMessage = "Cinema Location cannot exceed 50 characters")]
    public string? cinemaLocation { get; set; }

    [MaxLength(50, ErrorMessage = "Cinema Name cannot exceed 50 characters")]
    public string? cinemaName { get; set; }
    
    [MaxLength(10, ErrorMessage = "Cinema cinemaHotlineNumber cannot exceed 50 characters")]
    public string? cinemaHotlineNumber { get; set; }
    
    public string? cinemaDescription { get; set; } = string.Empty;
    
    public DateTime? activeAt { get; set; }
}