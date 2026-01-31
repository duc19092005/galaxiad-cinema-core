namespace BusinessLayer.Dtos.TheaterManager.MovieSchedules;



class TheaterManagerAddMovieSchedulesRequest
{
    public Guid AuditoriumId {get;set;}

    public List<SchedulesInfos> Slots {get;set;} = [];
}


class TheaterManagerEditMovieSchedulesRequest
{
    public Guid AuditoriumId {get;set;}

    public List<SchedulesInfos>? Slots {get;set;}

}

class SchedulesInfos
{
    public Guid MovieId {get;set;}

    public Guid FormatId {get;set;}

    public DateTime StartedTime {get;set;}

    public int Duration {get;set;}
    public DateTime EndedTime {get;set;}

}