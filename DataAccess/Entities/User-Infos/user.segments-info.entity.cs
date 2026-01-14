// ReSharper disable All
using System.ComponentModel.DataAnnotations.Schema;
using DataAccess.Entities.Cinema_Infos;

namespace DataAccess.Entities.User_Info;

public class user_segments_info_entity
{
    public Guid userSegmentId { get; set; }

    [Column(TypeName = "nvarchar(50)")]
    public string userSegmentName { get; set; } = string.Empty;
    
    [Column(TypeName = "nvarchar(2000)")]
    public string userSegmentDescription { get; set; } = string.Empty;

    public List<cinema_surcharge_infos_entity> cinema_surcharge_infos_entity = [];
}