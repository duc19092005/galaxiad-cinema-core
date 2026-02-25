using System.ComponentModel.DataAnnotations;

namespace BusinessLayer.Dtos.TheaterManager.MovieSchedules;



public class TheaterManagerAddMovieSchedulesRequest
{
    [Required(ErrorMessage = "Auditorium Id is required")]
    public Guid AuditoriumId {get;set;}
    
    [Required(ErrorMessage = "TheaterManager is required")]
    public List<SchedulesInfos> Slots {get;set;} = [];
}


public class TheaterManagerEditMovieSchedulesRequest
{
    public List<SchedulesInfos>? Slots {get;set;}
}

public class SchedulesInfos
{
    public Guid ScheduleId {get;set;}
    
    public Guid MovieId {get;set;}

    public Guid FormatId {get;set;}

    public DateTime StartedDate {get;set;}
}