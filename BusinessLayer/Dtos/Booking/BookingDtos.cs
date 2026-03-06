using System.ComponentModel.DataAnnotations;

namespace BusinessLayer.Dtos.Booking;

// ==========================================
// PUBLIC - Movie Listing (Now Showing / Coming Soon)
// ==========================================

public class ResPublicMovieListDto
{
    public Guid MovieId { get; set; }
    public string MovieName { get; set; } = string.Empty;
    public string MovieImageUrl { get; set; } = string.Empty;
    public string MovieDescription { get; set; } = string.Empty;
    public int MovieDuration { get; set; }
    public DateTime StartedDate { get; set; }
    public DateTime EndedDate { get; set; }
    public string MovieRequiredAgeSymbol { get; set; } = string.Empty;
    public List<string> MovieGenres { get; set; } = [];
    public List<string> MovieFormats { get; set; } = [];
}

// ==========================================
// PUBLIC - Movie Detail
// ==========================================

public class ResPublicMovieDetailDto
{
    public Guid MovieId { get; set; }
    public string MovieName { get; set; } = string.Empty;
    public string MovieImageUrl { get; set; } = string.Empty;
    public string MovieDescription { get; set; } = string.Empty;
    public string TrailerUrl { get; set; } = string.Empty;
    public string Director { get; set; } = string.Empty;
    public string Actors { get; set; } = string.Empty;
    public int MovieDuration { get; set; }
    public DateTime StartedDate { get; set; }
    public DateTime EndedDate { get; set; }
    public string MovieRequiredAgeSymbol { get; set; } = string.Empty;
    public List<string> MovieGenres { get; set; } = [];
    public List<string> MovieFormats { get; set; } = [];
}

// ==========================================
// PUBLIC - Cinema Listing by City for a Movie
// ==========================================

public class ResPublicCinemaShowtimeDto
{
    public Guid CinemaId { get; set; }
    public string CinemaName { get; set; } = string.Empty;
    public string CinemaLocation { get; set; } = string.Empty;
    public string CinemaCity { get; set; } = string.Empty;
    public List<FormatShowtimeGroup> FormatShowtimes { get; set; } = [];
}

public class FormatShowtimeGroup
{
    public Guid FormatId { get; set; }
    public string FormatName { get; set; } = string.Empty;
    public List<ShowtimeSlot> Showtimes { get; set; } = [];
}

public class ShowtimeSlot
{
    public Guid ScheduleId { get; set; }
    public DateTime StartTime { get; set; }
    public DateTime EndedTime { get; set; }
    public Guid AuditoriumId { get; set; }
    public string AuditoriumNumber { get; set; } = string.Empty;
}

// ==========================================
// PUBLIC - Seat Map for a Schedule
// ==========================================

public class ResPublicSeatMapDto
{
    public Guid ScheduleId { get; set; }
    public string AuditoriumNumber { get; set; } = string.Empty;
    public string MovieName { get; set; } = string.Empty;
    public string FormatName { get; set; } = string.Empty;
    public DateTime StartTime { get; set; }
    public List<SeatDto> Seats { get; set; } = [];
}

public class SeatDto
{
    public Guid SeatId { get; set; }
    public string SeatNumber { get; set; } = string.Empty;
    public int ColIndex { get; set; }
    public int RowIndex { get; set; }
    
    /// <summary>
    /// true = đã có người đặt hoặc đang pending, false = còn trống
    /// </summary>
    public bool IsOccupied { get; set; }
}

// ==========================================
// BOOKING - Create Order Request
// ==========================================

public class ReqCreateBookingDto
{
    [Required(ErrorMessage = "Schedule Id is required")]
    public Guid ScheduleId { get; set; }
    
    [Required(ErrorMessage = "Seat Ids are required")]
    [MinLength(1, ErrorMessage = "At least one seat must be selected")]
    public List<Guid> SeatIds { get; set; } = [];
    
    [StringLength(50)]
    public string? CustomerName { get; set; }
    
    [StringLength(200)]
    public string? CustomerAddress { get; set; }
    
    [StringLength(40)]
    [EmailAddress(ErrorMessage = "Invalid email format")]
    public string? CustomerEmail { get; set; }
}

// ==========================================
// PUBLIC - Pricing Information
// ==========================================

public class ResPublicPricingDto
{
    public Guid ScheduleId { get; set; }
    public decimal BasePrice { get; set; }
    public List<SegmentPriceDto> SegmentPrices { get; set; } = [];
}

public class SegmentPriceDto
{
    public Guid UserSegmentId { get; set; }
    public string SegmentName { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public decimal FinalPrice { get; set; }
}

// ==========================================
// BOOKING - Create Order Response (with VNPay URL)
// ==========================================

public class ResCreateBookingDto
{
    public Guid OrderId { get; set; }
    public string PaymentUrl { get; set; } = string.Empty;
    public decimal TotalPrice { get; set; }
    public int TotalQuantity { get; set; }
    public DateTime OrderDate { get; set; }
}

// ==========================================
// CITIES
// ==========================================

public class ResPublicCityListDto
{
    public string CityName { get; set; } = string.Empty;
    public int CinemaCount { get; set; }
}
