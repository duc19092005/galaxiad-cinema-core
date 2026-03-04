

public class MovieInfoRes : BaseMovieInfoRes
{
    public bool IsCommingSoon { get; set; }
}

public class MovieDetailInfoRes : BaseMovieInfoRes
{
    public string MovieDescription { get; set; } = string.Empty;

    public DateTime ReleaseDate { get; set; }

    public string Actor {get;set;} = string.Empty;

    public string Director {get;set;} = string.Empty;

    public bool IsCommingSoon { get; set; }

}

public class GetScheduleDetailsRes
{
    public string CinemaName {get;set;} = string.Empty;

    public string CinemaAddress {get;set;} = string.Empty;

    public string MovieFormatName {get;set;} = string.Empty;

    public List<GetScheduleTimeRes> ScheduleTimesInfos {get;set;} = [];
}

public class GetPriceInfos
{
    public string UserType {get;set;} = string.Empty;

    public long Price {get;set;}
}

public class GetAuditoriumInfosRes
{
    public string AuditoriumName {get;set;} = string.Empty;

    public string AuditoriumId {get;set;} = string.Empty;

    public List<GetSeatsRes> SeatsInfos {get;set;} = [];
}

// Schedule Time Response LƯU Ý : NÓ CHỈ LÀ CON ĐỂ TRẢ VỀ TH CHỨ KO TRẢ VỀ THẰNG NÀY RIÊNG LẺ
// CỤM TRẢ VỀ SẼ LÀ 1 LIST CỦA CỤM GETSCHEDULEDETAILSRES ĐỂ TRẢ VỀ NHỮNG LỊCH CHIẾU CỦA 1 NGÀY ĐÓ
public class GetScheduleTimeRes
{
    public Guid ScheduleId {get;set;}

    public DateTime ShowTime {get;set;}
}

public class GetSeatsRes
{
    public Guid SeatId {get;set;}

    public string SeatName {get;set;} = string.Empty;

    public double CoordX { get; set; } 
    
    public double CoordY { get; set; }
    
    // Thông tin GRID VIEW

    public int ColIndex { get; set; }

    public int RowIndex { get; set; }

    public bool IsBooked {get;set;}
}

// Lopws nayf để kế thừa cho nhanh

public class BaseMovieInfoRes
{
    public Guid MovieId { get; set; }

    public string MovieName { get; set; } = string.Empty;

    public string MoviePosterURL { get; set; } = string.Empty;

    public string MovieFormatInfos {get;set;} = String.Empty;

    public int MovieDuration { get; set; }

    public string MovieRequiredAge { get; set; } = string.Empty;

    public string MovieCategoryInfos {get;set;} = string.Empty;
}
