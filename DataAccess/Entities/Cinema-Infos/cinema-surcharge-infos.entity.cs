// ReSharper disable All

using System.ComponentModel.DataAnnotations.Schema;
using DataAccess.Entities.Movie_infos;
using DataAccess.Entities.User_Info;

namespace DataAccess.Entities.Cinema_Infos;

public class cinema_surcharge_infos_entity : base_management_status<user_info_entity>
{
    public Guid cinemaId { get; set; }
    
    public Guid movieFormatId { get; set; }
    
    public Guid userSegmentId { get; set; }

    [Column(TypeName = "decimal(5,2)")]
    public decimal surchangePercent { get; set; }

    public cinema_info_entity cinema_info_entity { get; set; } = null;

    public movieFormatInfoEntity movie_format_info_entity { get; set; } = null!;

    public user_segments_info_entity user_segments_info_entity { get; set; } = null!;
}