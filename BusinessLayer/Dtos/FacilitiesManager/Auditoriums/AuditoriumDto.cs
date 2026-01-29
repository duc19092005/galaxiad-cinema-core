using System.ComponentModel.DataAnnotations;

namespace BusinessLayer.Dtos.FacilitiesManager.Auditoriums;

public class AddReqAuditoriumDto
{
    [Required(ErrorMessage = "Error Auditorium Number cannot be empty")]
    [StringLength(10, MinimumLength = 3, ErrorMessage = "Auditorium Number must be between 3 and 10 characters")]
    public string AuditoriumNumber { get; set; } = string.Empty;
    
    [Required(ErrorMessage = "Error Movie Format cannot be empty")]
    public Guid MovieFormatId { get; set; }
    
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

    public Guid? MovieFormatId { get; set; }


    public Guid? CinemaId { get; set; }
    
    public List<ReqSeatsAuditoriumDto>? AddReqSeatsAuditoriumDto { get; set; }
}

public class GetResAuditoriumDtoCinema
{
    public Guid AuditoriumId { get; set; }
    
    public string AuditoriumNumber { get; set; } = string.Empty;
    
    public string MovieFormatName { get; set; } = string.Empty;

    public string CinemaName { get; set; } = string.Empty;
    
    public int TotalSeats { get; set; }
}

public class GetResAuditoriumDto
{
    public Guid AuditoriumId { get; set; }
    
    public string AuditoriumNumber { get; set; } = string.Empty;
    
    public string MovieFormatName { get; set; } = string.Empty;

    public string CinemaName { get; set; } = string.Empty;
    
    public int TotalSeats { get; set; }

    public List<ReqSeatsAuditoriumDto> SeatsInfos { get; set; } = [];
}
