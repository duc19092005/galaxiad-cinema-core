// ReSharper disable All
using System.ComponentModel.DataAnnotations.Schema;
using BusinessLayer.Entities.CinemaInfos;

namespace BusinessLayer.Entities.UserInfos;

public class UserSegmentsInfoEntity
{
    public Guid UserSegmentId { get; set; }

    [Column(TypeName = "nvarchar(50)")]
    public string UserSegmentName { get; set; } = string.Empty;
    
    [Column(TypeName = "nvarchar(2000)")]
    public string UserSegmentDescription { get; set; } = string.Empty;

    public List<CinemaSurchargeInfosEntity> CinemaSurchargeInfosEntity = [];
}

