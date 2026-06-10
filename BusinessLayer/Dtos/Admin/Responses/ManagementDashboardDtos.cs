namespace BusinessLayer.Dtos.Admin.Responses;

public class ManagementDashboardDto
{
    public int TicketsSoldToday { get; set; }
    public decimal RevenueToday { get; set; }
    public int TotalTicketsSold { get; set; }
    public string BusiestHourLabel { get; set; } = "N/A";
    public List<RecentTransactionDto> RecentTransactions { get; set; } = [];
    public List<MovieTicketStatDto> TicketsByMovie { get; set; } = [];
    public List<HourlyTicketStatDto> TicketsByHour { get; set; } = [];
    public List<HotMovieDto> HotMovies { get; set; } = [];
    public List<RecentMovieDto> RecentMovies { get; set; } = [];
    public List<RecentCinemaDto> RecentCinemas { get; set; } = [];
    public List<RecentAuditoriumDto> RecentAuditoriums { get; set; } = [];
    public List<AuditLogDto> RecentActivities { get; set; } = [];
}

public class RecentTransactionDto
{
    public Guid OrderId { get; set; }
    public DateTime OrderDate { get; set; }
    public string MovieName { get; set; } = string.Empty;
    public string CinemaName { get; set; } = string.Empty;
    public int TicketCount { get; set; }
    public decimal TotalPrice { get; set; }
    public string CustomerName { get; set; } = string.Empty;
}

public class MovieTicketStatDto
{
    public Guid MovieId { get; set; }
    public string MovieName { get; set; } = string.Empty;
    public int TicketsSold { get; set; }
    public decimal Revenue { get; set; }
}

public class HourlyTicketStatDto
{
    public int Hour { get; set; }
    public string HourLabel { get; set; } = string.Empty;
    public int TicketsSold { get; set; }
}

public class HotMovieDto
{
    public Guid MovieId { get; set; }
    public string MovieName { get; set; } = string.Empty;
    public string MovieImageUrl { get; set; } = string.Empty;
    public int TicketsSold { get; set; }
    public decimal Revenue { get; set; }
}

public class RecentMovieDto
{
    public Guid MovieId { get; set; }
    public string MovieName { get; set; } = string.Empty;
    public string MovieImageUrl { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public string CreatedBy { get; set; } = string.Empty;
}

public class RecentCinemaDto
{
    public Guid CinemaId { get; set; }
    public string CinemaName { get; set; } = string.Empty;
    public string CinemaLocation { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public string CreatedBy { get; set; } = string.Empty;
}

public class RecentAuditoriumDto
{
    public Guid AuditoriumId { get; set; }
    public string AuditoriumNumber { get; set; } = string.Empty;
    public string CinemaName { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public string CreatedBy { get; set; } = string.Empty;
}
