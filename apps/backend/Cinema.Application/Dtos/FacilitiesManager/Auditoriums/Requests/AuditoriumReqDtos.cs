using System.ComponentModel.DataAnnotations;

namespace Cinema.Application.Dtos.FacilitiesManager.Auditoriums.Requests;

public class AddReqAuditoriumDto
{
    [Required(ErrorMessage = "Error Auditorium Number cannot be empty")]
    [StringLength(10, MinimumLength = 3, ErrorMessage = "Auditorium Number must be between 3 and 10 characters")]
    public string AuditoriumNumber { get; set; } = string.Empty;

    [Required(ErrorMessage = "Error Movie Format cannot be empty")]
    public List<Guid> MovieFormatId { get; set; } = [];
    
    [Required(ErrorMessage = "Error Cinema cannot be empty")]
    public Guid CinemaId { get; set; }

    [Required]
    [MinLength(1, ErrorMessage = "Auditorium must have at least one seat")]
    public List<ReqSeatsAuditoriumDto> AddReqSeatsAuditoriumDto { get; set; } = [];
}

public class ReqSeatsAuditoriumDto
{
    [Required(ErrorMessage = "Error Seat Number cannot be empty")]
    [StringLength(10, MinimumLength = 2, ErrorMessage = "Seat Number must be between 3 and 10 characters")]
    public string SeatNumber { get; set; } = string.Empty;
    
    [Range(0, double.MaxValue, ErrorMessage = "coordX must be >= 0")]
    public double CoordX { get; set; } 
    
    [Range(0, double.MaxValue, ErrorMessage = "coordY must be >= 0")]
    public double CoordY { get; set; }

    public int ColIndex { get; set; }

    public int RowIndex { get; set; }
}

public class EditReqAuditoriumDto
{

    public string? AuditoriumNumber { get; set; }
    
    public Guid? CinemaId { get; set; }

    public List<Guid> FormatInfos { get; set; } = [];
    
    public List<ReqSeatsAuditoriumDto>? AddReqSeatsAuditoriumDto { get; set; }
    
}
