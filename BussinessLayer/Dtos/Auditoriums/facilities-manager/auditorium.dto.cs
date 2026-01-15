using System.ComponentModel.DataAnnotations;

namespace BussinessLayer.Dtos.Auditoriums.facilities_manager;

public class add_req_auditorium_dto
{
    [Required(ErrorMessage = "Error Auditorium Number cannot be empty")]
    // Dùng StringLength thay vì Length
    [StringLength(10, MinimumLength = 3, ErrorMessage = "Auditorium Number must be between 3 and 10 characters")]
    public string auditoriumNumber { get; set; } = string.Empty;
    
    // Nên dùng Guid? để [Required] có thể bắt được trường hợp thiếu hẳn field này trong JSON
    [Required(ErrorMessage = "Error Movie Format cannot be empty")]
    public Guid movieFormatId { get; set; }
    
    [Required(ErrorMessage = "Error Cinema cannot be empty")]
    public Guid cinemaId { get; set; }

    [Required]
    [MinLength(1, ErrorMessage = "Auditorium must have at least one seat")]
    public List<req_seats_auditorium_dto> add_req_seats_auditorium_dto { get; set; } = new();
}

public class req_seats_auditorium_dto
{
    [Required(ErrorMessage = "Error Seat Number cannot be empty")]
    [StringLength(10, MinimumLength = 2, ErrorMessage = "Seat Number must be between 3 and 10 characters")]
    public string seatNumber { get; set; } = string.Empty;
    
    // Nếu bạn chấp nhận tọa độ = 0 thì dùng Range(0, ...)
    [Range(0, double.MaxValue, ErrorMessage = "coordX must be >= 0")]
    public double coordX { get; set; } 
    
    [Range(0, double.MaxValue, ErrorMessage = "coordY must be >= 0")]
    public double coordY { get; set; }

    public int colIndex { get; set; }

    public int rowIndex { get; set; }
}

public class edit_req_auditorium_dto
{

    public string? auditoriumNumber { get; set; }

    public Guid? movieFormatId { get; set; }


    public Guid? cinemaId { get; set; }



    public List<req_seats_auditorium_dto>? add_req_seats_auditorium_dto { get; set; }

}

public class get_res_auditorium_dto
{
    public Guid auditoriumId { get; set; }
    
    public string auditoriumNumber { get; set; } = string.Empty;
    
    public string movieFormatName { get; set; } = string.Empty;
    
    public string cinemaName { get; set; }
    
    public int totalSeats { get; set; }

    public List<req_seats_auditorium_dto> seatsInfos { get; set; } = [];
}
