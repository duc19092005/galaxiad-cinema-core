
using System.ComponentModel.DataAnnotations;

namespace Cinema.Application.Dtos.FacilitiesManager.Cinemas.Requests;

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

    [Required(ErrorMessage = "Cinema City is Required")]
    [MaxLength(100, ErrorMessage = "Cinema City cannot exceed 100 characters")]
    public string CinemaCity { get; set; } = string.Empty;
    
    public double? Latitude { get; set; }
    public double? Longitude { get; set; }
    
    [Required(ErrorMessage = "Release Date is Required")]
    public DateTime? ActiveAt { get; set; }
    
    /// <summary>
    /// Helper list for Frontend to display city selection
    /// </summary>
    public static readonly List<string> VietnamCities = new()
    {
        "Hồ Chí Minh", "Hà Nội", "Đà Nẵng", "Hải Phòng", "Cần Thơ", 
        "Bình Dương", "Đồng Nai", "Khánh Hòa", "Quảng Ninh", "Bà Rịa - Vũng Tàu"
    };
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

    [MaxLength(100, ErrorMessage = "Cinema City cannot exceed 100 characters")]
    public string? CinemaCity { get; set; }
    
    public double? Latitude { get; set; }
    public double? Longitude { get; set; }
    
    public DateTime? ActiveAt { get; set; }
}
