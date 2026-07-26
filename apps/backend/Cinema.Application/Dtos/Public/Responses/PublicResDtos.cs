using Cinema.Application.Dtos;

namespace Cinema.Application.Dtos.Public.Responses;

public class MovieInfoRes : BaseMovieInfoRes
{
    public bool IsCommingSoon { get; set; }
    
    public DateTime ExpectedReleaseDate { get; set; }
}

public class MovieDetailInfoRes : BaseMovieInfoRes
{
    public string MovieDescription { get; set; } = string.Empty;

    public DateTime ReleaseDate { get; set; }

    public string Actor {get;set;} = string.Empty;

    public string Director {get;set;} = string.Empty;

    /// <summary>Directors with optional TMDB profile photos (enriched server-side).</summary>
    public List<MoviePersonRes> Directors { get; set; } = [];

    /// <summary>Cast with optional TMDB profile photos (enriched server-side).</summary>
    public List<MoviePersonRes> Cast { get; set; } = [];

    public bool IsCommingSoon { get; set; }

    public string TrailerUrl { get; set; } = string.Empty;

    /// <summary>Multiple cover / banner images for hero carousel.</summary>
    public List<MovieCoverImageRes> CoverImages { get; set; } = [];
}

public class MoviePersonRes
{
    public string Name { get; set; } = string.Empty;

    public string? ProfileUrl { get; set; }

    public int? TmdbId { get; set; }
}

/// <summary>Public person (actor/director) detail. Filmography is internal catalog only.</summary>
public class MoviePersonDetailRes
{
    public string Name { get; set; } = string.Empty;

    /// <summary>actor | director</summary>
    public string Role { get; set; } = "actor";

    public string? ProfileUrl { get; set; }

    public int? TmdbId { get; set; }

    public string? KnownForDepartment { get; set; }

    /// <summary>Movies from this cinema catalog (not external TMDB filmography).</summary>
    public PagedResult<MovieInfoRes> Movies { get; set; } = new();
}

public class MovieCoverImageRes
{
    public Guid MovieCoverImageId { get; set; }

    public string ImageUrl { get; set; } = string.Empty;

    public int SortOrder { get; set; }

    public bool IsPrimary { get; set; }

    public string? Caption { get; set; }
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
    public Guid CinemaId { get; set; }

    public string MovieName { get; set; } = string.Empty;

    public string MovieVisualFormatName { get; set; } = string.Empty;

    public string MovieRequiredAgeSymbol { get; set; } = string.Empty;

    public string AuditoriumName {get;set;} = string.Empty;

    public string AuditoriumId {get;set;} = string.Empty;

    public DateTime StartTime { get; set; }

    public int CenterRowStart { get; set; }
    public int CenterRowEnd { get; set; }
    public int CenterColStart { get; set; }
    public int CenterColEnd { get; set; }

    public List<GetSeatsRes> SeatMap {get;set;} = [];
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

// Lớp này để kế thừa cho nhanh

public class BaseMovieInfoRes
{
    public Guid MovieId { get; set; }

    public string MovieName { get; set; } = string.Empty;

    public string MoviePosterURL { get; set; } = string.Empty;

    public string MovieBannerURL { get; set; } = string.Empty;

    public string MovieFormatInfos {get;set;} = String.Empty;

    public int MovieDuration { get; set; }

    public string MovieRequiredAge { get; set; } = string.Empty;

    public string MovieCategoryInfos {get;set;} = string.Empty;
}
